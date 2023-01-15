import {Model} from "./model"
import {randomId} from "../util"

export function addRouteGroup(diagram: Model.Diagram, id: Model.RouteGroupId, name: string, color: string, category: string): [Model.Diagram, Model.RouteGroup] {
  let routeGroup: Model.RouteGroup = {
    id,
    name,
    color,
    category,
  }
  return [{
    ...diagram,
    routeGroups: diagram.routeGroups.set(routeGroup.id, routeGroup),
  }, routeGroup]
}
