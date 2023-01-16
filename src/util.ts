// import  from "uuid"

import {v4} from "uuid"
import {List} from "immutable"

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

export function removeAdjacentDuplicates<T>(a: List<T>) {
  return a.filter((x, i) => x != a.get(i + 1))
}

export function logPretty(message: string): string[] {
  const color = `#232025`
  const backgroundColor = `#fceffc`
  return [`%c${message}`, `color: ${color}; background-color: ${backgroundColor}; padding: 0 24px`]
}

export type Mutable<T> = T & {
  -readonly [P in keyof T]: T[P]
};
