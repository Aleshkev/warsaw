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
import {RouteDiagramModel} from "./model"

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

    // this.stations.push(new Station({x: 0, y: 0}))
    // this.stations.push(new Station({x: 173, y: 0}))
    // this.stations.push(new Station({x: 285, y: 0}))
    // this.stations.push(new Station({x: 28, y: 45}))
    // this.stations.push(new Station({x: 81, y: 88}))

    // for (let y = 120; y <= 400; y += 50) {
    //   for (let x = 120; x <= 500; x += 50) {
    //     this.stations.push(new Station(Vec.pair(x, y)))
    //     if (x > 120)
    //       this.edges.push(new Edge(this.stations[this.stations.length - 2],
    // this.stations[this.stations.length - 1])) } }  let x = new Station({x:
    // 600, y: 120}) this.stations.push(x) let n = 16 for (let i = 0; i < n;
    // ++i) { let y = new Station({ x: 600 + 80 * Math.sin(2 * Math.PI / n *
    // i), y: 120 + 80 * Math.cos(2 * Math.PI / n * i), })
    // this.stations.push(y) this.edges.push(new Edge(x, y))  }

    loadCity(this.routeDiagram)
    console.log(this.routeDiagram)

    this.draw()
    this.addResizeBehavior()
    this.addZoomBehavior()
  }

  draw() {
    console.log("Updating elements.")

    // let [stationLayouts, edgeLayouts] = computeLayout(this.stations,
    // this.edges)

    let layout = new RouteDiagramLayout(this.routeDiagram)

    d3.select("#edges")
      .selectAll("*")
      .data(layout.routes.values(), (layout: RouteLayout) => layout.model.uuid)
      .join(enter => enter.append("path")
        .attr("fill", "none")
        .call(dragEdgeBehavior(this)),
      )
      .transition()
      .duration(200)
      .ease(d3.easeCubicOut)
      .attr("d", layout => layout.toSVGPath())
      .attr("style", layout => "stroke:" + layout.model.group.color)

    d3.select("svg")
      .on("click", (event: MouseEvent) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey) return
        this.userSelection.clear()
      })

    console.log(this.userSelection)
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
      // .attr("transform", station => stationLayouts.get(station).getSVGTransform())
      // .transition()
      // .duration(200)
      // .ease(d3.easeQuadOut)
      .attr("d", layout => layout.toSVGPath())

    // d3.select("#stations2")
    //   .selectAll("*")
    //   .data(this.routeDiagram.stations, (station: Station) => "" + station.center.x + " " + station.center.y)
    //   .join("text")
    //   .text(station => station.name)
    //   .attr("x", station => station.center.x)
    //   .attr("y", station => station.center.y)
    //   .attr("text-anchor", "middle")
  }

  addZoomBehavior() {
    let handleZoom = (event: D3ZoomEvent<any, any>) => {
      d3.select("#content")
        .attr("transform", event.transform.toString())
    }
    let zoom = d3.zoom()
      .on("zoom", handleZoom)
      // .scaleExtent([.20, 5])
      .duration(100)
    this.svg.call(zoom)
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
