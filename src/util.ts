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
