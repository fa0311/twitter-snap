interface Node {
  [key: string]: any
}

export const findNodeByKey = (node: Node, key: string): any => {
  if (node.hasOwnProperty(key)) {
    return node[key]
  }

  for (const k in node) {
    if (typeof node[k] === 'object' && node[k] !== null) {
      const result = findNodeByKey(node[k], key)
      if (result !== undefined) {
        return result
      }
    }
  }

  return undefined
}
