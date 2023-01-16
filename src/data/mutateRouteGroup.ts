import {Model} from "./model"
import {randomId} from "../util"

export function addRouteGroup(diagram: Model.Diagram, properties: Model.RouteGroup): [Model.Diagram, Model.RouteGroup] {
  let routeGroup: Model.RouteGroup = {...properties}
  return [{
    ...diagram,
    routeGroups: diagram.routeGroups.set(routeGroup.id, routeGroup),
  }, routeGroup]
}
