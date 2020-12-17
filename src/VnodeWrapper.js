import { vnode as vnodeFn } from 'snabbdom/vnode.js';
import { h } from 'snabbdom/h.js';
import { classNameFromVNode, selectorParser } from 'snabbdom-selector';
import { isDocFrag } from './utils.js';

export class VnodeWrapper {
  constructor(rootElement) {

    this.rootElement = rootElement
  }

  call(vnode) {

    if (isDocFrag(this.rootElement))
      return this._wrapDocFrag(vnode === null ? [] : [vnode]);

    if (vnode === null)
      return this._wrap([]);

    const { tagName: selTagName, id: selId } = selectorParser(vnode);
    const vnodeClassName = classNameFromVNode(vnode);
    const vnodeData = vnode.data || {};
    const vnodeDataProps = vnodeData.props || {};
    const { id: vnodeId = selId } = vnodeDataProps;

    const isVNodeAndRootElementIdentical = typeof vnodeId === 'string'
      && vnodeId.toUpperCase() === this.rootElement.id.toUpperCase()
      && selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase()
      && vnodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();

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
