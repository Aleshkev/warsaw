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

  simpleStationAngle: Angle | null = null

  // nSlots: number[]

  // size: xy
  // rotation: Angle = {a: 0}

  constructor(station: StationModel) {
    this.model = station
  }

  color: string = "#000"

  static customizePath(selection: d3.Selection<any, StationLayout, any, any>) {
    selection
      .classed("simple", (station => station.simpleStationAngle !== null))
      .style("stroke", (station => station.simpleStationAngle !== null ? "rgba(0,0,0,0.01)" : null))
    // selection.filter(station => station.simpleStationAngle === null)
    //   .raise()
  }

  simpleStationPath() {
    let angle = this.simpleStationAngle ?? Angles.of(0)
    return `M ${Vec.toString(this.model.position)} L ${Vec.toString(Vec.add(this.model.position, Vec.mul(Vec.unit(angle), 20)))}`
  }

  transferStationPath() {
    let padding = Vec.pair(6, 6)
    // return this.circlePath(Vec.sub(this.boundsMin[0], padding),
    // Vec.add(this.boundsMax[0], padding));
    // let halfSize = Vec.add(Vec.mul(this.size, .5), padding)
    let halfSize = Vec.pair(14, 14)
    // return this.roundedRectanglePath(Vec.sub(this.station.center,
    // halfSize), Vec.add(this.station.center, halfSize), 14)
    let d = roundedRectangle(Vec.sub(this.model.position, halfSize), Vec.add(this.model.position, halfSize), halfSize.x)

    // for(let angle of this.outgoingEdges.keys()) {
    //   d += `M ${Vec.toString(this.model.position)}
    // ${Vec.toString(Vec.add(this.model.position,
    // Vec.mul(Vec.unit(Angles.round(angle)), 10)))} ` }

    return d
  }

  toSVGPath() {
    if (this.simpleStationAngle == null) {
      return this.transferStationPath()
    }
    return this.simpleStationPath()
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
    let mainLine = generator(points.map(point => [point.x, point.y]))
    let path = mainLine
    for (let station of this.stations) {
      if (station.simpleStationAngle === null) continue
      path += `M ${Vec.toString(station.model.position)} L ${Vec.toString(Vec.add(station.model.position, Vec.mul(Vec.unit(station.simpleStationAngle), 20)))}`
    }
    return path
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
    this.findSimpleStations()
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
          for (let existingAngle of edge.stations[i].outgoingEdges.keys()) {
            if (Angles.equals(angle, existingAngle)) {
              angle = existingAngle
              break
            }
          }
          getOrPut(edge.stations[i].outgoingEdges, angle, []).push(edge)
        }
      }
    }
  }

  findSimpleStations() {
    for (let station of this.stations.values()) {
      for (let route of this.routes.values()) {
        if (route.stations.indexOf(station) !== -1) {
          station.color = route.model.group.color
        }
      }

      let angles = [...station.outgoingEdges.keys()]
      if (angles.length != 2) continue
      let [a, b] = angles
      let alpha = Angles.average(a, b)
      station.simpleStationAngle = Angles.add(alpha, Angles.of(Math.PI))
    }
  }
}
