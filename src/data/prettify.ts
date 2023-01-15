import {Model} from "./model"
import {mergeStations, updateStation} from "./mutateStation"
import {List, Map, Set} from "immutable"
import {removeRoute, updateRoute} from "./mutateRoute"
import {logPretty, randomId} from "../util"
import {addRouteGroup} from "./mutateRouteGroup"

function mergeStationsBy<T>(diagram: Model.Diagram, f: (station: Model.Station) => T): Model.Diagram {
  // TODO: make efficient
  diagram.stations.valueSeq().groupBy(f).forEach(stations => {
    let newStation
    [diagram, newStation] = mergeStations(diagram, stations.toList())
  })
  return diagram
}

export function mergeStationsWithSameNames(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("grouping stations with same names..."))
  return mergeStationsBy(diagram, it => it.name)
}

export function mergeStationsWithSimilarNames(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("grouping stations with similar names..."))

  function baseName(name: string): string {
    return name.toLowerCase().replace("metro", "").replace("wawa", "x").replace("pkp", "x").trim()
  }

  return mergeStationsBy(diagram, it => baseName(it.name))
}


function isSubRoute(_diagram: Model.Diagram, routeA: Model.Route, routeB: Model.Route, precision = 0) {
  let stationsInsideOfANotInsideOfB = routeA.stations.filter(it => !routeB.stations.contains(it))
  return stationsInsideOfANotInsideOfB.size <= precision
}

export function mergeRoutesWithSimilarStations(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("merging routes with similar stations..."))

  let routes = diagram.routes.valueSeq().toList()

  // TODO: make efficient, maybe?
  let toDelete: Set<Model.Route> = Set()
  for (let routeA of routes) {
    if (toDelete.has(routeA)) continue
    for (let routeB of routes) {
      if (routeA === routeB) continue
      if (toDelete.has(routeB)) continue
      if (isSubRoute(diagram, routeA, routeB)) {
        toDelete = toDelete.add(routeA)
      }
    }
  }
  for (let route of toDelete.valueSeq()) {
    diagram = removeRoute(diagram, route)
  }
  return diagram
}

// Groups routes randomly so that no more than `maxNPassingLines` pass through
// any station.
export function groupRandomRoutes(diagram: Model.Diagram, maxNPassingLines = 3): Model.Diagram {
  let stationToGroups: Map<Model.Station, List<Model.RouteGroup>> = Map()
  diagram.routes.forEach(route => {
    route.stations.forEach(stationId => {
      let station = diagram.stations.get(stationId)!
      stationToGroups = stationToGroups.set(station, stationToGroups.get(station, List<Model.RouteGroup>()).push(diagram.routeGroups.get(route.group)!))
    })
  })

  for (; ;) {
    let largestStation = stationToGroups.keySeq().maxBy(it => stationToGroups.get(it)!.size)!
    if (stationToGroups.get(largestStation)!.size <= maxNPassingLines) break

    // TODO
  }

  return diagram
}

export function groupCategory(diagram: Model.Diagram, category: string, color: string = "blue"): Model.Diagram {
  console.log(...logPretty(`grouping ${category} routes...`))

  let newGroup
  [diagram, newGroup] = addRouteGroup(diagram, randomId() as Model.RouteGroupId, category, color, category)
  for (let route of diagram.routes.valueSeq()) {
    if (diagram.routeGroups.get(route.group)!.category !== category) continue

    [diagram, route] = updateRoute(diagram, route, {group: newGroup})
  }
  return diagram
}

export function autoPrettify(diagram: Model.Diagram): Model.Diagram {
  diagram = mergeStationsWithSameNames(diagram)
  diagram = mergeRoutesWithSimilarStations(diagram)
  diagram = mergeStationsWithSimilarNames(diagram)
  diagram = groupCategory(diagram, "train", `black`)
  diagram = groupCategory(diagram, "tram", `#cb46e0`)
  return diagram
}
