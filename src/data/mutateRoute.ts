import {Model} from "./model"
import {randomId} from "../util"
import {List} from "immutable"

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

export function addRoute(diagram: Model.Diagram, id: Model.RouteId, name: string, color: string | null, group: Model.RouteGroup, stations: List<Model.Station>): [Model.Diagram, Model.Route] {
  let route: Model.Route = {
    id, name, color, group: group.id,
    stations: stations.map(it => it.id),
  }
  return [{
    ...diagram,
    routes: diagram.routes.set(route.id, route),
  }, route]
}

export function updateRoute(diagram: Model.Diagram, route: Model.Route,
                            newProperties: { name?: string, color?: string | null, group?: Model.RouteGroup, stations?: List<Model.Station> }): [Model.Diagram, Model.Route] {
  let newRoute: Model.Route = {
    ...route, ...newProperties, ...{
      group: newProperties.group?.id ?? route.group,
      stations: newProperties.stations ? newProperties.stations.map(it => it.id) : route.stations,
    },
  }
  return [{...diagram, routes: diagram.routes.set(route.id, newRoute)}, newRoute]
}

export function removeRoute(diagram: Model.Diagram, route: Model.Route): Model.Diagram {
  return {...diagram, routes: diagram.routes.remove(route.id)}
}