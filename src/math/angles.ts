import {Angle} from "./geo"
import {Vec} from "./vec"


export namespace Angles {
  export function equals(a: Angle, b: Angle, eps: number = 1e-6): boolean {
    return Math.abs(a - b) < eps
  }

  export function add(alpha: Angle, beta: Angle): Angle {
    return alpha + beta as Angle
  }

  export function round(alpha: Angle, n: number = 8): Angle {
    let x = 2 * Math.PI / n
    return Math.round(alpha / x) * x as Angle
  }

  export function average(alpha: Angle, beta: Angle): Angle {
    return Vec.toAngle(Vec.add(Vec.unit(alpha), Vec.unit(beta)))
  }

  export function halfCircle(alpha: Angle): Angle {
    let x = alpha % Math.PI as Angle
    if(Math.abs(x) <= Math.PI / 2 && !Angles.equals( x, Math.PI / 2 as Angle)) return x
    if(x > 0) return x - Math.PI as Angle
    return x + Math.PI as Angle
    // let y = (x + Math.PI) % Math.PI
    // let z = (x - Math.PI) % Math.PI
    // return Angles.of(Math.abs(x) < Math.abs(y) ? x : y)
  }
}
