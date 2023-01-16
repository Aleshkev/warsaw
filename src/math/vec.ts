import {angle, xy} from "./geo"

export namespace Vec {
  export function pair(x: number, y: number): xy {
    return {x: x, y: y}
  }

  export function equals(a: xy, b: xy, eps: number = 1e-6): boolean {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps
  }

  export function unit(alpha: angle): xy {
    return {x: Math.cos(alpha), y: Math.sin(alpha)}
  }

  export function toAngle(v: xy): angle {
    return Math.atan2(v.y, v.x) as angle
  }

  export function toAngle2(a: xy, b: xy): angle {
    return toAngle(Vec.sub(b, a))
  }

  export function add(a: xy, b: xy): xy {
    return {x: a.x + b.x, y: a.y + b.y}
  }

  export function sum(...more: xy[]) {
    let a = Vec.pair(0, 0)
    for (let b of more) a = Vec.add(a, b)
    return a
  }

  export function sub(a: xy, b: xy): xy {
    return {x: a.x - b.x, y: a.y - b.y}
  }

  export function mul(a: xy, c: number): xy {
    return {x: a.x * c, y: a.y * c}
  }

  export function div(a: xy, c: number): xy {
    return {x: a.x / c, y: a.y / c}
  }

  export function dot(a: xy, b: xy): number {
    return a.x * b.x + a.y * b.y
  }

  // a × b, cross product of two vectors.
  export function cross(a: xy, b: xy): number {
    return a.x * b.y - a.y * b.x
  }

  // |a|², length of a vector squared.
  export function norm2(v: xy): number {
    return v.x * v.x + v.y * v.y
  }

  // |a|, length of a vector.
  export function norm(v: xy): number {
    return Math.sqrt(Vec.norm2(v))
  }

  export function distance2(a: xy, b: xy): number {
    return Vec.norm2(Vec.sub(b, a))
  }

  // |b - a|, distance between two points.
  export function distance(a: xy, b: xy): number {
    return Vec.norm(Vec.sub(b, a))
  }

  // (a - p) × (b - p), cross product of `a` and `b` interpreted as vectors with
  // origin of `p`.
  export function relate(p: xy, a: xy, b: xy): number {
    return Vec.cross(Vec.sub(a, p), Vec.sub(b, p))
  }

  export function rotate(a: xy, alpha: angle): xy {
    return pair(a.x * Math.cos(alpha) - a.y * Math.sin(alpha),
      a.x * Math.sin(alpha) + a.y * Math.cos(alpha))
  }

  export function map(f: (xOrY: number) => number, a: xy): xy {
    return Vec.pair(f(a.x), f(a.y))
  }

  export function fold<T>(f: (x: number, y: number) => T, a: xy): T {
    return f(a.x, a.y)
  }

  export function toSVGString(p: xy): string {
    return `${p.x} ${p.y}`
  }

  export function distanceToLine(p: xy, v: xy, w: xy, segmentInsteadOfLine: boolean = false) {
    let l2 = Vec.distance2(v, w)
    if (l2 == 0) return Vec.distance2(p, v)
    let t = dot(sub(p, v), sub(w, v)) / l2
    if (segmentInsteadOfLine) {
      if (t < 0) return Vec.distance2(p, v)
      if (t > 1) return Vec.distance2(p, w)
    }
    return Vec.distance(p, {x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y)})
  }

// Returns [|a|, |b|] where
// 1. `p + a + b == q`
// 2. `a` is at angle `alpha`
// 3. `b` is at angle `alpha +- 45°`
  export function manhattanDistances(p: xy, alpha: angle, q: xy) {
    let A = Vec.distanceToLine(p, q, Vec.add(q, Vec.unit(alpha + Math.PI / 2 as angle)))
    let B = Vec.distanceToLine(q, p, Vec.add(p, Vec.unit(alpha)))
    let a = A - B
    let b = B * Math.sqrt(2)
    return [a, b]
  }

  export function toString(p: xy) {
    return `${p.x}, ${p.y}`
  }

  export function round(p: xy, r = 4): xy {
    return Vec.pair(Math.round(p.x / r) * r, Math.round(p.y / r) * r)
  }
}
