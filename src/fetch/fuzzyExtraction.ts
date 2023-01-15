import {OSMId} from "./common"
import {Model} from "../data/model"
import slugify from "slugify"

export function extractStationName(s: string): string {
  if (s === "") return "station"
  let match = s.match(/^(.*?)[ 0-9]*$/)?.[1] ?? s
  return match.replace("Warszawa", "Wawa")
}

export function extractRouteName(s: string): string {
  let match_1 = s.match(/^(.*?):/)
  if (match_1) s = match_1[1]
  let match_2 = s.match(/Tram ([0-9]+)/)
  if (match_2) s = match_2[1]
  return s
}

export function extractOSMId(s: string): OSMId | null {
  let id = s.match(/[0-9]+/)?.[0]
  return id ? +id as OSMId : null
}

export function OSMIdToStationId(id: OSMId, name: string): Model.StationId {
  return `osm-stop-${id}-${slugify(name)}` as Model.StationId
}

export function OSMIdToRouteId(id: OSMId, name: string): Model.RouteId {
  return `osm-route-${id}-${slugify(name)}` as Model.RouteId
}
