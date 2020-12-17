import { isClassOrId } from './utils.js'





export function makeIsolateSink(namespace) {

  return (sink, scope) => {

    if (scope === ':root') {
      return sink
    }

    return sink.map(node => {

      if (!node)
        return node

      const scopeObj = getScopeObj(scope)

      const newNode = {
        ...node,
        data: {
          ...node.data,
          isolate:
            !node.data || !Array.isArray(node.data.isolate)
              ? namespace.concat([scopeObj])
              : node.data.isolate,
        },
      }

      return {
        ...newNode,
        key:
          newNode.key !== undefined
            ? newNode.key
            : JSON.stringify(newNode.data.isolate),
      }
    })
  }
}

export function getScopeObj(scope) {
  return {
    type: isClassOrId(scope) ? 'sibling' : 'total',
    scope,
  }
}
