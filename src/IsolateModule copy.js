import { isEqualNamespace } from './utils.js'
import SymbolTree from './SymbolTree.js'





export class IsolateModule {

  constructor() {
    this._namespaceByElement = new Map()
    this._namespaceTree = new SymbolTree(x => x.scope)

    /**
     * A registry that keeps track of all the nodes that are removed from
     * the virtual DOM in a single patch. Those nodes are cleaned once snabbdom
     * has finished patching the DOM.
     */
    this._vnodesBeingRemoved = []
  }

  setEventDelegator(delegator) {

    this._eventDelegator = delegator
  }

  _insertElement(namespace, el) {

    this._namespaceByElement.set(el, namespace)
    this._namespaceTree.set(namespace, el)
  }

  _removeElement(element) {

    this._namespaceByElement.delete(element)

    const namespace = this.getNamespace(element)

    if (namespace)
      this._namespaceTree.delete(namespace)

  }

  getElement(namespace, max) {
    return this._namespaceTree.get(namespace, undefined, max)
  }

  getRootElement(element) {

    if (this._namespaceByElement.has(element))
      return element


    //TODO: Add quick-lru or similar as additional O(1) cache

    let curr = element

    while (!this._namespaceByElement.has(curr)) {

      curr = curr.parentNode

      if (!curr)
        return

      if (curr.tagName === 'HTML')
        throw new Error('No root element found, this should not happen at all')

    }

    return curr
  }

  getNamespace(element) {

    const rootElement = this.getRootElement(element)

    if (!rootElement)
      return

    return this._namespaceByElement.get(rootElement)
  }

  createModule() {

    const self = this

    return {
      create(vnode) {

        const { elm, data = {} } = vnode
        const namespace = data.isolate

        if (Array.isArray(namespace))
          self._insertElement(namespace, elm)
      },

      update(oldVnode, vnode) {

        const { elm: oldElm, data: oldData = {} } = oldVnode
        const { elm, data = {} } = vnode
        const oldNamespace = oldData.isolate
        const namespace = data.isolate

        if (!isEqualNamespace(oldNamespace, namespace))
          if (Array.isArray(oldNamespace))
            self._removeElement(oldElm)

        if (Array.isArray(namespace))
          self._insertElement(namespace, elm)
      },

      destroy(vnode) {

        self._vnodesBeingRemoved.push(vnode)
      },

      remove(vnode, done) {

        self._vnodesBeingRemoved.push(vnode)

        done()
      },

      post() {

        const _vnodesBeingRemoved = self._vnodesBeingRemoved

        for (let i = _vnodesBeingRemoved.length - 1; i >= 0; i--) {

          const vnode = _vnodesBeingRemoved[i]

          const namespace = vnode.data !== undefined
            ? vnode.data.isolation
            : undefined

          if (namespace !== undefined)
            self._removeElement(namespace)

          self._eventDelegator.removeElement(
            vnode.elm,
            namespace
          )
        }

        self._vnodesBeingRemoved = []
      },
    }
  }
}
