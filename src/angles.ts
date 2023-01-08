import {Angle} from "./geo"
import {Vec} from "./vec"


export namespace Angles {
  export function equals(a: Angle, b: Angle, eps: number = 1e-6): boolean {
    return Math.abs(a.a - b.a) < eps
  }
  export function of(rad: number): Angle {
    return {a: rad}
  }

  export function add(alpha: Angle, beta: Angle): Angle {
    return {a: alpha.a + beta.a}
  }

  export function round(alpha: Angle, n: number = 8): Angle {
    let x = 2 * Math.PI / n
    return {a: Math.round(alpha.a / x) * x}
  }

  export function average(alpha: Angle, beta: Angle): Angle {
    return Vec.toAngle(Vec.add(Vec.unit(alpha), Vec.unit(beta)))
  }

  export function halfCircle(alpha: Angle): Angle {
    let x = alpha.a % Math.PI
    if(Math.abs(x) <= Math.PI / 2 && !Angles.equals({a: x}, {a: Math.PI / 2})) return {a: x}
    if(x > 0) return {a: x - Math.PI}
    return {a: x + Math.PI}
    // let y = (x + Math.PI) % Math.PI
    // let z = (x - Math.PI) % Math.PI
    // return Angles.of(Math.abs(x) < Math.abs(y) ? x : y)
  }
}
