import {Model, WithoutId} from "./model"
import {xy} from "../math/geo"
import {List, Seq, Set} from "immutable"
import {Vec} from "../math/vec"
import {updateRoute} from "./mutateRoute"
import {randomId} from "../util"

export function addStation(diagram: Model.Diagram, properties: Model.Station): [Model.Diagram, Model.Station] {
  let station: Model.Station = {...properties}
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, station),
  }, station]
}

export function updateStation(diagram: Model.Diagram, station: Model.Station,
                              newProperties: Partial<WithoutId<Model.Station>>): [Model.Diagram, Model.Station] {
  let newStation: Model.Station = {...station, ...newProperties}
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, newStation),
  }, newStation]
}

// Removes all references to the stations (removes them from routes).
export function unlinkStations(diagram: Model.Diagram, stations: Set<Model.Station>): Model.Diagram {
  let ids = stations.map(it => it.id)
  for (let route of diagram.routes.valueSeq()) {
    [diagram, route] = updateRoute(diagram, route, {stations: route.stations.filter(it => !ids.contains(it))})
  }
  return diagram
}

export function unlinkStation(diagram: Model.Diagram, station: Model.Station): Model.Diagram {
  return unlinkStations(diagram, Set([station]))
}


// Removes the stations, but doesn't remove references to them.
function removeStationsUnsafely(diagram: Model.Diagram, stationsToRemove: Set<Model.Station>): Model.Diagram {
  return {...diagram, stations: diagram.stations.removeAll(stationsToRemove.map(it => it.id))}
}


export function removeStations(diagram: Model.Diagram, stationsToRemove: Set<Model.Station>): Model.Diagram {
  diagram = unlinkStations(diagram, stationsToRemove)
  return removeStationsUnsafely(diagram, stationsToRemove)
}

export function removeStation(diagram: Model.Diagram, stationToRemove: Model.Station): Model.Diagram {
  return removeStations(diagram, Set([stationToRemove]))
}

export function mergeStations(diagram: Model.Diagram, stationsToMerge: List<Model.Station>): [Model.Diagram, Model.Station] {
  if (stationsToMerge.size < 1) throw new Error("too few")
  if (stationsToMerge.size === 1) return [diagram, stationsToMerge.get(0)!]

  let newStation: Model.Station
  [diagram, newStation] = addStation(diagram, {
    id: `${stationsToMerge.get(0)?.id ?? randomId()}-merged` as Model.StationId,
    name: stationsToMerge.map(it => it.name).maxBy(it => it.length) ?? "merged station",
    position: Vec.div(Vec.sum(...stationsToMerge.map(it => it.position)), stationsToMerge.size),
  })

  // TODO: only iterate over routes that actually pass through this station
  for (let route of diagram.routes.valueSeq().toList()) {
    let stationsInRoute = route.stations
      .map(it => (stationsToMerge.map(it => it.id).contains(it) ? newStation.id : it))
      .toList();
    [diagram, route] = updateRoute(diagram, route, {stations: stationsInRoute})
  }
  diagram = removeStationsUnsafely(diagram, stationsToMerge.toSet())
  return [diagram, newStation]
}
