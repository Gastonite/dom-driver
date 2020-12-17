import { h } from 'snabbdom/h.js';





function copyToThunk(vnode, thunkVnode) {

  thunkVnode.elm = vnode.elm;
  vnode.data.fn = thunkVnode.data.fn;
  vnode.data.args = thunkVnode.data.args;
  vnode.data.isolate = thunkVnode.data.isolate;
  thunkVnode.data = vnode.data;
  thunkVnode.children = vnode.children;
  thunkVnode.text = vnode.text;
  thunkVnode.elm = vnode.elm;
}

function init(thunkVnode) {

  const cur = thunkVnode.data;
  const vnode = cur.fn.apply(undefined, cur.args)

  copyToThunk(vnode, thunkVnode);
}

function prepatch(oldVnode, thunkVnode) {

  const old = oldVnode.data;
  const cur = thunkVnode.data;

  let i;

  const oldArgs = old.args;
  const args = cur.args;

  if (old.fn !== cur.fn || oldArgs.length !== args.length)
    copyToThunk(cur.fn.apply(undefined, args), thunkVnode);

  for (i = 0; i < args.length; ++i) {
    if (oldArgs[i] !== args[i]) {
      copyToThunk(cur.fn.apply(undefined, args), thunkVnode);
      return;
    }
  }
  copyToThunk(oldVnode, thunkVnode);
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
