import { isEqualNamespace } from './utils.js';
import SymbolTree from './SymbolTree.js';





export class IsolateModule {
  // private namespaceTree = new SymbolTree(x => x.scope);
  // private namespaceByElement: Map<Element, Array<Scope>>;
  // private eventDelegator: EventDelegator | undefined;

  /**
   * A registry that keeps track of all the nodes that are removed from
   * the virtual DOM in a single patch. Those nodes are cleaned once snabbdom
   * has finished patching the DOM.
   */

  constructor() {
    this.namespaceByElement = new Map();
    this.vnodesBeingRemoved = [];
    this.namespaceTree = new SymbolTree(x => x.scope)
  }

  setEventDelegator(del) {

    this.eventDelegator = del;
  }

  // private
  insertElement(namespace, el) {
    this.namespaceByElement.set(el, namespace);
    this.namespaceTree.set(namespace, el);
  }

  //private
  removeElement(elm) {

    this.namespaceByElement.delete(elm);

    const namespace = this.getNamespace(elm);
    if (namespace)
      this.namespaceTree.delete(namespace);

  }

  getElement(namespace, max) {

    return this.namespaceTree.get(namespace, undefined, max);
  }

  getRootElement(elm) {

    if (this.namespaceByElement.has(elm))
      return elm;

    //TODO: Add quick-lru or similar as additional O(1) cache

    let curr = elm;
    while (!this.namespaceByElement.has(curr)) {

      curr = curr.parentNode;
      if (!curr)
        return

      if (curr.tagName === 'HTML')
        throw new Error('No root element found, this should not happen at all');

    }

    return curr;
  }

  getNamespace(elm) {

    const rootElement = this.getRootElement(elm)
    if (!rootElement)
      return;


    return this.namespaceByElement.get(rootElement);
  }

  createModule() {
    const self = this;
    return {
      create(emptyVnode, vnode) {

        const { elm, data = {} } = vnode;
        const namespace = data.isolate;

        if (Array.isArray(namespace)) {
          self.insertElement(namespace, elm);
        }
      },

      update(oldVnode, vnode) {

        const { elm: oldElm, data: oldData = {} } = oldVnode;
        const { elm, data = {} } = vnode;
        const oldNamespace = oldData.isolate;
        const namespace = data.isolate;

        if (!isEqualNamespace(oldNamespace, namespace)) {
          if (Array.isArray(oldNamespace)) {
            self.removeElement(oldElm);
          }
        }
        if (Array.isArray(namespace)) {
          self.insertElement(namespace, elm);
        }
      },

      destroy(vnode) {
        self.vnodesBeingRemoved.push(vnode);
      },

      remove(vnode, cb) {
        self.vnodesBeingRemoved.push(vnode);
        cb();
      },

      post() {

        const vnodesBeingRemoved = self.vnodesBeingRemoved;

        for (let i = vnodesBeingRemoved.length - 1; i >= 0; i--) {
          const vnode = vnodesBeingRemoved[i];

          const namespace = vnode.data !== undefined
            ? vnode.data.isolation
            : undefined;

          if (namespace !== undefined)
            self.removeElement(namespace);

          self.eventDelegator.removeElement(
            vnode.elm,
            namespace
          );
        }
        self.vnodesBeingRemoved = [];
      },
    };
  }
}
