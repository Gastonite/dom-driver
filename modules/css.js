import pipe from 'ramda/es/pipe.js'
import apply from 'ramda/es/apply.js'
import path from 'ramda/es/path.js'
import filter from 'ramda/es/filter.js'
import ifElse from 'ramda/es/ifElse.js'
import isEmpty from 'ramda/es/isEmpty.js'
import map from 'ramda/es/map.js'
import reject from 'ramda/es/reject.js'
import unless from 'ramda/es/unless.js'
import both from 'ramda/es/both.js'
import { style } from 'typestyle'
import { castArray } from '#utilities/array.js'
import isPlainObj from 'ramda-adjunct/src/isPlainObj.js'
import isNonEmptyString from 'ramda-adjunct/src/isNonEmptyString.js'
import isNotEmpty from 'ramda-adjunct/src/isNotEmpty.js'
import noop from 'ramda-adjunct/src/noop.js'





const defineStyles = (oldnode, vnode) => {

  const css = path(['data', 'css'], vnode)
  if (!css)
    return

  const { elm: element } = vnode
  const { classList } = element

  const addClasses = classList.add.bind(classList)

  pipe(
    castArray,
    map(pipe(
      castArray,
      filter(both(isNotEmpty, isPlainObj)),
      ifElse(isEmpty, noop, apply(style)),
    )),
    filter(isNonEmptyString),
    newClasses => {

      pipe(
        reject(className => element.classList.contains(className)),
        unless(isEmpty, pipe(
          // debug('addClasses'),
          apply(addClasses),
        )),
      )(newClasses)

      /** 
       * TODO search in oldVnode !!
       * 
       * pipe(
       *   reject(includes(__, newClasses)),
       *   unless(isEmpty, pipe(
       *     debug('removeClasses'),
       *     apply(removeClasses),
       *   )),
       * )(classes)
      */
    }
  )(css)
}

export const cssModule = {
  create: defineStyles,
  update: defineStyles,
}