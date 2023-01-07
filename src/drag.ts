import * as d3 from "d3"
import {App} from "./index"
import {Vec} from "./vec"
import {EdgeModel, StationModel} from "./model"
import {StationLayout} from "./layout"


export function dragStationBehavior(app: App) {
  return (selection: d3.Selection<any, StationLayout, any, any>) =>
    selection.call(d3.drag()
      .on("start", (event, station: StationLayout) => {
        app.userSelection.setTo(station)
      })
      .on("drag", function (event, station: StationLayout) {
        station.model.position = Vec.pair(Math.round(event.x / 4) * 4, Math.round(event.y / 4) * 4)
        app.draw()
      }))
}

export function dragEdgeBehavior(app: App) {
  return (selection: d3.Selection<any, any, any, any>) => {
    let dragged: EdgeModel | null = null
    selection.call(d3.drag()
      .on("start", (event: MouseEvent, edge: EdgeModel) => {
        dragged = edge
      })
      .on("drag", (event: MouseEvent, edge: EdgeModel) => {
        // edge.alignment = (Vec.cross(Vec.sub(edge.b.center, edge.a.center),
        // Vec.sub(event, edge.a.center)) > 0 ? "bendLeft" : "bendRight")
        app.draw()
      }))
  }
}
