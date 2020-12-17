import { vnode as vnodeFn } from 'snabbdom/vnode.js';
import { h } from 'snabbdom/h.js';
import { classNameFromVNode, selectorParser } from 'snabbdom-selector';
import { isDocFrag } from './utils.js';

export class VNodeWrapper {
  constructor(rootElement) {

    this.rootElement = rootElement
  }

  call(vnode) {

    if (isDocFrag(this.rootElement))
      return this._wrapDocFrag(vnode === null ? [] : [vnode]);

    if (vnode === null)
      return this._wrap([]);

    const { tagName: selTagName, id: selId } = selectorParser(vnode);
    const vNodeClassName = classNameFromVNode(vnode);
    const vNodeData = vnode.data || {};
    const vNodeDataProps = vNodeData.props || {};
    const { id: vNodeId = selId } = vNodeDataProps;

    const isVNodeAndRootElementIdentical = typeof vNodeId === 'string'
      && vNodeId.toUpperCase() === this.rootElement.id.toUpperCase()
      && selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase()
      && vNodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();

    if (isVNodeAndRootElementIdentical)
      return vnode;

    return this._wrap([vnode]);
  }

  _wrapDocFrag(children) {
    return vnodeFn('', { isolate: [] }, children, undefined, this.rootElement);
  }

  _wrap(children) {

    const { tagName, id, className } = this.rootElement;

    const selId = id
      ? `#${id}`
      : '';

    const selClass = className
      ? `.${className.split(` `).join(`.`)}`
      : '';

    const vnode = h(
      `${tagName.toLowerCase()}${selId}${selClass}`,
      {},
      children
    );

    vnode.data = vnode.data || {};
    vnode.data.isolate = vnode.data.isolate || [];
    return vnode;
  }
}
