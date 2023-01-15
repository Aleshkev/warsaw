import {angle} from "./geo"
import {Vec} from "./vec"


export namespace Angle {
  export function equals(a: angle, b: angle, eps: number = 1e-6): boolean {
    return Math.abs(a - b) < eps
  }

  export function add(a: angle, b: angle): angle {
    return a + b as angle
  }

  export function round(a: angle, n: number = 8): angle {
    let x = 2 * Math.PI / n
    return Math.round(a / x) * x as angle
  }

  export function average(a: angle, b: angle): angle {
    return Vec.toAngle(Vec.add(Vec.unit(a), Vec.unit(b)))
  }

  // If the angle is outside [-pi/2, pi/2), return the angle + 180 degrees so
  // that it is inside this range. Effectively reduces angle of a vector to
  // angle of a line.
  export function vectorAngleToLineAngle(a: angle): angle {
    let x = a % Math.PI as angle
    if (Math.abs(x) <= Math.PI / 2 && !Angle.equals(x, Math.PI / 2 as angle)) return x
    if (x > 0) return x - Math.PI as angle
    return x + Math.PI as angle
  }
}
