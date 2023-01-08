import {xy} from "./geo"
import {randomId} from "./util"

export class StationModel {
  uuid = randomId()
  position: xy
  readonly name: string

  constructor(position: xy, name: string) {
    this.position = position
    this.name = name
  }
}

type EdgeAlignment = "left" | "right"

export class EdgeModel {
  uuid = randomId()
  alignment: EdgeAlignment
}

export class RouteGroupModel {
  uuid = randomId()
  readonly color: string = "magenta"

  constructor(color: string) {
    this.color = color
  }

}

export class RouteModel {
  uuid = randomId()
  group: RouteGroupModel
  name: string
  color: string | null = null

  // There are always n stations and n - 1 edges.
  private _stations: StationModel[] = []
  private _edges: EdgeModel[] = []

  constructor(group: RouteGroupModel, name: string, color: string | null = null) {
    this.group = group
    this.name = name
    this.color = color
  }

  getColor() {
    return this.color ?? this.group.color
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

