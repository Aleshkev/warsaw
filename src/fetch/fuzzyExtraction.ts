import {OSMId} from "./common"

export function extractStationName(s: string): string {
  if (s == "") return "?"
  let match = s.match(/^(.*?)[ 0-9]*$/)![1]
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
  return +s.match(/[0-9]+/)?.[0]! as OSMId
}
