import * as d3 from "d3"
import {D3ZoomEvent} from "d3"
import {RouteDiagramLayout, RouteLayout, StationLayout} from "./layout/computeLayout"

import {dragStationBehavior} from "./drag"
import {UserSelection} from "./selection"
import {loadCity} from "./fetch/loadCity"
import {Model} from "./model/model"
import {newEmptyDiagram} from "./model/mutateDiagram"
import {autoPrettify} from "./model/prettify"
import {logPretty} from "./util"
import {List, Map} from "immutable"


// The main entry point, and all global state.
export class App {
  // We draw stuff here.
  svg: d3.Selection<SVGElement, any, any, any>

  // We store stuff here.
  diagram: Model.Diagram = newEmptyDiagram()

  userSelection: UserSelection = new UserSelection(this)

  constructor() {
    this.svg = d3.select("svg")
    this.svg.append("g")
      .attr("id", "content")

    for (let groupId of ["city", "selections", "edges", "stations", "waypoints", "labels"]) {
      d3.select("#content")
        .append("g")
        .attr("id", groupId)
    }

    this.diagram = autoPrettify(loadCity())
    console.log(this.diagram.stations.toJS())
    console.log(this.diagram.routes.toJS())

    this.draw()
    this.addResizeBehavior()
    this.addZoomBehavior()

    d3.select("#loading-error").remove()
  }

  draw() {
    console.log(...logPretty("updating layout..."))
    let layout = new RouteDiagramLayout(this.diagram)

    d3.select("#edges")
      .selectAll("*")
      .data(layout.routes.values())  // Workaround to make type check happy.
      .data(layout.routes.values(), it => it.model.id as string)
      .join(enter => enter.append("path")
        .attr("fill", "none"),
      )
      .attr("d", layout => layout.toSVGPath())
      .call(RouteLayout.customizePath)

    d3.select("svg")
      .on("click", (event: MouseEvent) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey) return
        this.userSelection.clear()
      })


    let app = this
    d3.select("#stations")
      .selectAll("*")
      // @ts-ignore
      .data(layout.stations.values(), (layout: StationLayout) => layout.model.id)
      .join(enter =>
        enter.append("path")
          .on("click", (event: MouseEvent, station) => {
            if (event.defaultPrevented) return // Dragged.
            if (!event.ctrlKey) app.userSelection.clear()
            app.userSelection.add(station)
            event.stopPropagation()
          }).call(dragStationBehavior(this)),
      )
      .classed("selected", it => this.userSelection.has(it))
      .call(StationLayout.customizePath)
      .attr("d", it => it.toSVGPath())

    d3.select("#labels")
      .selectAll("*")
      .data(layout.stations.values())
      .data(Map(layout.stations).valueSeq().filter(it => this.userSelection.has(it)), it => it.model.id)
      .join("text")
      .text(it => it.model.name)
      .attr("x", it => it.model.position.x)
      .attr("y", it => it.model.position.y)
      .attr("text-anchor", "middle")
  }

  addZoomBehavior() {
    let handleZoom = (event: D3ZoomEvent<any, any>) => {
      d3.select("#content")
        .attr("transform", event.transform.toString())
    }
    let zoom = d3.zoom<SVGElement, any>()
      .on("zoom", handleZoom)
      .scaleExtent([.01, 20])
      .duration(100)
    this.svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(window.innerWidth / 2, window.innerHeight / 2))
  }

  addResizeBehavior() {
    let onResize = () => {
      this.svg
        .attr("width", document.body.clientWidth)
        .attr("height", document.body.clientHeight)
    }
    onResize()
    window.addEventListener("resize", onResize)
  }
}

new App()
