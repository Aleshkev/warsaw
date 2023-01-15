import * as d3 from "d3"
import {List} from "immutable"
import {Vec} from "../math/vec"
import {xy} from "../math/geo"

function roundPosition(x: number, y: number, r: number = 8): [number, number] {
  return [Math.round(x / r) * r, Math.round(y / r) * r]
}

export type RawProjection = (x: number, y: number) => [number, number]

export function getRawProjection(center: [number, number] = [21.006188, 52.231813], scale = 700000): RawProjection {
  let baseProjection = d3.geoMercator()
    .scale(scale)
    .center(center)
    .translate([0, 0])  // The default isn't zero 🥹 so much debugging
    .angle(-19)
  return (x, y) => roundPosition(...baseProjection([x, y]) ?? [0, 0])
}

export function getProjection(rawProjection: RawProjection) {
  return d3.geoTransform({
    point: function (x, y) {
      this.stream.point(...rawProjection(x, y))
    },
  })
}

export function getAveragePixelPosition(rawProjection: RawProjection, geoPositions: List<[number, number]>): xy {
  if (geoPositions.size == 0) return Vec.pair(0, 0)
  let [sumX, sumY] = geoPositions.reduce<[number, number]>(([x_1, y_1], [x_2, y_2]) => [x_1 + x_2, y_1 + y_2])
  let averageX = sumX / geoPositions.size, averageY = sumY / geoPositions.size
  return Vec.pair(...rawProjection(averageX, averageY))
}
