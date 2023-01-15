import {Vec} from "./vec"

export type xy = Readonly<{ x: number, y: number }>
export type Line = [xy, xy] & { __brand: "Line" }  // Or segment.
export type Polygon = xy[] & { __brand: "Polygon" }
export type Angle = number & { __brand: "Angle" }

export function radToDeg(radians: number) {
  return 180 * radians / Math.PI
}

export function lineFromPointAndAngle(point: xy, angle: Angle): Line {
  return [point, Vec.add(point, Vec.unit(angle))] as Line
}



// From
// https://dirask.com/posts/JavaScript-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj.
export function intersectionOfLines(line_1: Line, line_2: Line): xy | null {
  let [p1, p2] = line_1
  let [p3, p4] = line_2
  let c2x = p3.x - p4.x // (x3 - x4)
  let c3x = p1.x - p2.x // (x1 - x2)
  let c2y = p3.y - p4.y // (y3 - y4)
  let c3y = p1.y - p2.y // (y1 - y2)

  // Bottom part of intersection point formula.
  let d = c3x * c2y - c3y * c2x

  if (d == 0) {
    return null
  }

  // Upper part of intersection point formula.
  let u1 = p1.x * p2.y - p1.y * p2.x // (x1 * y2 - y1 * x2)
  let u4 = p3.x * p4.y - p3.y * p4.x // (x3 * y4 - y3 * x4)

  // Intersection point formula.
  let px = (u1 * c2x - c3x * u4) / d
  let py = (u1 * c2y - c3y * u4) / d

  return Vec.pair(px, py)
}
