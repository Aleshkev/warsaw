
import {FeatureCollection, GeoJSON, GeoJsonObject} from "geojson"
import * as d3 from "d3"
import {Vec} from "./vec"
import {
  EdgeModel,
  RouteDiagramModel,
  RouteGroupModel,
  RouteModel,
  StationModel,
} from "./model"

function roundPosition(x: number, y: number, r: number = 8): [number, number] {
  return [Math.round(x / r) * r, Math.round(y / r) * r]
}

function getRawProjection(center: [number, number] = [21.006188, 52.231813], scale = 700000) {
  let baseProjection = d3.geoMercator()
    .scale(scale)
    .center(center)
    .translate([0, 0])  // The default isn't zero 🥹 so much debugging
    .angle(-19)
  return (x, y) => baseProjection([x, y])!
}

function getProjection(rawProjection: (x: number, y: number) => [number, number]) {
  return d3.geoTransform({
    point: function (x, y) {
      this.stream.point(...rawProjection(x, y))
    },
  })
}

function extractStationName(osmName: string) {
  if (osmName == "") return "?"
  let match = osmName.match(/^(.*?)[ 0-9]*$/)![1]
  return match.replace("Warszawa", "Wawa")
}

function extractRouteName(osmName: string) {
  let match_1 = osmName.match(/^(.*?):/)
  if (match_1) osmName = match_1[1]
  let match_2 = osmName.match(/Tram ([0-9]+)/)
  if (match_2) osmName = match_2[1]
  return osmName
}

function routesMatch<T>(a: T[], b: T[]) {
  if (a.length != b.length) return false
  let n = a.length
  for (let i = 0; i < n; ++i) {
    if (a[i] != b[n - i - 1]) return false
  }
  return true
}

function randomColor() {
  return `hsl(${Math.random() * 360}, 73%, 62%)`
}


export function loadCity(map: RouteDiagramModel) {
  type RelationMember = { ref: number, role: string }
  type Relation = { id: string, members: RelationMember[] }
  type RelationsJSON = { elements: Relation[] }
  // @ts-ignore
  let routes: RelationsJSON = require("/src/assets/routes.json")

  let routeIdToStationIds: Map<number, number[]> = new Map()
  let relevantFeatures: Set<number> = new Set()
  for (let route of routes.elements) {
    let stationIds: number[] = []
    for (let member of route.members) {
      if (member.role.search("stop")) continue
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
    let id = +idString.match(/[0-9]+/)?.[0]!
    if (!id) continue
    if (routeIdToStationIds.has(id)) {  // A relation.
      routeIdToRouteName.set(id, extractRouteName(properties.name))
      continue
    }
    if (!relevantFeatures.has(id)) continue
    let name = extractStationName(properties.name)
    stationIdToName.set(id, name)

    if (!stationNameToPositions.has(name)) stationNameToPositions.set(name, [])
    if (feature.geometry.type == "Polygon") {
      for (let i of feature.geometry.coordinates) {
        stationNameToPositions.get(name)?.push(...i)
      }
    } else if (feature.geometry.type == "Point") {
      stationNameToPositions.get(name)?.push(feature.geometry.coordinates)
    }
  }
  console.log(relevantFeatures)
  console.log(stationNameToPositions)

  let transform = getRawProjection()

  let stationNameToObject = new Map<string, StationModel>()

  for (let [name, positions] of stationNameToPositions.entries()) {
    if (positions.length < 1) continue
    let [sumX, sumY] = positions.reduce(([x_1, y_1], [x_2, y_2]) => [x_1 + x_2, y_1 + y_2])
    let averageX = sumX / positions.length, averageY = sumY / positions.length
    let position = Vec.pair(...transform(averageX, averageY))
    stationNameToObject.set(name, new StationModel(position, name))
  }

  let usedRoutes: string[] = []
  let uniqueRoutes: StationModel[][] = []
  for (let [routeId, stationsInRoute] of routeIdToStationIds) {
    let route: StationModel[] = []
    for (let stationId of stationsInRoute) {
      let stationName = stationIdToName.get(stationId)
      if (!stationName) continue
      let stationObject = stationNameToObject.get(stationName)
      if (!stationObject) continue
      route.push(stationObject)
    }

    console.log(routeIdToRouteName.get(routeId))
    let isUnique = usedRoutes.indexOf(routeIdToRouteName.get(routeId)!) === -1

    if (isUnique) {
      uniqueRoutes.push(route)
      usedRoutes.push(routeIdToRouteName.get(routeId)!)
    }
  }
  console.log(uniqueRoutes)

    // let color = randomColor()
  let color = "black"
    let group = new RouteGroupModel(color)
  for (let stationsInRoute of uniqueRoutes) {
    // if(Math.random() < .5) {
    //   group = new RouteGroupModel(randomColor())
    // }
    let route = new RouteModel(group, "route", randomColor())
    map.addRoute(route)
    console.log(stationsInRoute)
    let last = stationsInRoute[0]
    route.pushStation(last, null)
    for (let i = 1; i < stationsInRoute.length; ++i) {
      if (stationsInRoute[i] == last) continue
      let b = stationsInRoute[i]
      route.pushStation(b, new EdgeModel())
      last = b
    }
  }
}

