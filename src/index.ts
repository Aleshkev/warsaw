import * as d3 from "d3"
import {D3ZoomEvent, sum} from "d3"
import {
  RouteDiagramLayout,
  RouteLayout,
  StationLayout,
} from "./layout"

import {dragEdgeBehavior, dragStationBehavior} from "./drag"
import {UserSelection} from "./selection"
import {Vec} from "./vec"
import {loadCity} from "./loadCity"
import {
  RouteDiagramModel,
  RouteGroupModel,
  RouteModel,
  StationModel,
} from "./model"

export class App {
  svg: d3.Selection<SVGElement, any, any, any>

  routeDiagram: RouteDiagramModel = new RouteDiagramModel()

  userSelection: UserSelection = new UserSelection(this)

  constructor() {
    this.svg = d3.select("svg")
    this.svg.append("g")
      .attr("id", "content")

    for (let groupId of ["city", "selections", "edges", "stations", "waypoints", "stations2"]) {
      d3.select("#content")
        .append("g")
        .attr("id", groupId)
    }

    loadCity(this.routeDiagram)
    console.log(this.routeDiagram)

    // let r = new RouteModel(new RouteGroupModel("black"), "def")
    // r.pushStation(new StationModel(Vec.pair(0, 0), "Pałac Kultury i Nauki"), null)
    // this.routeDiagram.addRoute(r)

    this.draw()
    this.addResizeBehavior()
    this.addZoomBehavior()

    d3.select("#loading-error").remove()
  }

  draw() {
    console.log("Updating elements.")

    let layout = new RouteDiagramLayout(this.routeDiagram)

    d3.select("#edges")
      .selectAll("*")
      .data(layout.routes.values(), (layout: RouteLayout) => layout.model.uuid)
      .join(enter => enter.append("path")
        .attr("fill", "none")
        .call(dragEdgeBehavior(this)),
      )
      // .transition()
      // .duration(200)
      // .ease(d3.easeCubicOut)
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
      .data(layout.stations.values(), (layout: StationLayout) => layout.model.uuid)
      .join(enter =>
        enter.append("path")
          .on("click", (event: MouseEvent, station) => {
            if (event.defaultPrevented) return // Dragged.
            if (!event.ctrlKey) app.userSelection.clear()
            app.userSelection.add(station)
            event.stopPropagation()
          }).call(dragStationBehavior(this)),
      )
      .classed("selected", station => this.userSelection.has(station))
      .call(StationLayout.customizePath)
      // .attr("transform", station => stationLayouts.get(station).getSVGTransform())
      // .transition()
      // .duration(200)
      // .ease(d3.easeQuadOut)
      .attr("d", layout => layout.toSVGPath())

    d3.select("#stations2")
      .selectAll("*")
      .data([...layout.stations.values()].filter(station => this.userSelection.has(station)), (station: StationLayout) => station.model.uuid)
      .join("text")
      // .classed("selected", station => this.userSelection.has(station))
      .text(station => station.model.name)
      .attr("x", station => station.model.position.x)
      .attr("y", station => station.model.position.y)
      .attr("text-anchor", "middle")
  }

  addZoomBehavior() {
    let handleZoom = (event: D3ZoomEvent<any, any>) => {
      d3.select("#content")
        // .transition()
        // .duration(25)
        // .ease(d3.easeQuadOut)
        .attr("transform", event.transform.toString())
    }
    let zoom = d3.zoom()
      .on("zoom", handleZoom)
      // .scaleExtent([.20, 5])
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

let app = new App()
// @ts-ignore
window.app = app
