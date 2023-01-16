import {Model, WithoutId} from "./model"
import {List} from "immutable"

export function addRoute(diagram: Model.Diagram, properties: Model.Route): [Model.Diagram, Model.Route] {
  let route: Model.Route = {...properties}
  return [{
    ...diagram,
    routes: diagram.routes.set(route.id, route),
  }, route]
}

export function updateRoute(diagram: Model.Diagram, route: Model.Route,
                            newProperties: Partial<WithoutId<Model.Route>>): [Model.Diagram, Model.Route] {
  let newRoute: Model.Route = {...route, ...newProperties}
  return [{
    ...diagram,
    routes: diagram.routes.set(route.id, newRoute),
  }, newRoute]
}

export function removeRoute(diagram: Model.Diagram, route: Model.Route): Model.Diagram {
  return {...diagram, routes: diagram.routes.remove(route.id)}
}
