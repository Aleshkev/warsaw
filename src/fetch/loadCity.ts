import {FeatureCollection, Geometry, Position} from "geojson"
import {Model} from "../data/model"
import {getAveragePixelPosition, getRawProjection} from "./geoProjection"
import {List, Map, Seq} from "immutable"
import {
  extractOSMId,
  extractRouteName,
  extractStationName, OSMId,
  OSMIdToRouteId, OSMIdToStationId,
} from "./fuzzyExtraction"
import {newEmptyDiagram} from "../data/mutateDiagram"
import {addStation} from "../data/mutateStation"
import {addRoute} from "../data/mutateRoute"
import {addRouteGroup} from "../data/mutateRouteGroup"
import {randomId} from "../util"
import slugify from "slugify"

function randomColor() {
  // `hsl(0, 73%, 62%)`
  // `hsl(50, 73%, 62%)`
  // `hsl(100, 73%, 62%)`
  // `hsl(64, 28%, 64%)`
  return `hsla(${Math.random() * 180}, 73%, 62%, 40%)`
}

function getOsmRoutes(): Map<OSMId, List<OSMId>> {
  type RelationMember = { ref: OSMId, role: string }
  type Relation = { id: string, members: RelationMember[] }
  type RelationsJSON = { elements: Relation[] }

  // @ts-ignore
  let routes: RelationsJSON = require("/src/assets/routes.json")

  let stationsInRoute: Map<OSMId, List<OSMId>> = Map()
  for (let route of routes.elements) {
    let stationIds: List<OSMId> = List()
    for (let member of route.members) {
      if (member.role.search("stop")) continue
      stationIds = stationIds.push(member.ref)
    }
    stationsInRoute = stationsInRoute.set(+route.id as OSMId, stationIds)
  }

  return stationsInRoute
}


// Downloads diagram of a real-world city. Doesn't clean it up in any way:
// stations have duplicates, routes have duplicates.
export function loadCity(diagram: Model.Diagram = newEmptyDiagram()): Model.Diagram {
  const rawProjection = getRawProjection()

  const routeToStations = getOsmRoutes()
  const allRoutes = routeToStations.keySeq().toSet()
  const allStations = routeToStations.valueSeq().flatMap(it => it).toSet()
  type OurFeatureProperties = { name: string, ["@id"]: string }
  type RouteFeatureProperties = OurFeatureProperties & {
    route?: string // "subway"
    ref?: string // "M1"
    colour?: string // "blue", "#E74A4A"
  }
  type OurFeatureCollection = FeatureCollection<Geometry, OurFeatureProperties>
  // @ts-ignore
  const city: OurFeatureCollection = require("/src/assets/export.geojson.json")

  const validFeatures = Seq(city.features)
    .map(it => ({...it, id: extractOSMId(it.properties["@id"])}))
    .filter(it => it.properties && it.properties.name && it.id && it.geometry)
    .map(it => ({...it, id: it.id!}))  // Can't be undefined now.

  const stationFeatures = validFeatures.toSeq()
    .filter(it => allStations.has(it.id))
    .map(it => {
      let name = extractStationName(it.properties.name)

      let geoPositions = (
        it.geometry.type === "Polygon" ? List(...it.geometry.coordinates)
          : it.geometry.type === "Point" ? List([it.geometry.coordinates])
            : List<Position>()).map<[number, number]>(it => [it[0] ?? 0, it[1] ?? 0]).toList()
      let pixelPosition = getAveragePixelPosition(rawProjection, geoPositions)

      let model
      [diagram, model] = addStation(diagram, {
        id: OSMIdToStationId(it.id, name),
        name: name,
        position: pixelPosition,
      })

      return {...it, name, geoPositions, pixelPosition, model}
    })
    .toList()
  const stationFeaturesById = stationFeatures
    .groupBy(it => it.id).map(it => it.get(0)!).toMap()

  let groupsForRouteNames: Map<string, Model.RouteGroup> = Map()

  const routeFeatures = validFeatures.toSeq()
    .filter(it => allRoutes.has(it.id))
    .map(it => it as typeof it & { properties: RouteFeatureProperties })
    .map(it => {
      let name = it.properties.ref ?? extractRouteName(it.properties.name)
      let color = it.properties.colour ?? null
      let category = it.properties.route ?? "other"

      let stationIds = routeToStations.get(it.id) ?? List()
      let stations: List<Model.Station> = stationIds
        .map(id => stationFeaturesById.get(id)?.model)
        .filter(it => it).map(it => it!)
        .toList()

      let group
      if (groupsForRouteNames.has(name)) {
        group = groupsForRouteNames.get(name)
      } else {
        [diagram, group] = addRouteGroup(diagram, {id: randomId() + slugify(name) as Model.RouteGroupId, name, color: color ?? "black", category})
        groupsForRouteNames = groupsForRouteNames.set(name, group)
      }

      let model
      [diagram, model] = addRoute(diagram, {
        id: OSMIdToRouteId(it.id, name),
        name,
        color: category === "tram" ? randomColor() : null,
        group: group.id,
        stations: stations.map(it => it.id),
      })

      return {...it, name, color, category, stationIds, stations, group, model}
    })
    .toList()

  return diagram
}
