import { h } from 'snabbdom/h.js';





function copyToThunk(vnode, thunkVNode) {

  thunkVNode.elm = vnode.elm;
  vnode.data.fn = thunkVNode.data.fn;
  vnode.data.args = thunkVNode.data.args;
  vnode.data.isolate = thunkVNode.data.isolate;
  thunkVNode.data = vnode.data;
  thunkVNode.children = vnode.children;
  thunkVNode.text = vnode.text;
  thunkVNode.elm = vnode.elm;
}

function init(thunkVNode) {

  const cur = thunkVNode.data;
  const vnode = cur.fn.apply(undefined, cur.args)

  copyToThunk(vnode, thunkVNode);
}

function prepatch(oldVnode, thunkVNode) {

  const old = oldVnode.data;
  const cur = thunkVNode.data;

  let i;

  const oldArgs = old.args;
  const args = cur.args;

  if (old.fn !== cur.fn || oldArgs.length !== args.length)
    copyToThunk(cur.fn.apply(undefined, args), thunkVNode);

  for (i = 0; i < args.length; ++i) {
    if (oldArgs[i] !== args[i]) {
      copyToThunk(cur.fn.apply(undefined, args), thunkVNode);
      return;
    }
  }
  copyToThunk(oldVnode, thunkVNode);
}

export function thunk(sel, key, fn, args) {
  if (args === undefined) {
    args = fn;
    fn = key;
    key = undefined;
  }
  return h(sel, {
    key: key,
    hook: { init: init, prepatch: prepatch },
    fn: fn,
    args: args,
  });
}

export default thunk;