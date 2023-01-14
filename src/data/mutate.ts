import {Model} from "./model"
import {randomId} from "../util"
import {List, Map} from "immutable"
import {xy} from "../math/geo"


export namespace Mutate {
  export function newEmptyDiagram(name: string = "Warsaw", description: string = "Poland, 2022"): Model.Diagram {
    return {
      id: randomId() as Model.DiagramId,
      name,
      description,
      stations: Map(),
      routeGroups: Map(),
      routes: Map(),
    }
  }

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
                                newProperties: { position: xy | undefined }): [Model.Diagram, Model.Station] {
    let newStation = {
      ...diagram.stations.get(station.id)!,
      position: newProperties.position ?? station.position,
    }
    return [{
      ...diagram,
      stations: diagram.stations.set(station.id, newStation),
    }, newStation]
  }

  export function addRouteGroup(diagram: Model.Diagram, name: string, color: string): [Model.Diagram, Model.RouteGroup] {
    let routeGroup: Model.RouteGroup = {
      id: randomId() as Model.RouteGroupId,
      name,
      color,
    }
    return [{
      ...diagram,
      routeGroups: diagram.routeGroups.set(routeGroup.id, routeGroup),
    }, routeGroup]
  }

  export function addRoute(diagram: Model.Diagram, name: string, color: string | null, group: Model.RouteGroup, stations: List<Model.Station>): [Model.Diagram, Model.Route] {
    let route: Model.Route = {
      id: randomId() as Model.RouteId, name, color, group: group.id,
      stations: stations.map(it => it.id),
    }
    return [{
      ...diagram,
      routes: diagram.routes.set(route.id, route),
    }, route]
  }

}
