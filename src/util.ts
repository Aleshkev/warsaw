// import  from "uuid"

import {v4} from "uuid"

export function getOrDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V) {
  return map.get(key) ?? defaultValue
}

export function getOrPut<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
  let value = map.get(key)
  if (value === undefined) {
    map.set(key, defaultValue)
    return defaultValue
  }
  return value
}

export function randomId() {
  return v4()
}

export function arraysEqual<T>(a: T[], b: T[]) {
  return a.length == b.length && a.every((x, i) => a[i] == b[i])
}
