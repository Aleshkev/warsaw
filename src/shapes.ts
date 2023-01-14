import {xy} from "./math/geo"
import {Vec} from "./math/vec"

export function roundedRectangle(a: xy, b: xy, r: number) {
  let c = Vec.pair(b.x, a.y), d = Vec.pair(a.x, b.y)

  return `M ${a.x + r} ${a.y}
      L ${c.x - r} ${c.y} a ${r} ${r} 0 0 1 ${r} ${r} 
      L ${b.x} ${b.y - r} a ${r} ${r} 0 0 1 ${-r} ${r}
      L ${d.x + r} ${d.y} a ${r} ${r} 0 0 1 ${-r} ${-r}
      L ${a.x} ${a.y + r} a ${r} ${r} 0 0 1 ${r} ${-r}`
}

export function circle(a: xy, r: number) {
  return roundedRectangle(Vec.sub(a, Vec.pair(r, r)), Vec.add(a, Vec.pair(r, r)), r)
}
