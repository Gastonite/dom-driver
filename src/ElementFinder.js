import { ScopeChecker } from './ScopeChecker.js'
import { getSelectors } from './utils.js'





function toElArray(input) {

  return Array.prototype.slice.call(input)
}

export class ElementFinder {
  constructor(namespace, isolateModule) {

    Object.assign(this, {
      namespace,
      isolateModule,
    })
  }

  call() {

    const namespace = this.namespace
    const selector = getSelectors(namespace)

    const scopeChecker = new ScopeChecker(
      namespace,
      this.isolateModule
    )

    const topNode = this.isolateModule
      .getElement(
        namespace
          .filter(n => n.type !== 'selector')
      )

    if (topNode === undefined)
      return []

    if (selector === '')
      return [topNode]

    return toElArray(topNode.querySelectorAll(selector))
      .filter(scopeChecker.isDirectlyInScope, scopeChecker)
      .concat(topNode.matches(selector) ? [topNode] : [])
  }
}
