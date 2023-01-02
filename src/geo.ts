import {Vec} from "./vec"

export type xy = { readonly x: number, readonly y: number }
export type Line = [xy, xy]  // Or segment.
export type Polygon = xy[]
export type Angle = { readonly a: number }

import * as vec from "./vec"

export function radToDeg(radians: number) {
  return 180 * radians / Math.PI
}

export function lineFromPointAndAngle(point: xy, angle: Angle): Line {
  return [point, Vec.add(point, Vec.unit(angle))]
}

export type DiagramAlignment = "bendLeft" | "bendRight"

type DiscreteAngle = { dA: number }

export function getApproachAngles(a: xy, b: xy, alignment: DiagramAlignment): Angle[] {
  let delta = Vec.sub(b, a)
  let diagonalAmount = Vec.fold(Math.min, Vec.map(Math.abs, delta))
  let diagonalVector = Vec.map(Math.sign, delta)
  let diagonalPath = Vec.mul(diagonalVector, diagonalAmount)
  let diagonalAngle = Vec.angle(diagonalVector)

  let straightPath = Vec.sub(b, Vec.add(a, diagonalPath))
  let straightAmount = Vec.norm(straightPath)
  let straightAngle = Vec.angle(straightPath)

  if(diagonalAmount == 0) {
    return [straightAngle, straightAngle]
  }
  if(straightAmount == 0) {
    return [diagonalAngle, diagonalAngle]
  }


}

export function diagramAlignmentAngles(a: xy, b: xy, alignment: DiagramAlignment): Angle[] {
  let delta = Vec.sub(b, a)

  let diagonalAmount = Vec.fold(Math.min, Vec.map(Math.abs, delta))
  let diagonalVector = Vec.map(Math.sign, delta)
  let diagonalPath = Vec.mul(diagonalVector, diagonalAmount)
  let diagonalAngle = Vec.angle(diagonalVector)

  let straightPath = Vec.sub(b, Vec.add(a, diagonalPath))
  let straightAngle = Vec.angle(straightPath)

  if (diagonalAmount == 0) {
    return [straightAngle]
  }

  // console.log(diagonalPath, straightPath)
  // console.log(diagonalAngle, straightAngle)
  let [firstAngle, secondAngle] = [diagonalAngle, straightAngle]

  if (Vec.cross(diagonalPath, straightPath) > 0) {
    [firstAngle, secondAngle] = [secondAngle, firstAngle]
  }
  if (alignment == "bendRight") {
    [firstAngle, secondAngle] = [secondAngle, firstAngle]
  }
  return [firstAngle, secondAngle]
}

export function pointsFromAlignmentAngles(a: xy, b: xy, angles: Angle[]) {
  if(angles.length === 1) {
    return [a, b]
  }
  let [first, second] = angles

  // console.log(first, second)
  let p = intersectionOfLines([a, Vec.add(a, Vec.unit(first))], [b, Vec.add(b, Vec.unit(second))])
  return [a, p, b]
}
export function alignAngle(alpha: Angle): DiscreteAngle {
  return {dA: (8 + Math.round(alpha.a / (Math.PI / 4))) % 8}
}

export function unalignAngle(alpha: DiscreteAngle): Angle {
  return {a: alpha.dA * Math.PI / 4}
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
