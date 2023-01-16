import {Model, WithoutId} from "./model"
import {xy} from "../math/geo"
import {List, Set} from "immutable"
import {Vec} from "../math/vec"
import {updateRoute} from "./mutateRoute"

export function addStation(diagram: Model.Diagram, properties: Model.Station): [Model.Diagram, Model.Station] {
  let station: Model.Station = {...properties}
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, station),
  }, station]
}

export function updateStation(diagram: Model.Diagram, station: Model.Station,
                              newProperties: Partial<WithoutId<Model.Station>>): [Model.Diagram, Model.Station] {
  let newStation: Model.Station = {
    ...station,
    ...newProperties,
  }
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, newStation),
  }, newStation]
}

// Removes the station, but doesn't remove references to them.
function removeStationsUnsafely(diagram: Model.Diagram, stationsToRemove: Set<Model.Station>): Model.Diagram {
  let stationIdsToRemove = stationsToRemove.map(it => it.id).toSet()
  return {...diagram, stations: diagram.stations.removeAll(stationIdsToRemove)}
}


export function removeStations(diagram: Model.Diagram, stationsToRemove: Set<Model.Station>): Model.Diagram {
  let stationIdsToRemove = stationsToRemove.map(it => it.id).toSet()
  for (let route of diagram.routes.valueSeq().toList()) {
    let stationsInRoute = route.stations
      .map(it => diagram.stations.get(it)!)
      .filter(it => !stationIdsToRemove.contains(it.id))
      .toList();
    [diagram, route] = updateRoute(diagram, route, {stations: stationsInRoute.map(it => it.id)})
  }
  return removeStationsUnsafely(diagram, stationsToRemove)
}

export function removeStation(diagram: Model.Diagram, stationToRemove: Model.Station): Model.Diagram {
  return removeStations(diagram, Set([stationToRemove]))
}

export function mergeStations(diagram: Model.Diagram, stationsToMerge: List<Model.Station>): [Model.Diagram, Model.Station] {
  if (stationsToMerge.size < 1) throw new Error("too few")
  if (stationsToMerge.size === 1) return [diagram, stationsToMerge.get(0)!]

  let averagePosition: xy = Vec.div(Vec.sum(...stationsToMerge.map(it => it.position)), stationsToMerge.size)
  let averageName: string = stationsToMerge.map(it => it.name).maxBy(it => it.length)!
  let averageId = `${stationsToMerge.get(0)?.id}-merged` as Model.StationId
  let newStation: Model.Station
  [diagram, newStation] = addStation(diagram, {
    id: averageId,
    name: averageName,
    position: averagePosition,
  })

  // TODO: only iterate over routes that actually pass through this station
  for (let route of diagram.routes.valueSeq().toList()) {
    let stationsInRoute = route.stations
      .map(it => diagram.stations.get(it)!)
      .map(it => (stationsToMerge.contains(it) ? newStation : it))
      .toList();
    [diagram, route] = updateRoute(diagram, route, {stations: stationsInRoute.map(it => it.id)})
  }

  diagram = removeStationsUnsafely(diagram, stationsToMerge.toSet())

  return [diagram, newStation]
}
