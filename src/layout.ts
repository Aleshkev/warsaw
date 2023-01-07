import {
  alignAngle,
  Angle,
  diagramAlignmentAngles,
  pointsFromAlignmentAngles,
  radToDeg,
  unalignAngle,
  xy,
} from "./geo"
import {Vec} from "./vec"
import {EdgeModel, RouteDiagramModel, RouteModel, StationModel} from "./model"

export class StationLayout {
  station: StationModel
  incomingEdges: Map<Angle, EdgeLayout[]> = new Map<Angle, EdgeLayout[]>()
  // nSlots: number[]

  // size: xy
  // rotation: Angle = {a: 0}

  constructor(station: StationModel) {
    this.station = station
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
    return this.roundedRectanglePath(Vec.sub(this.station.position, halfSize), Vec.add(this.station.position, halfSize), 6)
  }

  getSVGTransform() {
    return ""
  }
}


export class EdgeLayout {
  edge: EdgeModel
  stations: [StationLayout, StationLayout]

  constructor(edge: EdgeModel, stations: [StationLayout, StationLayout]) {
    this.edge = edge
    this.stations = [...stations]
  }

  assignedAngles: [Angle, Angle] = [{a: 0}, {a: 0}]
  assignedShifts: [xy, xy] = [Vec.pair(0, 0), Vec.pair(0, 0)]

  toSVGPath() {
    let a = Vec.add(this.stations[0].station.position, this.assignedShifts[0])
    let b = Vec.add(this.stations[1].station.position, this.assignedShifts[1])
    let [angleA, angleB] = this.assignedAngles

    let bend = Vec.norm(Vec.sub(b, a))
    let p_1 = Vec.add(a, Vec.mul(Vec.unit(angleA), bend))
    let p_2 = Vec.sub(b, Vec.mul(Vec.unit(angleB), bend))
    return `M ${a.x} ${a.y} C ${p_1.x} ${p_1.y} ${p_2.x} ${p_2.y} ${b.x} ${b.y}`
  }
}

export class RouteLayout {
  route: RouteModel

  constructor(route: RouteModel) {
    this.route = route
  }

  stations: StationLayout[] = []
  edges: EdgeLayout[] = []


  assignedShifts: xy[]
}

class RouteDiagramLayout {
  routes: Map<RouteModel, RouteLayout> = new Map()
  stations: Map<StationModel, StationLayout> = new Map()

  constructor(routeDiagram: RouteDiagramModel) {
    for (let station of routeDiagram.stations.values()) {
      this.stations.set(station, new StationLayout(station))
    }
    for (let route of routeDiagram.routes.values()) {
      this.routes.set(route, new RouteLayout(route))
    }

    this.decideAmountsOfSlots()
    this.decideShapesOfStations()
    this.assignSlots()
    this.createEdgePaths()
  }

  private decideAmountsOfSlots() {
    for (let stationLayout of this.stationLayouts.values()) {
      stationLayout.nSlots = [0, 0, 0, 0]
      for (let slotAngle = 0; slotAngle < 4; ++slotAngle) {
        stationLayout.nSlots[slotAngle] = Math.max(stationLayout.incomingEdges[slotAngle].length,
          stationLayout.incomingEdges[slotAngle + 4].length)
      }
    }
  }

  private stationShapeScore(stationSize: xy) {
    return -stationSize.x * stationSize.y
  }

  private decideShapesOfStations() {
    for (let stationLayout of this.stationLayouts.values()) {
      let m = stationLayout.nSlots.map(i => i - 1)
      let sizes = []

      // The station will be rotated either 0 or 45 degrees.
      for (let rotation = 0; rotation < 2; ++rotation) {
        let size = Vec.pair(0, 0)
        let diagonal = Math.max(m[rotation + 1], m[(rotation + 3) % 4]) * Math.sqrt(2)
        size = Vec.pair(Math.max(m[rotation + 2], diagonal), Math.max(m[rotation], diagonal))
        size = Vec.map(i => Math.max(i, 0), size)
        sizes.push(size)
      }

      let bestRotation = this.stationShapeScore(sizes[0]) >= this.stationShapeScore(sizes[1]) ? 0 : 1
      stationLayout.rotation = unalignAngle({dA: bestRotation})
      stationLayout.size = Vec.mul(sizes[bestRotation], 8)
    }
  }

  private assignSlots() {
    for (let stationLayout of this.stationLayouts.values()) {
      for (let angle = 0; angle < 8; ++angle) {
        let n = stationLayout.nSlots[angle % 4]
        let candidates = [...stationLayout.incomingEdges[angle]]
        let u = unalignAngle({dA: (angle + 4) % 8})
        let value = (q: xy) => {
          let p = stationLayout.station.center
          let [a, _] = Vec.manhattanDistances(p, u, q)
          // let a = Vec.distanceToLine(p, q, Vec.add(q, Vec.unit({a: u.a +
          // Math.PI / 2}))) let b = Vec.distanceToLine(q, p, Vec.add(p,
          // Vec.unit(u)))
          return a
        }
        // candidates.sort((a, b) => value(a.edge.b.center) -
        // value(b.edge.b.center))
        candidates.sort((a, b) => a.edge.color.localeCompare(b.edge.color))
        // if (angle >= 4) {
        //   candidates.reverse()
        // }
        for (let j = 0; j < candidates.length; ++j) {
          let edgeLayout = candidates[j]
          let shiftValue = 8 * (j - (n - 1) / 2)
          let shift = Vec.mul(Vec.unit(unalignAngle({dA: 2 + angle % 4})), shiftValue)

          if (stationLayout === edgeLayout.aLayout) {
            edgeLayout.assignedShiftA = shift
          } else {
            edgeLayout.assignedShiftB = shift
          }
        }
      }
    }
  }

  private createEdgePaths() {
    for (let edgeLayout of this.edgeLayouts.values()) {
    }
  }

}


export function computeLayout(stations: StationLayout[], edges: EdgeModel[]): [Map<StationLayout, StationLayout>, Map<EdgeModel, EdgeModel>] {
  let computation = new RouteDiagramLayout(stations, edges)
  return [computation.stationLayouts, computation.edgeLayouts]
}
