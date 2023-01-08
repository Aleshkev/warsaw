import {Angle, xy} from "./geo"
import {Vec} from "./vec"
import {EdgeModel, RouteDiagramModel, RouteModel, StationModel} from "./model"
import * as d3 from "d3"

export class StationLayout {
  model: StationModel
  incomingEdges: Map<Angle, EdgeLayout[]> = new Map<Angle, EdgeLayout[]>()
  // nSlots: number[]

  // size: xy
  // rotation: Angle = {a: 0}

  constructor(station: StationModel) {
    this.model = station
  }

  private roundedRectanglePath(a: xy, b: xy, r: number = 6) {
    let c = Vec.pair(b.x, a.y), d = Vec.pair(a.x, b.y)

    return `M ${a.x + r} ${a.y}
      L ${c.x - r} ${c.y} a ${r} ${r} 0 0 1 ${r} ${r} 
      L ${b.x} ${b.y - r} a ${r} ${r} 0 0 1 ${-r} ${r}
      L ${d.x + r} ${d.y} a ${r} ${r} 0 0 1 ${-r} ${-r}
      L ${a.x} ${a.y + r} a ${r} ${r} 0 0 1 ${r} ${-r}`
  }

  private circlePath(a: xy, b: xy) {
    let r = Vec.fold(Math.max, Vec.sub(b, a)) / 2
    let c = Vec.mul(Vec.add(a, b), .5)
    return `M ${c.x} ${c.y - r} a ${r} ${r} 0 0 1 0 ${2 * r} a ${r} ${r} 0 0 1 0 ${-2 * r}`
  }

  toSVGPath() {
    let padding = Vec.pair(6, 6)
    // return this.circlePath(Vec.sub(this.boundsMin[0], padding),
    // Vec.add(this.boundsMax[0], padding));
    // let halfSize = Vec.add(Vec.mul(this.size, .5), padding)
    let halfSize = Vec.pair(14, 14)
    // return this.roundedRectanglePath(Vec.sub(this.station.center,
    // halfSize), Vec.add(this.station.center, halfSize), 14)
    return this.roundedRectanglePath(Vec.sub(this.model.position, halfSize), Vec.add(this.model.position, halfSize), 6)
  }

  getSVGTransform() {
    return ""
  }
}


export class EdgeLayout {
  model: EdgeModel
  stations: [StationLayout, StationLayout]

  constructor(edge: EdgeModel, stations: readonly [StationLayout, StationLayout]) {
    this.model = edge
    this.stations = [...stations]
  }

  assignedAngles: [Angle, Angle] = [{a: 0}, {a: 0}]
  assignedShifts: [xy, xy] = [Vec.pair(0, 0), Vec.pair(0, 0)]

  toSVGPath() {
    let a = Vec.add(this.stations[0].model.position, this.assignedShifts[0])
    let b = Vec.add(this.stations[1].model.position, this.assignedShifts[1])
    let [angleA, angleB] = this.assignedAngles

    let bend = Vec.norm(Vec.sub(b, a))
    let p_1 = Vec.add(a, Vec.mul(Vec.unit(angleA), bend))
    let p_2 = Vec.sub(b, Vec.mul(Vec.unit(angleB), bend))
    return `M ${a.x} ${a.y} C ${p_1.x} ${p_1.y} ${p_2.x} ${p_2.y} ${b.x} ${b.y}`
  }
}

export class RouteLayout {
  model: RouteModel
  stations: StationLayout[] = []
  edges: EdgeLayout[] = []

  constructor(route: RouteModel, stations: readonly StationLayout[]) {
    this.model = route
    this.stations = [...stations]
    for (let i = 0; i + 1 < stations.length; ++i) {
      this.edges.push(new EdgeLayout(this.model.edges[i], [this.stations[i], this.stations[i + 1]]))
    }
  }

  toSVGPath() {
    let points: xy[] = []
    for (let station of this.stations) {
      points.push(station.model.position)
    }

    let generator = d3.line().curve(d3.curveNatural)
    return generator(points.map(point => [point.x, point.y]))
  }

  assignedShifts: xy[]
}

export class RouteDiagramLayout {
  routes: Map<RouteModel, RouteLayout> = new Map()
  stations: Map<StationModel, StationLayout> = new Map()

  constructor(routeDiagram: RouteDiagramModel) {
    for (let station of routeDiagram.stations.values()) {
      this.stations.set(station, new StationLayout(station))
    }
    console.log(routeDiagram, routeDiagram.stations, this.stations)
    for (let route of routeDiagram.routes.values()) {
      let stationLayouts = route.stations.map(station => this.stations.get(station)!)
      this.routes.set(route, new RouteLayout(route, stationLayouts))
    }

    // this.decideAmountsOfSlots()
    // this.decideShapesOfStations()
    // this.assignSlots()
    // this.createEdgePaths()
  }



}
