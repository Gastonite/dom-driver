import { Stream as $ } from 'xstream'





export function fromEvent(
  element,
  eventName,
  useCapture = false,
  preventDefault = false,
  passive = false
) {

  let next = null

  return $.create({
    start: function start(listener) {

      next = preventDefault
        ? function _next(event) {
          preventDefaultConditional(event, preventDefault)
          listener.next(event)
        }
        : function _next(event) {
          listener.next(event)
        }

      element.addEventListener(eventName, next, {
        capture: useCapture,
        passive,
      })
    },
    stop: function stop() {

      element.removeEventListener(eventName, next, useCapture)

      next = null
    },
  })
}

function matchObject(matcher, obj) {

  const keys = Object.keys(matcher)
  const n = keys.length

  for (let i = 0; i < n; i++) {

    const k = keys[i]

    if (typeof matcher[k] === 'object' && typeof obj[k] === 'object') {

      if (!matchObject(matcher[k], obj[k]))
        return false

    } else if (matcher[k] !== obj[k]) {

      return false
    }
  }
  return true
}

export function preventDefaultConditional(event, preventDefault) {

  if (preventDefault) {

    if (typeof preventDefault === 'boolean') {

      event.preventDefault()

    } else if (isPredicate(preventDefault)) {

      if (preventDefault(event))
        event.preventDefault()

    } else if (typeof preventDefault === 'object') {

      if (matchObject(preventDefault, event))
        event.preventDefault()

    } else {
      throw new Error(
        'preventDefault has to be either a boolean, predicate function or object'
      )
    }
  }
}

function isPredicate(fn) {
  return typeof fn === 'function'
}
