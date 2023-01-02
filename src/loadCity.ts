import {computeLayout, Edge, Station} from "./graph"
import {FeatureCollection, GeoJSON, GeoJsonObject} from "geojson"
import * as d3 from "d3"
import {Vec} from "./vec"

function loadLargeJSON(path: string): any {
  // We want the file to be loaded but not parsed by smart completion features.
  // @ts-ignore
  return require(path)
}


function roundPosition(x: number, y: number, r: number = 8): [number, number] {
  return [Math.round(x / r) * r, Math.round(y / r) * r]
}

function getRawProjection(center: [number, number] = [21.006188, 52.231813], scale = 700000) {
  let baseProjection = d3.geoMercator()
    .scale(scale)
    .center(center)
  let alpha = Math.PI / 180 * 19
  let cosAlpha = Math.cos(alpha)
  let sinAlpha = Math.sin(alpha)
  return (x: number, y: number): [number, number] => {
    let [X, Y] = baseProjection([x, y])
    return roundPosition(X * cosAlpha - Y * sinAlpha, Y * cosAlpha + X * sinAlpha)
  }
}

function getProjection(rawProjection: (x: number, y: number) => [number, number]) {
  return d3.geoTransform({
    point: function (x, y) {
      this.stream.point(...rawProjection(x, y))
    },
  })
}

function extractName(name: string) {
  if (name == "") return "?"
  let match = name.match(/^(.*?)[ 0-9]*$/)[1]
  return match.replace("Warszawa", "Wawa")
}

function extractRouteName(name: string) {
  let match_1 = name.match(/^(.*?):/)
  if (match_1) name = match_1[1]
  let match_2 = name.match(/Tram ([0-9]+)/)
  if (match_2) name = match_2[1]
  return name
}

function routesMatch<T>(a: T[], b: T[]) {
  if (a.length != b.length) return false
  let n = a.length
  for (let i = 0; i < n; ++i) {
    if (a[i] != b[n - i - 1]) return false
  }
  return true
}

export function loadCity(): [Station[], Edge[]] {
  let stations: Station[] = []
  let edges: Edge[] = []

  type RelationMember = { ref: number, role: string }
  type Relation = { id: string, members: RelationMember[] }
  type RelationsJSON = { elements: Relation[] }
  // @ts-ignore
  let routes: RelationsJSON = require("/src/assets/routes.json")

  let routeIdToStationIds: Map<number, number[]> = new Map()
  let relevantFeatures: Set<number> = new Set()
  for (let route of routes.elements) {
    let stationIds = []
    for (let member of route.members) {
      if (member.role != "stop") continue
      stationIds.push(member.ref)
      relevantFeatures.add(member.ref)
    }
    routeIdToStationIds.set(+route.id, stationIds)
  }

  let routeIdToRouteName: Map<number, string> = new Map<number, string>()

  type RouteFeatureProperties = { name: string, ["@id"]: string }
  // @ts-ignore
  let city: FeatureCollection = require("/src/assets/export.geojson.json")

  let stationIdToName = new Map<number, string>()
  let stationNameToPositions = new Map<string, number[][]>()

  for (let feature of city.features) {
    let properties = feature.properties as RouteFeatureProperties
    let idString = properties["@id"]
    if (!properties.name || !idString || !feature.geometry) continue
    let id = +idString.match(/[0-9]+/)[0]
    if (!id) continue
    if (routeIdToStationIds.has(id)) {  // A relation.
      routeIdToRouteName.set(id, extractRouteName(properties.name))
      continue
    }
    if (!relevantFeatures.has(id)) continue
    let name = extractName(properties.name)
    stationIdToName.set(id, name)

    if (!stationNameToPositions.has(name)) stationNameToPositions.set(name, [])
    if (feature.geometry.type == "Polygon") {
      for (let i of feature.geometry.coordinates) {
        stationNameToPositions.get(name).push(...i)
      }
    } else if (feature.geometry.type == "Point") {
      stationNameToPositions.get(name).push(feature.geometry.coordinates)
    }
  }
  console.log(relevantFeatures)
  console.log(stationNameToPositions)

  let transform = getRawProjection()

  let stationNameToObject = new Map<string, Station>()

  for (let [name, positions] of stationNameToPositions.entries()) {
    if (positions.length < 1) continue
    let [sumX, sumY] = positions.reduce(([x_1, y_1], [x_2, y_2]) => [x_1 + x_2, y_1 + y_2])
    let averageX = sumX / positions.length, averageY = sumY / positions.length
    let position = Vec.pair(...transform(averageX, averageY))
    stationNameToObject.set(name, new Station(position, name))
  }

  let uniqueRoutes: Station[][] = []
  for (let [_, stationsInRoute] of routeIdToStationIds) {
    let route = []
    for (let stationId of stationsInRoute) {
      let stationName = stationIdToName.get(stationId)
      if (!stationName) continue
      let stationObject = stationNameToObject.get(stationName)
      if (!stationObject) continue
      route.push(stationObject)
    }

    let isUnique = true
    for (let i of uniqueRoutes) {
      if (routesMatch(route, i)) isUnique = false
    }
    if (isUnique)
      uniqueRoutes.push(route)
  }
  console.log(uniqueRoutes)

  for (let stationsInRoute of uniqueRoutes) {
    for (let i = 0; i + 1 < stationsInRoute.length; ++i) {
      let a = stationsInRoute[i], b = stationsInRoute[i + 1]
      if (a == b) continue
      edges.push(new Edge(a, b))
    }
  }

  return [[...stationNameToObject.values()], edges]
}

