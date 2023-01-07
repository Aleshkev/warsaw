import {DiagramAlignment, xy} from "./geo"

export class StationModel {
  position: xy
  readonly name: string

  constructor(position: xy, name: string) {
    this.position = position
    this.name = name
  }
}

type EdgeAlignment = "left" | "right"

export class EdgeModel {
  alignment: EdgeAlignment
}

export class RouteGroupModel {
  readonly color: string = "magenta"

  constructor(color: string) {
    this.color = color
  }

}

export class RouteModel {
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

  get edges(): Model.EdgeModel[] {
    return this._edges
  }
}


export class RouteDiagramModel {
  private _stations: Set<StationModel> = new Set<StationModel>()
  private _routes: RouteModel[] = []

  addRoute(route: RouteModel) {
    this._routes.push(route)
    for (let station of route.stations) {
      this._stations.add(station)
    }
  }

  get stations(): ReadonlySet<StationModel> {
    return this._stations
  }

  get routes(): readonly RouteModel[] {
    return this._routes
  }
}

