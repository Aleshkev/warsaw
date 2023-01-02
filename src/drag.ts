import * as d3 from "d3"
import {Edge, Station} from "./graph"
import {App} from "./index"
import {Vec} from "./vec"


export function dragStationBehavior(app: App) {
  return (selection: d3.Selection<any, any, any, any>) =>
    selection.call(d3.drag()
      .on("start", (event, station: Station) => {
        app.userSelection.setTo(station)
      })
      .on("drag", function (event, station: Station) {
        station.center = Vec.pair(Math.round(event.x / 4) * 4, Math.round(event.y / 4) * 4)
        app.draw()
      }))
}

export function dragEdgeBehavior(app: App) {
  return (selection: d3.Selection<any, any, any, any>) => {
    let dragged = null
    selection.call(d3.drag()
      .on("start", (event: MouseEvent, edge: Edge) => {
        dragged = edge
      })
      .on("drag", (event: MouseEvent, edge: Edge) => {
        edge.alignment = (Vec.cross(Vec.sub(edge.b.center, edge.a.center), Vec.sub(event, edge.a.center)) > 0 ? "bendLeft" : "bendRight")
        app.draw()
      }))
  }
}
