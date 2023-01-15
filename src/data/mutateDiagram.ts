import {Model} from "./model"
import {randomId} from "../util"
import {Map} from "immutable"


export function newEmptyDiagram(name: string = "Warsaw", description: string = "Poland, 2022"): Model.Diagram {
  return {
    id: randomId() as Model.DiagramId,
    name,
    description,
    stations: Map(),
    routeGroups: Map(),
    routes: Map(),
  }
}
