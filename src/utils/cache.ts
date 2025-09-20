const simpleCache = <T extends unknown[]>() => {
  const cache: {[key: string]: T} = {}
  return async (key: string, callback: () => Promise<T>) => {
    if (cache[key] === undefined) {
      cache[key] = await callback()
      return cache[key]
    }

    return cache[key]
  }
}

export default simpleCache
