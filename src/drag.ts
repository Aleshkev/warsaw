import * as d3 from "d3"
import {App} from "./index"
import {Vec} from "./math/vec"
import {StationLayout} from "./layout/computeLayout"
import {updateStation} from "./model/mutateStation"


// Dragging a station will set its position.
export function dragStationBehavior(app: App) {
  return (selection: d3.Selection<any, StationLayout, any, any>) =>
    selection.call(d3.drag<Element, StationLayout>()
      .on("start", (event, station: StationLayout) => {
        app.userSelection.setTo(station)
      })

      .on("drag", function (event, station: StationLayout) {
        [app.diagram] = updateStation(app.diagram, station.model, {position: Vec.round(event, 8)})
        app.draw()
      }))
}
