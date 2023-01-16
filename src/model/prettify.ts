import {Model} from "./model"
import {mergeStations, updateStation} from "./mutateStation"
import {List, Map, Set} from "immutable"
import {removeRoute, updateRoute} from "./mutateRoute"
import {logPretty, randomId} from "../util"
import {addRouteGroup} from "./mutateRouteGroup"

// Merges stations for which the grouper returns the same value.
function mergeStationsBy<T>(diagram: Model.Diagram, grouper: (station: Model.Station) => T): Model.Diagram {
  // TODO: make efficient
  diagram.stations.valueSeq().groupBy(grouper).forEach(stations => {
    let newStation
    [diagram, newStation] = mergeStations(diagram, stations.toList())
  })
  return diagram
}

// Merge stations which have equal names.
export function mergeStationsWithSameNames(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("grouping stations with same names..."))
  return mergeStationsBy(diagram, it => it.name)
}

// Merge stations which have "similar" names. Right now this is a simple
// heuristic made almost exclusively for Warsaw.
export function mergeStationsWithSimilarNames(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("grouping stations with similar names..."))

  function baseName(name: string): string {
    return name.toLowerCase()
      .replace("metro", "")
      .replace("wawa", "x")
      .replace("pkp", "x")
      .trim()
  }

  return mergeStationsBy(diagram, it => baseName(it.name))
}


// Merges routes that are very similar.
//
// Right now, this decides to delete a route if its stations are a subset of
// another route's stations.
export function mergeRoutesWithSimilarStations(diagram: Model.Diagram): Model.Diagram {
  console.log(...logPretty("merging routes with similar stations..."))

  function isSubRoute(_diagram: Model.Diagram, routeA: Model.Route, routeB: Model.Route, precision = 0) {
    if (routeA.stations.size > routeB.stations.size) return false
    let stationsInsideOfANotInsideOfB = routeA.stations.filter(it => !routeB.stations.contains(it))
    return stationsInsideOfANotInsideOfB.size <= precision
  }

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

// Groups routes randomly so that the maximal number of lines that pass through
// a single station is limited.
//
// Not actually implemented yet ;c
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

// Groups routes with the same category, creating a new route group with the
// given color.
export function groupCategory(diagram: Model.Diagram, category: string, color: string = "blue"): Model.Diagram {
  console.log(...logPretty(`grouping ${category} routes...`))

  let newGroup: Model.RouteGroup
  [diagram, newGroup] = addRouteGroup(diagram, {
    id: randomId() as Model.RouteGroupId,
    name: category,
    color,
    category,
  })
  for (let route of diagram.routes.valueSeq().toList()) {
    if (diagram.routeGroups.get(route.group)!.category !== category) continue

    [diagram, route] = updateRoute(diagram, route, {group: newGroup.id})
  }
  return diagram
}

// Automatically applies some transformations to the diagram to make it smaller
// (more performant) and nicer to look at.
//
// Most of it could be done when loading the city and the performance would
// probably be improved, but the separation makes the code cleaner.
export function autoPrettify(diagram: Model.Diagram): Model.Diagram {

  // These are pretty generic, probably should always be applied when importing.
  diagram = mergeStationsWithSameNames(diagram)
  diagram = mergeRoutesWithSimilarStations(diagram)

  // These should be chosen by the user.
  diagram = mergeStationsWithSimilarNames(diagram)
  diagram = groupCategory(diagram, "train", `black`)
  diagram = groupCategory(diagram, "tram", `#cb46e0`)

  return diagram
}
