import { init } from 'snabbdom'
import { Stream as $ } from 'xstream'
import concatStreams from 'xstream/extra/concat.js'
import sampleCombine from 'xstream/extra/sampleCombine.js'
import { DomSource } from './DomSource.js'
import { toVNode as toVnode } from 'snabbdom/tovnode.js'
import { VnodeWrapper } from './VnodeWrapper.js'
import { getValidNode, checkValidContainer } from './utils.js'
import defaultModules from './modules.js'
import { IsolateModule } from './IsolateModule.js'
import { EventDelegator } from './EventDelegator.js'





const dropCompletion = input => {
  return $.merge(input, $.never())
}

const defaultReportSnabbdomError = err => {
  (console.error || console.log)(err)
}

const DomReady$ = () => {

  return $.create({
    start(listener) {

      if (document.readyState === 'loading') {

        document.addEventListener('readystatechange', () => {
          const state = document.readyState
          if (state === 'interactive' || state === 'complete') {
            listener.next(null)
            listener.complete()
          }
        })

      } else {
        listener.next(null)
        listener.complete()
      }
    },
    stop() { },
  })
}

const addRootScope = vnode => {

  vnode.data = vnode.data || {}
  vnode.data.isolate = []

  return vnode
}

export const makeDOMDriver = (container, options = {}) => {

  checkValidContainer(container)

  const modules = options.modules || defaultModules
  if (!Array.isArray(modules))
    throw new Error(
      'Optional modules option must be an array for snabbdom modules'
    )

  const isolateModule = new IsolateModule()
  const patch = init([isolateModule.createModule()].concat(modules))

  const domReady$ = DomReady$()

  let vnodeWrapper
  let mutationObserver
  const mutationConfirmed$ = $.create({
    start(listener) {
      mutationObserver = new MutationObserver(() => listener.next(null))
    },
    stop() {
      mutationObserver.disconnect()
    },
  })

  const DOMDriver = (vnode$, name = 'DOM') => {

    if (
      !vnode$ ||
      typeof vnode$.addListener !== 'function' ||
      typeof vnode$.fold !== 'function'
    )
      throw new Error(
        'The DOM driver function expects as input a Stream of ' +
        'virtual DOM elements'
      )

    const sanitation$ = $.create()

    const firstRoot$ = domReady$.map(() => {
      const firstRoot = getValidNode(container) || document.body
      vnodeWrapper = new VnodeWrapper(firstRoot)
      return firstRoot
    })

    // We need to subscribe to the sink (i.e. vnode$) synchronously inside this
    // driver, and not later in the map().flatten() because this sink is in
    // reality a SinkProxy from @cycle/run, and we don't want to miss the first
    // emission when the main() is connected to the drivers.
    // Read more in issue #739.
    const rememberedVnode$ = vnode$.remember()
    rememberedVnode$.addListener({})

    // The mutation observer internal to mutationConfirmed$ should
    // exist before elementAfterPatch$ calls mutationObserver.observe()
    mutationConfirmed$.addListener({})

    const elementAfterPatch$ = firstRoot$
      .map(firstRoot => {

        return $.merge(
          rememberedVnode$.endWhen(sanitation$),
          sanitation$
        )
          .map(vnode => vnodeWrapper.call(vnode))
          .startWith(addRootScope(toVnode(firstRoot)))
          .fold(patch, toVnode(firstRoot))
          .drop(1)
          .map(x => x.elm)
          .startWith(firstRoot)
          .map(elelement => {

            mutationObserver.observe(elelement, {
              childList: true,
              attributes: true,
              characterData: true,
              subtree: true,
              attributeOldValue: true,
              characterDataOldValue: true,
            })

            return elelement
          })
          .compose(dropCompletion) // don't complete this stream
      })
      .flatten()

    const rootElement$ = concatStreams(domReady$, mutationConfirmed$)
      .endWhen(sanitation$)
      .compose(sampleCombine(elementAfterPatch$))
      .map(arr => arr[1])
      .remember()

    // Start the snabbdom patching, over time
    rootElement$.addListener({
      error: options.reportSnabbdomError || defaultReportSnabbdomError,
    })

    const delegator = new EventDelegator(rootElement$, isolateModule)

    return new DomSource(
      rootElement$,
      sanitation$,
      [],
      isolateModule,
      delegator,
      name
    )
  }

  return DOMDriver
}

export default makeDOMDriver