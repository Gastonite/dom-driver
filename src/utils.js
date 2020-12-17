




function isValidNode(input) {

  const ELEM_TYPE = 1
  const FRAG_TYPE = 11

  return typeof HTMLElement === 'object'
    ? input instanceof HTMLElement || input instanceof DocumentFragment
    : (
      input
      && typeof input === 'object'
      && input !== null
      && (input.nodeType === ELEM_TYPE || input.nodeType === FRAG_TYPE)
      && typeof input.nodeName === 'string'
    )
}

export function isClassOrId(string) {

  return string.length > 1 && (string[0] === '.' || string[0] === '#')
}

export function isDocFrag(element) {

  return element.nodeType === 11
}

export function checkValidContainer(container) {

  if (typeof container === 'string' || isValidNode(container))
    return

  throw new Error(
    'Given container is not a DOM element neither a selector string.'
  )
}

export function getValidNode(selectors) {

  const domElement = typeof selectors === 'string'
    ? document.querySelector(selectors)
    : selectors

  if (typeof selectors === 'string' && domElement === null)
    throw new Error(`Cannot render into unknown element \`${selectors}\``)

  return domElement
}

export function getSelectors(namespace) {

  let res = ''

  for (let i = namespace.length - 1; i >= 0; i--) {

    if (namespace[i].type !== 'selector')
      break

    res = namespace[i].scope + ' ' + res
  }

  return res.trim()
}

export function isEqualNamespace(a, b) {

  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false

  for (let i = 0; i < a.length; i++)
    if (a[i].type !== b[i].type || a[i].scope !== b[i].scope)
      return false

  return true
}

export function makeInsert(map) {

  return (type, elm, value) => {

    if (map.has(type)) {

      const innerMap = map.get(type)
      innerMap.set(elm, value)
    } else {

      const innerMap = new Map()
      innerMap.set(elm, value)
      map.set(type, innerMap)
    }
  }
}
