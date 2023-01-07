import {DiagramAlignment, xy} from "./geo"

export class StationModel {
  uuid = crypto.randomUUID()
  position: xy
  readonly name: string

  constructor(position: xy, name: string) {
    this.position = position
    this.name = name
  }
}

type EdgeAlignment = "left" | "right"

export class EdgeModel {
  uuid = crypto.randomUUID()
  alignment: EdgeAlignment
}

export class RouteGroupModel {
  uuid = crypto.randomUUID()
  readonly color: string = "magenta"

  constructor(color: string) {
    this.color = color
  }

}

export class RouteModel {
  uuid = crypto.randomUUID()
  group: RouteGroupModel

  // There are always n stations and n - 1 edges.
  private _stations: StationModel[] = []
  private _edges: EdgeModel[] = []

  constructor(group: RouteGroupModel) {
    this.group = group
  }

  pushStation(station: StationModel, edge: EdgeModel | null) {
    this._stations.push(station)
    if (this._stations.length > 1) {
      if (edge == null) throw new Error("station must be connected")
      this._edges.push(edge)
    }
  }

  get stations(): readonly StationModel[] {
    return this._stations
  }

  get edges(): EdgeModel[] {
    return this._edges
  }
}


export class RouteDiagramModel {
  private _routes: RouteModel[] = []

  addRoute(route: RouteModel) {
    this._routes.push(route)
  }

  get stations(): ReadonlySet<StationModel> {
    let result: Set<StationModel> = new Set<StationModel>()
    for (let route of this.routes) {
      for (let station of route.stations) {
        result.add(station)
      }
    }
    return result
  }

  get routes(): readonly RouteModel[] {
    return this._routes
  }
}

