import {xy} from "../math/geo"
import {randomId} from "../util"
import {Vec} from "../math/vec"
import {List, Map} from "immutable"

export namespace Model {
  export type StationId = string & { __brand: "StationId" }
  export type Station = Readonly<{
    id: StationId
    name: string
    position: xy
  }>

  export type RouteGroupId = string & { __brand: "RouteGroupId" }
  export type RouteGroup = Readonly<{
    id: RouteGroupId
    name: string
    color: string
    category: string | null
  }>

  export type RouteId = string & { __brand: "RouteId" }
  export type Route = Readonly<{
    id: RouteId
    name: string
    color: string | null

    group: RouteGroupId
    stations: List<StationId>  // Stations in the route.
  }>

  export function getRouteColor(diagram: Diagram, route: Route) {
    return route.color ?? diagram.routeGroups.get(route.group)!.color
  }

  export type DiagramId = string & { __brand: "DiagramId" }
  export type Diagram = Readonly<{
    id: DiagramId
    name: string
    description: string

    stations: Map<StationId, Station>  // All stations in the diagram.
    routeGroups: Map<RouteGroupId, RouteGroup>
    routes: Map<RouteId, Route>
  }>
}
