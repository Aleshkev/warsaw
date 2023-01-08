import {Angle} from "./geo"


export namespace Angles {
  export function round(alpha: Angle, n: number = 8): Angle {
    let x = 2 * Math.PI / n
    return {a: Math.round(alpha.a / x) * x}
  }
}
