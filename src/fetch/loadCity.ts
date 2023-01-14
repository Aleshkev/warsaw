import {FeatureCollection, Geometry, Position} from "geojson"
import {Vec} from "../math/vec"
import {Model} from "../data/model"
import {getAveragePixelPosition, getRawProjection} from "./geoProjection"
import {List, Map, Seq, Set} from "immutable"
import {
  extractOSMId,
  extractRouteName,
  extractStationName,
} from "./fuzzyExtraction"
import {OSMId} from "./common"
import {Mutate} from "../data/mutate"
import {arraysEqual, removeAdjacentDuplicates} from "../util"

function randomColor() {
  return `hsl(${Math.random() * 360}, 73%, 62%)`
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


export function loadCity(): Model.Diagram {

  const rawProjection = getRawProjection()

  const routeToStations = getOsmRoutes()
  const allRoutes = routeToStations.keySeq().toSet()
  const allStations = routeToStations.valueSeq().flatMap(it => it).toSet()
  console.log(routeToStations.toJS(), allRoutes.toJS(), allStations.toJS())
  type OurFeatureProperties = { name: string, ["@id"]: string }
  type RouteFeatureProperties = OurFeatureProperties & {
    route: string | undefined // "subway"
    ref: string | undefined // "M1"
    colour: string | undefined // "blue"
  }
  type OurFeatureCollection = FeatureCollection<Geometry, OurFeatureProperties>
  // @ts-ignore
  const city: OurFeatureCollection = require("/src/assets/export.geojson.json")

  const validFeatures = Seq(city.features)
    .map(it => ({...it, id: extractOSMId(it.properties["@id"])}))
    .filter(it => it.properties && it.properties.name && it.id && it.geometry)
    .map(it => ({...it, id: it.id!}))  // Can't be undefined now.

  const routeFeatures = validFeatures.toSeq()
    .filter(it => allRoutes.has(it.id))
    .map(it => it as typeof it & { properties: RouteFeatureProperties })
    .map(it => ({
      ...it,
      stations: routeToStations.get(it.id) ?? [],
      name: it.properties.ref ?? extractRouteName(it.properties.name),
      color: it.properties.colour ?? null,
      type: it.properties.route ?? "other",
    }))
  const routeFeaturesById = routeFeatures
    .groupBy(it => it.id)
    .map(it => it.get(0)!)
    .toMap()

  const stationFeatures = validFeatures.toSeq()
    .filter(it => allStations.has(it.id))
    .map(it => ({
      ...it,
      name: extractStationName(it.properties.name),
      geoPositions: (
        it.geometry.type === "Polygon" ? List(...it.geometry.coordinates)
          : it.geometry.type === "Point" ? List([it.geometry.coordinates])
            : List<Position>()).map<[number, number]>(it => [it[0] ?? 0, it[1] ?? 0]).toList(),
    }))
  const stationFeaturesById = stationFeatures
    .groupBy(it => it.id).map(it => it.get(0)!).toMap()


  let diagram = Mutate.newEmptyDiagram()

  const stationsByName = stationFeatures
    .groupBy(it => it.name)
    .map((features, name) => {
      let model
      let allGeoPositions: List<[number, number]> = features.map(feature => feature.geoPositions).flatMap(it => it).toList();
      [diagram, model] = Mutate.addStation(diagram, name,
        getAveragePixelPosition(rawProjection, allGeoPositions))
      return {features, model: model as Model.Station}
    })
    .toMap()

  let color = "black"
  let group;
  [diagram, group] = Mutate.addRouteGroup(diagram, "", color)
  let addedRoutes: Set<List<Model.Station>> = Set()
  for (let stationsInRoute of routeToStations.values()) {

    if (Math.random() < 1) {
      [diagram, group] = Mutate.addRouteGroup(diagram, "", randomColor())
    }
    let route
    let stations: List<Model.Station> = stationsInRoute.map(id => {
      let name = stationFeaturesById.get(id)?.name
      if (!name) return undefined
      return stationsByName.get(name)!.model
    }).filter(it => it).map(it => it!).toList()
    stations = removeAdjacentDuplicates(stations)

    let unique = true
    for (let x of addedRoutes) {
      if (arraysEqual(x.toArray(), stations.sortBy(station => station.id).toArray())) {
        unique = false
      }
    }
    if (!unique) continue
    addedRoutes = addedRoutes.add(stations.sortBy(station => station.id))
    console.log(addedRoutes.filter(route => route.find(value => !!value.name.match("Krakowska"))).map(route => route.sort()).toJS())
    ;
    [diagram, route] = Mutate.addRoute(diagram, "?", null, group, stations)
  }

  console.log(diagram)
  console.log(diagram.routes.toJS())
  return diagram
}

