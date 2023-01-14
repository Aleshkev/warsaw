import {Angle, xy} from "./geo"
import {Vec} from "./vec"
import {
  EdgeModel,
  RouteDiagramModel,
  RouteGroupModel,
  RouteModel,
  StationModel,
} from "./model"
import * as d3 from "d3"
import {roundedRectangle} from "./shapes"
import {arraysEqual, getOrPut} from "./util"
import {Angles} from "./angles"

export class StationLayout {
  model: StationModel
  outgoingEdges: Map<Angle, EdgeLayout[]> = new Map<Angle, EdgeLayout[]>()

  simpleStationAngle: Angle | null = null

  waitingForSlot: Map<number, EdgeLayout[]> = new Map<number, EdgeLayout[]>()

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
    let perpendicular = Vec.mul(Vec.unit(angle), 20)
    // let a = this.model.position
    let a = Vec.sub(this.model.position, perpendicular)
    let b = Vec.add(this.model.position, perpendicular)
    return `M ${Vec.toString(a)} L ${Vec.toString(b)}`
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
  model: EdgeModel
  route: RouteLayout
  stations: [StationLayout, StationLayout]

  constructor(edge: EdgeModel, route: RouteLayout, stations: readonly [StationLayout, StationLayout]) {
    this.model = edge
    this.route = route
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
      this.edges.push(new EdgeLayout(this.model.edges[i], this, [this.stations[i], this.stations[i + 1]]))
    }
  }

  static customizePath(selection: d3.Selection<any, RouteLayout, any, any>) {
    selection.style("stroke", route => route.model.getColor())
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
    for (let i = 0; i < this.stations.length; ++i) {
      let station = this.stations[i]
      let point = points[i]
      if (station.simpleStationAngle === null) continue

      let perpendicular = Vec.mul(Vec.unit(station.simpleStationAngle), 10)
      let a = Vec.sub(point, perpendicular)
      let b = Vec.add(point, perpendicular)

      path += `M ${Vec.toString(a)} L ${Vec.toString(b)}`
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
    for (let route of routeDiagram.routes.values()) {
      let stationLayouts = route.stations.map(station => this.stations.get(station)!)
      this.routes.set(route, new RouteLayout(route, stationLayouts))
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

      let linesA = [...station.outgoingEdges.get(a)!].map(edge => edge.route).sort()
      let linesB = [...station.outgoingEdges.get(b)!].map(edge => edge.route).sort()
      if (!arraysEqual(linesA, linesB)) continue
      let alpha = Angles.average(a, b)
      station.simpleStationAngle = Angles.add(alpha, Angles.of(Math.PI))
    }
  }

  assignAngles() {
    for (let route of this.routes.values()) {
      for (let edge of route.edges) {
        for (let i = 0; i < 2; ++i) {
          edge.assignedAngles[i] = Angles.halfCircle(Angles.round(Vec.toAngle2(edge.stations[i].model.position, edge.stations[1 - i].model.position)))
          getOrPut(edge.stations[i].waitingForSlot, edge.assignedAngles[i].a, []).push(edge)
        }
      }
    }
  }

  assignShifts() {
    for (let station of this.stations.values()) {
      if (station.model.name.match(/.*eszera.*/)) {
        console.log(station.waitingForSlot)

      }
      for (let [angle, waiting] of station.waitingForSlot.entries()) {
        let waitingByGroup = new Map<RouteGroupModel, EdgeLayout[]>()
        for (let edge of waiting) {
          getOrPut(waitingByGroup, edge.route.model.group, []).push(edge)
        }

        let groups = [...waitingByGroup.keys()]
        groups.sort()
        let n = groups.length
        for (let i = 0; i < n; ++i) {
          let group = groups[i]
          let baseShift = Vec.mul(Vec.unit(Angles.of(angle + Math.PI / 2)), 10)
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
