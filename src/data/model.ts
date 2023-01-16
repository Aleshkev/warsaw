import {xy} from "../math/geo"
import {randomId} from "../util"
import {Vec} from "../math/vec"
import {List, Map} from "immutable"

export type WithoutId<T> = Omit<T, "id">

export namespace Model {
  export type StationId = string & { __brand: "StationId" }
  type StationData = {
    id: StationId
    name: string
    position: xy
  }
  export type Station = Readonly<StationData>

  export type RouteGroupId = string & { __brand: "RouteGroupId" }
  type RouteGroupData = {
    id: RouteGroupId
    name: string
    color: string
    category: string | null
  }
  export type RouteGroup = Readonly<RouteGroupData>

  export type RouteId = string & { __brand: "RouteId" }
  type RouteData = {
    id: RouteId
    name: string
    color: string | null

    group: RouteGroupId
    stations: List<StationId>  // Stations in the route.
  }
  export type Route = Readonly<RouteData>

  export function getRouteColor(diagram: Diagram, route: Route) {
    return route.color ?? diagram.routeGroups.get(route.group)!.color
  }

  export type DiagramId = string & { __brand: "DiagramId" }
  type DiagramData = {
    id: DiagramId
    name: string
    description: string

    stations: Map<StationId, Station>  // All stations in the diagram.
    routeGroups: Map<RouteGroupId, RouteGroup>
    routes: Map<RouteId, Route>
  }
  export type Diagram = Readonly<DiagramData>
}
