import {DiagramAlignment, xy} from "./geo"

export namespace Model {
  export class Station {
    position: xy
    readonly name: string

    constructor(position: xy, name: string) {
      this.position = position
      this.name = name
    }
  }

  type EdgeAlignment = "left" | "right"

  export class Edge {
    alignment: EdgeAlignment
  }

  export class Group {
    readonly color: string = "magenta"

    constructor(color: string) {
      this.color = color
    }

  }

  export class Route {
    group: Group

    // There are always n stations and n - 1 edges.
    private _stations: Station[] = []
    private edges: Edge[] = []

    constructor(group: Model.Group) {
      this.group = group
    }

    pushStation(station: Station, edge: Edge | null) {
      this._stations.push(station)
      if (this._stations.length > 1) {
        if (edge == null) throw new Error("station must be connected")
        this.edges.push(edge)
      }
    }

    get stations(): readonly Model.Station[] {
      return this._stations
    }
  }


  export class Diagram {
    private stations: Set<Station> = new Set<Model.Station>()
    private routes: Route[] = []

    addRoute(route: Route) {
      this.routes.push(route)
      for(let station of route.stations) {
        this.stations.add(station);
      }
    }
  }
}
