import { Stream as $ } from 'xstream'
import { ScopeChecker } from './ScopeChecker.js'
import { getSelectors, isEqualNamespace } from './utils.js'
import { ElementFinder } from './ElementFinder.js'
import SymbolTree from './SymbolTree.js'
import PriorityQueue from './PriorityQueue.js'
import { fromEvent, preventDefaultConditional } from './fromEvent.js'





export const eventTypesThatDontBubble = [
  'blur',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'ended',
  'focus',
  'load',
  'loadeddata',
  'loadedmetadata',
  'mouseenter',
  'mouseleave',
  'pause',
  'play',
  'playing',
  'ratechange',
  'reset',
  'scroll',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeupdate',
  'unload',
  'volumechange',
  'waiting',
]

/**
 * Manages "Event delegation", by connecting an origin with multiple
 * destinations.
 *
 * Attaches a DOM event listener to the DOM element called the "origin",
 * and delegates events to "destinations", which are subjects as outputs
 * for the DOMSource. Simulates bubbling or capturing, with regards to
 * isolation boundaries too.
 */
export class EventDelegator {

  constructor(rootElement$, isolateModule) {

    this._domListeners = new Map()
    this._domListenersToAdd = new Map()
    this._nonBubblingListeners = new Map()
    this._virtualNonBubblingListener = []
    this._nonBubblingListenersToAdd = new Set()
    this._virtualListeners = new SymbolTree(x => x.scope)

    this.isolateModule = isolateModule
    this._rootElement$ = rootElement$

    this.isolateModule.setEventDelegator(this)

    rootElement$.addListener({
      next: element => {

        if (this._origin !== element) {

          this._origin = element
          this._resetEventListeners()

          this._domListenersToAdd.forEach((passive, type) =>
            this._setupDOMListener(type, passive)
          )

          this._domListenersToAdd.clear()
        }

        this._nonBubblingListenersToAdd.forEach(arr => {

          this._setupNonBubblingListener(arr)
        })
      },
    })
  }

  addEventListener(eventType, namespace, options, bubbles) {

    const subject = $.never()
    let dest

    const scopeChecker = new ScopeChecker(namespace, this.isolateModule)

    const shouldBubble = bubbles === undefined
      ? eventTypesThatDontBubble.indexOf(eventType) === -1
      : bubbles

    if (shouldBubble) {

      if (!this._domListeners.has(eventType))
        this._setupDOMListener(eventType, !!options.passive)

      dest = this._insertListener(subject, scopeChecker, eventType, options)

      return subject
    }

    const setArray = []

    this._nonBubblingListenersToAdd.forEach(v => setArray.push(v))

    let found = undefined, index = 0

    const length = setArray.length

    const tester = nonBubblingMeta => {
      const [, et, ef] = nonBubblingMeta
      return eventType === et && isEqualNamespace(ef.namespace, namespace)
    }

    while (!found && index < length) {
      const item = setArray[index]
      found = tester(item) ? item : found
      index++
    }

    let input = found
    let nonBubbleSubject

    if (!input) {

      const finder = new ElementFinder(namespace, this.isolateModule)

      dest = this._insertListener(subject, scopeChecker, eventType, options)
      input = [subject, eventType, finder, dest]
      nonBubbleSubject = subject

      this._nonBubblingListenersToAdd.add(input)

      this._setupNonBubblingListener(input)

    } else {

      const [sub] = input
      nonBubbleSubject = sub
    }

    const self = this

    let subscription = null

    return $.create({
      start: listener => {

        subscription = nonBubbleSubject.subscribe(listener)
      },
      stop: () => {

        const [, et, ef] = input
        const elements = ef.call()

        elements.forEach(function (element) {

          if (element.subs && element.subs[et]) {
            element.subs[et].unsubscribe()
            delete element.subs[et]
          }
        })

        self._nonBubblingListenersToAdd.delete(input)

        subscription.unsubscribe()
      }
    })

  }

  removeElement(element, namespace) {

    if (namespace !== undefined)
      this._virtualListeners.delete(namespace)

    const toRemove = []

    this._nonBubblingListeners.forEach((map, type) => {

      if (map.has(element)) {

        toRemove.push([type, element])

        if (element.subs)
          Object.keys(element.subs).forEach(key => {
            element.subs[key].unsubscribe()
          })
      }
    })

    for (let i = 0; i < toRemove.length; i++) {

      const map = this._nonBubblingListeners.get(toRemove[i][0])

      if (!map)
        continue

      map.delete(toRemove[i][1])

      if (map.size === 0)
        this._nonBubblingListeners.delete(toRemove[i][0])
      else
        this._nonBubblingListeners.set(toRemove[i][0], map)
    }
  }

  _insertListener(subject, scopeChecker, eventType, options) {

    const relevantSets = []

    const n = scopeChecker._namespace
    let max = n.length

    do {
      relevantSets.push(this._getVirtualListeners(eventType, n, true, max))
      max--
    } while (max >= 0 && n[max].type !== 'total')

    const destination = {
      ...options,
      scopeChecker,
      subject,
      bubbles: !!options.bubbles,
      useCapture: !!options.useCapture,
      passive: !!options.passive,
    }

    for (let i = 0; i < relevantSets.length; i++)
      relevantSets[i].add(destination, n.length)

    return destination
  }

  /**
   * Returns a set of all virtual listeners in the scope of the namespace
   * Set `exact` to true to treat sibiling isolated scopes as total scopes
   */
  _getVirtualListeners(eventType, namespace, exact = false, max) {

    let _max = max !== undefined
      ? max
      : namespace.length

    if (!exact)
      for (let i = _max - 1; i >= 0; i--) {

        if (namespace[i].type === 'total') {
          _max = i + 1
          break
        }

        _max = i
      }

    const map = this._virtualListeners.getDefault(
      namespace,
      () => new Map(),
      _max
    )

    if (!map.has(eventType))
      map.set(eventType, new PriorityQueue())

    return map.get(eventType)
  }

  _setupDOMListener(eventType, passive) {

    if (this._origin) {

      const sub = fromEvent(
        this._origin,
        eventType,
        false,
        false,
        passive
      ).subscribe({
        next: event => this._onEvent(eventType, event, passive),
        error: () => { },
        complete: () => { },
      })

      this._domListeners.set(eventType, { sub, passive })

      return
    }

    this._domListenersToAdd.set(eventType, passive)
  }

  _setupNonBubblingListener(input) {

    const [, eventType, elementFinder, destination] = input

    if (!this._origin)
      return

    const elements = elementFinder.call()

    if (elements.length) {
      const self = this

      elements.forEach(element => {

        const subs = element.subs

        if (!subs || !subs[eventType]) {
          const sub = fromEvent(
            element,
            eventType,
            false,
            false,
            destination.passive
          ).subscribe({
            next: event =>
              self._onEvent(eventType, event, !!destination.passive, false),
            error: () => { },
            complete: () => { },
          })

          if (!self._nonBubblingListeners.has(eventType))
            self._nonBubblingListeners.set(eventType, new Map())

          const map = self._nonBubblingListeners.get(eventType)
          if (!map)
            return

          map.set(element, { sub, destination })

          element.subs = {
            ...subs,
            [eventType]: sub,
          }
        }
      })
    }
  }

  _resetEventListeners() {

    const iter = this._domListeners.entries()
    let curr = iter.next()

    while (!curr.done) {
      const [type, { sub, passive }] = curr.value
      sub.unsubscribe()
      this._setupDOMListener(type, passive)
      curr = iter.next()
    }
  }

  _putNonBubblingListener(eventType, elm, useCapture, passive) {

    const map = this._nonBubblingListeners.get(eventType)
    if (!map)
      return

    const listener = map.get(elm)

    if (listener
      && listener.destination.passive === passive
      && listener.destination.useCapture === useCapture
    )
      this._virtualNonBubblingListener[0] = listener.destination
  }

  _onEvent(eventType, event, passive, bubbles = true) {

    const cycleEvent = this._patchEvent(event)
    const rootElement = this.isolateModule.getRootElement(event.target)

    if (bubbles) {

      const namespace = this.isolateModule.getNamespace(
        event.target
      )

      if (!namespace)
        return

      const listeners = this._getVirtualListeners(eventType, namespace)

      this._bubble(
        eventType,
        event.target,
        rootElement,
        cycleEvent,
        listeners,
        namespace,
        namespace.length - 1,
        true,
        passive
      )

      this._bubble(
        eventType,
        event.target,
        rootElement,
        cycleEvent,
        listeners,
        namespace,
        namespace.length - 1,
        false,
        passive
      )

    } else {

      this._putNonBubblingListener(
        eventType,
        event.target,
        true,
        passive
      )

      this._doBubbleStep(
        event.target,
        rootElement,
        cycleEvent,
        this._virtualNonBubblingListener,
        true,
        passive
      )

      this._putNonBubblingListener(
        eventType,
        event.target,
        false,
        passive
      )

      this._doBubbleStep(
        event.target,
        rootElement,
        cycleEvent,
        this._virtualNonBubblingListener,
        false,
        passive
      )

      event.stopPropagation() //fix reset event (spec'ed as non-bubbling, but bubbles in reality
    }
  }

  _bubble(eventType, elm, rootElement, event, listeners, namespace, index, useCapture, passive) {

    if (!useCapture && !event.propagationHasBeenStopped)
      this._doBubbleStep(
        elm,
        rootElement,
        event,
        listeners,
        useCapture,
        passive
      )

    let newRoot = rootElement
    let newIndex = index

    if (elm === rootElement) {

      if (index >= 0 && namespace[index].type === 'sibling') {

        newRoot = this.isolateModule.getElement(namespace, index)
        newIndex--
      } else

        return

    }

    if (elm.parentNode && newRoot)
      this._bubble(
        eventType,
        elm.parentNode,
        newRoot,
        event,
        listeners,
        namespace,
        newIndex,
        useCapture,
        passive
      )

    if (useCapture && !event.propagationHasBeenStopped)
      this._doBubbleStep(
        elm,
        rootElement,
        event,
        listeners,
        useCapture,
        passive
      )
  }

  _doBubbleStep(elm, rootElement, event, listeners, useCapture, passive) {

    if (!rootElement)
      return

    this._mutateEventCurrentTarget(event, elm)

    listeners.forEach(dest => {

      if (dest.passive === passive && dest.useCapture === useCapture) {

        const sel = getSelectors(dest.scopeChecker.namespace)

        if (
          !event.propagationHasBeenStopped &&
          dest.scopeChecker.isDirectlyInScope(elm) &&
          ((sel !== '' && elm.matches(sel)) ||
            (sel === '' && elm === rootElement))
        ) {

          preventDefaultConditional(event, dest.preventDefault)

          dest.subject.shamefullySendNext(event)
        }
      }
    })
  }

  _patchEvent(event) {

    event.propagationHasBeenStopped = false
    const oldStopPropagation = event.stopPropagation

    event.stopPropagation = function stopPropagation() {

      oldStopPropagation.call(this)
      this.propagationHasBeenStopped = true
    }

    return event
  }

  _mutateEventCurrentTarget(event, currentTargetElement) {

    try {

      Object.defineProperty(event, 'currentTarget', {
        value: currentTargetElement,
        configurable: true,
      })
    } catch (err) {

      console.log('please use event.ownerTarget')
    }

    event.ownerTarget = currentTargetElement
  }
}
