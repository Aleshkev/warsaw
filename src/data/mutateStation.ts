import {Model} from "./model"
import {xy} from "../math/geo"
import {randomId} from "../util"
import {List} from "immutable"
import {Vec} from "../math/vec"
import {updateRoute} from "./mutateRoute"

export function addStation(diagram: Model.Diagram, name: string, position: xy): [Model.Diagram, Model.Station] {
  let station: Model.Station = {
    id: randomId() as Model.StationId,
    name,
    position,
  }
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, station),
  }, station]
}

export function updateStation(diagram: Model.Diagram, station: Model.Station,
                              newProperties: { name?: string, position?: xy }): [Model.Diagram, Model.Station] {
  let newStation: Model.Station = {
    ...diagram.stations.get(station.id)!,
    ...newProperties,
  }
  return [{
    ...diagram,
    stations: diagram.stations.set(station.id, newStation),
  }, newStation]
}

export function removeStation(diagram: Model.Diagram, stationToRemove: Model.Station): Model.Diagram {
  for (let route of diagram.routes.valueSeq().toList()) {
    let stationsInRoute = route.stations
      .map(it => diagram.stations.get(it)!)
      .filter(it => it.id !== stationToRemove.id)
      .toList();
    [diagram, route] = updateRoute(diagram, route, {stations: stationsInRoute})
  }
  return {...diagram, stations: diagram.stations.remove(stationToRemove.id)}
}

export function mergeStations(diagram: Model.Diagram, stationsToMerge: List<Model.Station>): [Model.Diagram, Model.Station] {
  if (stationsToMerge.size < 1) throw new Error("too few")

  let averagePosition: xy = Vec.div(Vec.sum(...stationsToMerge.map(it => it.position)), stationsToMerge.size)
  let averageName: string = stationsToMerge.map(it => it.name).maxBy(it => it.length)!
  let averageId = `${stationsToMerge.get(0)?.id}-merged`
  let newStation
  [diagram, newStation] = addStation(diagram, averageName, averagePosition)

  for (let route of diagram.routes.valueSeq()) {
    let stationsInRoute = route.stations
      .map(it => diagram.stations.get(it)!)
      .map(it => (stationsToMerge.contains(it) ? newStation : it))
      .toList();
    [diagram, route] = updateRoute(diagram, route, {stations: stationsInRoute})
  }

  for(let station of stationsToMerge) {
    diagram = removeStation(diagram, station)
  }

  return [diagram, newStation]
}
