import * as d3 from "d3"
import {D3ZoomEvent, sum} from "d3"
import {Station, Edge, computeLayout} from "./graph"
import * as geo from "./geo"

import * as vec from "./vec"
import {dragEdgeBehavior, dragStationBehavior} from "./drag"
import {UserSelection} from "./selection"
import {Vec} from "./vec"
import {loadCity} from "./loadCity"

export class App {
  svg: d3.Selection<SVGElement, any, any, any>
  stations: Station[] = []
  edges: Edge[] = []

  userSelection: UserSelection = new UserSelection(this)

  constructor() {
    this.svg = d3.select("svg")
    this.svg.append("g")
      .attr("id", "content")

    for (let groupId of ["city", "selections", "edges", "stations", "waypoints","stations2"]) {
      d3.select("#content")
        .append("g")
        .attr("id", groupId)
    }

    this.stations.push(new Station({x: 0, y: 0}))
    this.stations.push(new Station({x: 173, y: 0}))
    this.stations.push(new Station({x: 285, y: 0}))
    this.stations.push(new Station({x: 28, y: 45}))
    this.stations.push(new Station({x: 81, y: 88}))

    // for (let y = 120; y <= 400; y += 50) {
    //   for (let x = 120; x <= 500; x += 50) {
    //     this.stations.push(new Station(Vec.pair(x, y)))
    //     if (x > 120)
    //       this.edges.push(new Edge(this.stations[this.stations.length - 2], this.stations[this.stations.length - 1]))
    //   }
    // }
    //
    // let x = new Station({x: 600, y: 120})
    // this.stations.push(x)
    // let n = 16
    // for (let i = 0; i < n; ++i) {
    //   let y = new Station({
    //     x: 600 + 80 * Math.sin(2 * Math.PI / n * i),
    //     y: 120 + 80 * Math.cos(2 * Math.PI / n * i),
    //   })
    //
    //   this.stations.push(y)
    //   this.edges.push(new Edge(x, y))
    //
    // }

    this.addMap()
    this.draw()
    this.addResizeBehavior()
    this.addZoomBehavior()
  }

  async addMap() {

    let [stations, edges] = loadCity()
    this.stations.push(...stations)
    this.edges.push(...edges)

    // // @ts-ignore
    // let routes: any = require("/src/assets/routes.json")
    //
    // let routeIds = []
    // for (let route of routes.elements) {
    //   routeIds.push(route.id)
    // }
    // console.log(routeIds)
    //
    // let stationName = (name: string) => {
    //   if (!name) return undefined
    //   let matches = name.match(/^(.*?)[ 0-9]*$/)
    //   return matches[1]
    // }
    //
    // let coordsByStation: Map<string, number[][]> = new Map()
    //
    // // @ts-ignore
    // let newWarsaw: any = require("/src/assets/export.geojson.json")
    //
    // let baseProjection = d3.geoMercator()
    //   .scale(700000)
    //   .center([21.006188, 52.231813])
    // let alpha = Math.PI / 180 * 19
    // let cosAlpha = Math.cos(alpha)
    // let sinAlpha = Math.sin(alpha)
    //
    //
    // function rasterize(x, y, r = 4): [number, number] {
    //   return [Math.round(x / r) * r, Math.round(y / r) * r]
    // }
    //
    // let transform = ([x, y]: number[]): [number, number] => {
    //   let [X, Y] = baseProjection([x, y])
    //   // this.stream.point(X, Y)
    //   return rasterize(X * cosAlpha - Y * sinAlpha, Y * cosAlpha + X * sinAlpha)
    // }
    // let projection = d3.geoTransform({
    //   point: function (x, y) {
    //     this.stream.point(...transform([x, y]))
    //   },
    // })
    // // .fitExtent([[0,0],[1000, 1000]], newWarsaw)
    // let geoGenerator = d3.geoPath()
    //   // .projection(baseProjection)
    //   .projection(projection)
    //
    // // for(let feature of newWarsaw.features) {
    // //   if()
    // // }
    //
    // for (let feature of newWarsaw.features) {
    //   let name = stationName(feature.properties.name)
    //
    //   if (!name) continue
    //   let geometry = feature.geometry
    //   if (!geometry) continue
    //   if (!coordsByStation.has(name)) coordsByStation.set(name, [])
    //   if (geometry.type == "Polygon") {
    //     for (let coordsList of geometry.coordinates) {
    //       for (let coords of coordsList) {
    //         coordsByStation.get(name).push(coords)
    //       }
    //     }
    //   } else if (geometry.type == "Point") {
    //     coordsByStation.get(name).push(geometry.coordinates)
    //   }
    //
    //   let relations = feature.properties["@relations"]
    //   if (!name || !relations) continue
    //
    //   for (let line of relations) {
    //     let lineName = line.reltags.name
    //     // console.log(stationName(name), lineName)
    //   }
    // }
    // console.log(coordsByStation)
    //
    // let stationCoords: Map<string, number[]> = new Map()
    // for (let [station, coords] of coordsByStation.entries()) {
    //   if (coords.length < 1) continue
    //   let as = [], bs = []
    //   for (let [a, b] of coords) {
    //     as.push(a)
    //     bs.push(b)
    //   }
    //   let A = sum(as) / as.length, B = sum(bs) / bs.length
    //
    //   this.stations.push(new Station(Vec.pair(...transform([A, B])), station))
    //   stationCoords.set(station, [A, B])
    // }


    // let u = d3.select("#city")
    //   .selectAll("*")
    //   .data(newWarsaw.features)
    //   .join("path")
    //   .attr("d", geoGenerator)
  }

  draw() {
    console.log("Updating elements.")

    let [stationLayouts, edgeLayouts] = computeLayout(this.stations, this.edges)

    d3.select("#edges")
      .selectAll("*")
      .data(this.edges)
      .join(enter => enter.append("path")
        .attr("fill", "none")
        .call(dragEdgeBehavior(this)),
      )
      .transition()
      .duration(200)
      .ease(d3.easeCubicOut)
      .attr("d", edge => edgeLayouts.get(edge).toSVGPath())

    d3.select("svg")
      .on("click", (event: MouseEvent) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey) return
        this.userSelection.clear()
      })

    let app = this
    d3.select("#stations")
      .selectAll("*")
      .data(this.stations, (station: Station) => "" + station.center.x + " " + station.center.y)
      .join(enter =>
        enter.append("path")
          // .attr("rx", 6)// TODO: read these from CSS
          // .attr("ry", 6)
          .on("click", (event: MouseEvent, station) => {
            if (event.defaultPrevented) return // Dragged.
            if (!event.ctrlKey) app.userSelection.clear()
            app.userSelection.add(station)
            event.stopPropagation()
          }).call(dragStationBehavior(this)),
      )
      .classed("selected", station => this.userSelection.has(station))
      .transition()
      .duration(200)
      .ease(d3.easeQuadOut)
      .attr("transform", station => stationLayouts.get(station).getSVGTransform())
      .attr("d", station => stationLayouts.get(station).toSVGPath())
      .attr("title", station => station.name)
    // .attr("x", datum => stationLayouts.get(datum).toRect().x)
    // .attr("y", datum => stationLayouts.get(datum).toRect().y)
    // .attr("width", datum => stationLayouts.get(datum).toRect().w)
    // .attr("height", datum => stationLayouts.get(datum).toRect().h)

    d3.select("#stations2")
      .selectAll("*")
      .data(this.stations, (station: Station) => "" + station.center.x + " " + station.center.y)
      .join("text")
      .text(station => station.name)
      .attr("x", station => station.center.x)
      .attr("y", station => station.center.y)
      .attr("text-anchor", "middle")
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
