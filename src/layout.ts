import {Angle, xy} from "./geo"
import {Vec} from "./vec"
import {EdgeModel, RouteDiagramModel, RouteModel, StationModel} from "./model"
import * as d3 from "d3"
import {roundedRectangle} from "./shapes"
import {getOrPut} from "./util"
import {Angles} from "./angles"

export class StationLayout {
  model: StationModel
  outgoingEdges: Map<Angle, EdgeLayout[]> = new Map<Angle, EdgeLayout[]>()
  // nSlots: number[]

  // size: xy
  // rotation: Angle = {a: 0}

  constructor(station: StationModel) {
    this.model = station
  }

  toSVGPath() {
    let padding = Vec.pair(6, 6)
    // return this.circlePath(Vec.sub(this.boundsMin[0], padding),
    // Vec.add(this.boundsMax[0], padding));
    // let halfSize = Vec.add(Vec.mul(this.size, .5), padding)
    let halfSize = Vec.pair(14, 14)
    // return this.roundedRectanglePath(Vec.sub(this.station.center,
    // halfSize), Vec.add(this.station.center, halfSize), 14)
    let d = roundedRectangle(Vec.sub(this.model.position, halfSize), Vec.add(this.model.position, halfSize), halfSize.x)

    // for(let angle of this.outgoingEdges.keys()) {
    //   d += `M ${Vec.toString(this.model.position)} ${Vec.toString(Vec.add(this.model.position, Vec.mul(Vec.unit(Angles.round(angle)), 10)))} `
    // }

    return d
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

    this.saveOutgoingEdges()
    // this.decideAmountsOfSlots()
    // this.decideShapesOfStations()
    // this.assignSlots()
    // this.createEdgePaths()

    console.log(this)
  }

  saveOutgoingEdges() {
    for (let route of this.routes.values()) {
      for (let edge of route.edges) {
        for (let i = 0; i < 2; ++i) {
          let angle = Vec.toAngle2(edge.stations[i].model.position, edge.stations[1 - i].model.position)
          getOrPut(edge.stations[i].outgoingEdges, angle, []).push(edge)
        }
      }
    }
  }
}
