import {angle, xy} from "./math/geo"
import {Vec} from "./math/vec"
import {
  Model,
} from "./data/model"
import * as d3 from "d3"
import {roundedRectangle} from "./shapes"
import {arraysEqual, getOrPut} from "./util"
import {Angle} from "./math/angle"
import {List} from "immutable"

export class StationLayout {
  model: Model.Station
  outgoingEdges: Map<angle, EdgeLayout[]> = new Map<angle, EdgeLayout[]>()

  simpleStationAngle: angle | null = null

  waitingForSlot: Map<number, EdgeLayout[]> = new Map<number, EdgeLayout[]>()

  // size: xy
  // rotation: Angle = {a: 0}

  constructor(station: Model.Station) {
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
    let angle = this.simpleStationAngle ?? 0 as angle
    let perpendicular = Vec.mul(Vec.unit(angle), 20)
    // let a = this.model.position
    let a = Vec.sub(this.model.position, perpendicular)
    let b = Vec.add(this.model.position, perpendicular)
    return `M ${Vec.toString(a)} L ${Vec.toString(b)}`
  }

  transferStationPath() {
    // let padding = Vec.pair(6, 6)
    // return this.circlePath(Vec.sub(this.boundsMin[0], padding),
    // Vec.add(this.boundsMax[0], padding));
    // let halfSize = Vec.add(Vec.mul(this.size, .5), padding)
    let halfSize = Vec.pair(14, 14)
    // return this.roundedRectanglePath(Vec.sub(this.station.center,
    // halfSize), Vec.add(this.station.center, halfSize), 14)
    let d = roundedRectangle(Vec.sub(this.model.position, halfSize), Vec.add(this.model.position, halfSize), halfSize.x)


    return d
  }

  toSVGPath() {
    let d = (this.simpleStationAngle === null ? this.transferStationPath() : this.simpleStationPath())
    // for (let angle of this.waitingForSlot.keys()) {
    //   d += `M ${Vec.toString(this.model.position)}
    // ${Vec.toString(Vec.add(this.model.position,
    //     Vec.mul(Vec.unit(Angles.round(Angles.of(angle))), 10)))} `
    // }
    return d
  }
}


export class EdgeLayout {
  // model: EdgeModel
  route: RouteLayout
  stations: [StationLayout, StationLayout]

  constructor(route: RouteLayout, stations: readonly [StationLayout, StationLayout]) {
    // this.model = edge
    this.route = route
    this.stations = [...stations]
  }

  assignedAngles: [angle, angle] = [0 as angle, 0 as angle]
  assignedShifts: [xy, xy] = [Vec.pair(0, 0), Vec.pair(0, 0)]
}

export class RouteLayout {
  diagram: Model.Diagram
  model: Model.Route
  stations: List<StationLayout> = List()
  edges: EdgeLayout[] = []

  constructor(diagram: Model.Diagram, route: Model.Route, stations: List<StationLayout>) {
    this.diagram = diagram
    this.model = route
    this.stations = stations
    for (let i = 0; i + 1 < stations.toArray().length; ++i) {
      this.edges.push(new EdgeLayout(this, [this.stations.get(i)!, this.stations.get(i + 1)!]))
    }
  }

  static customizePath(selection: d3.Selection<any, RouteLayout, any, any>) {
    selection.style("stroke", route => Model.getRouteColor(route.diagram, route.model))
  }

  toSVGPath() {
    if (this.edges.length === 0) {
      return ""
    }

    let points: xy[] = []
    // for (let station of this.stations) {
    //   points.push(station.model.position)
    // }

    points.push(Vec.add(this.edges[0].stations[0].model.position, this.edges[0].assignedShifts[0]))
    for (let edge of this.edges) {
      // points.push(Vec.add(edge.stations[0].model.position,
      // edge.assignedShifts[0]))
      points.push(Vec.add(edge.stations[1].model.position, edge.assignedShifts[1]))
    }

    let generator = d3.line().curve(d3.curveCatmullRom)
    let path = generator(points.map(point => [point.x, point.y]))
    for (let i = 0; i < this.stations.toArray().length; ++i) {
      let station = this.stations.get(i)!
      let point = points[i]
      if (station.simpleStationAngle === null) continue

      let perpendicular = Vec.mul(Vec.unit(station.simpleStationAngle), 10)
      let a = Vec.sub(point, perpendicular)
      let b = Vec.add(point, perpendicular)

      path += `M ${Vec.toString(a)} L ${Vec.toString(b)}`
    }
    return path
  }

  assignedShifts: xy[] = []
}

export class RouteDiagramLayout {
  model: Model.Diagram
  routes: Map<Model.Route, RouteLayout> = new Map()
  stations: Map<Model.Station, StationLayout> = new Map()

  constructor(diagram: Model.Diagram) {
    this.model = diagram
    for (let station of diagram.stations.values()) {
      this.stations = this.stations.set(station, new StationLayout(station))
    }
    for (let route of diagram.routes.values()) {
      let stationLayouts = route.stations.map(station => this.stations.get(diagram.stations.get(station)!)!)
      this.routes = this.routes.set(route, new RouteLayout(diagram, route, stationLayouts))
    }

    this.saveOutgoingEdges()
    this.findSimpleStations()
    this.assignAngles()
    this.assignShifts()
  }

  saveOutgoingEdges() {
    for (let route of this.routes.values()) {
      for (let edge of route.edges) {
        for (let i = 0; i < 2; ++i) {
          let angle = Vec.toAngle2(edge.stations[i].model.position, edge.stations[1 - i].model.position)
          for (let existingAngle of edge.stations[i].outgoingEdges.keys()) {
            if (Angle.equals(angle, existingAngle)) {
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
      let angles = [...station.outgoingEdges.keys()]
      if (angles.length != 2) continue
      let [a, b] = angles

      let linesA = [...station.outgoingEdges.get(a)!].map(edge => edge.route).sort()
      let linesB = [...station.outgoingEdges.get(b)!].map(edge => edge.route).sort()
      if (!arraysEqual(linesA, linesB)) continue
      let alpha = Angle.average(a, b)
      station.simpleStationAngle = Angle.add(alpha, Math.PI as angle)
    }
  }

  assignAngles() {
    for (let route of this.routes.values()) {
      for (let edge of route.edges) {
        for (let i = 0; i < 2; ++i) {
          edge.assignedAngles[i] = Angle.halfCircle(Angle.round(Vec.toAngle2(edge.stations[i].model.position, edge.stations[1 - i].model.position)))
          getOrPut(edge.stations[i].waitingForSlot, edge.assignedAngles[i], []).push(edge)
        }
      }
    }
  }

  assignShifts() {
    for (let station of this.stations.values()) {
      for (let [angle, waiting] of station.waitingForSlot.entries()) {
        let waitingByGroup = new Map<Model.RouteGroup, EdgeLayout[]>()
        for (let edge of waiting) {
          getOrPut(waitingByGroup, this.model.routeGroups.get(edge.route.model.group)!, []).push(edge)
        }

        let groups = [...waitingByGroup.keys()]
        groups.sort()
        let n = groups.length
        for (let i = 0; i < n; ++i) {
          let group = groups[i]
          let baseShift = Vec.mul(Vec.unit(angle + Math.PI / 2 as angle), 10)
          let shift = Vec.mul(baseShift, i - (n - 1) / 2)
          for (let edge of waitingByGroup.get(group)!) {
            edge.assignedShifts[edge.stations[0] === station ? 0 : 1] = shift
          }
          // let shiftI = (edge.stations[0] === station ? 0 : 1)
          // edge.assignedShifts[shiftI] = shift
        }
      }
    }
  }
}
