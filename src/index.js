export { thunk } from './thunk.js'
export { DomSource } from './DomSource.js'


/**
 * A factory for the DOM driver function.
 *
 * Takes a `container` to define the target on the existing DOM which this
 * driver will operate on, and an `options` object as the second argument. The
 * input to this driver is a stream of virtual DOM objects, or in other words,
 * Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
 * collection of Observables queried with the methods `select()` and `events()`.
 *
 * **`DOMSource.select(selector)`** returns a new DOMSource with scope
 * restricted to the element(s) that matches the CSS `selector` given. To select
 * the page's `document`, use `.select('document')`. To select the container
 * element for this app, use `.select(':root')`.
 *
 * **`DOMSource.events(eventType, options)`** returns a stream of events of
 * `eventType` happening on the elements that match the current DOMSource. The
 * event object contains the `ownerTarget` property that behaves exactly like
 * `currentTarget`. The reason for this is that some browsers doesn't allow
 * `currentTarget` property to be mutated, hence a new property is created. The
 * returned stream is an *xstream* Stream if you use `@cycle/xstream-run` to run
 * your app with this driver, or it is an RxJS Observable if you use
 * `@cycle/rxjs-run`, and so forth.
 *
 * **options for DOMSource.events**
 *
 * The `options` parameter on `DOMSource.events(eventType, options)` is an
 * (optional) object with two optional fields: `useCapture` and
 * `preventDefault`.
 *
 * `useCapture` is by default `false`, except it is `true` for event types that
 * do not bubble. Read more here
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * about the `useCapture` and its purpose.
 *
 * `preventDefault` is by default `false`, and indicates to the driver whether
 * `event.preventDefault()` should be invoked. This option can be configured in
 * three ways:
 *
 * - `{preventDefault: boolean}` to invoke preventDefault if `true`, and not
 * invoke otherwise.
 * - `{preventDefault: (ev: Event) => boolean}` for conditional invocation.
 * - `{preventDefault: NestedObject}` uses an object to be recursively compared
 * to the `Event` object. `preventDefault` is invoked when all properties on the
 * nested object match with the properties on the event object.
 *
 * Here are some examples:
 * ```typescript
 * // always prevent default
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: true
 * })
 *
 * // prevent default only when `ENTER` is pressed
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: e => e.keyCode === 13
 * })
 *
 * // prevent defualt when `ENTER` is pressed AND target.value is 'HELLO'
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: { keyCode: 13, ownerTarget: { value: 'HELLO' } }
 * });
 * ```
 *
 * **`DOMSource.elements()`** returns a stream of arrays containing the DOM
 * elements that match the selectors in the DOMSource (e.g. from previous
 * `select(x)` calls).
 *
 * **`DOMSource.element()`** returns a stream of DOM elements. Notice that this
 * is the singular version of `.elements()`, so the stream will emit an element,
 * not an array. If there is no element that matches the selected DOMSource,
 * then the returned stream will not emit anything.
 *
 * @param {(String|HTMLElement)} container the DOM selector for the element
 * (or the element itself) to contain the rendering of the VTrees.
 * @param {DOMDriverOptions} options an object with two optional properties:
 *
 *   - `modules: array` overrides `@cycle/dom`'s default Snabbdom modules as
 *     as defined in [`src/modules.ts`](./src/modules.ts).
 *   - `reportSnabbdomError: (err: any) => void` overrides the default error reporter function.
 * @return {Function} the DOM driver function. The function expects a stream of
 * VNode as input, and outputs the DOMSource object.
 * @function DomDriver
 */
export { DomDriver } from './DomDriver.js'

/**
 * A factory function to create mocked DOMSource objects, for testing purposes.
 *
 * Takes a `mockConfig` object as argument, and returns
 * a DOMSource that can be given to any Cycle.js app that expects a DOMSource in
 * the sources, for testing.
 *
 * The `mockConfig` parameter is an object specifying selectors, eventTypes and
 * their streams. Example:
 *
 * ```js
 * const domSource = mockDOMSource({
 *   '.foo': {
 *     'click': xs.of({target: {}}),
 *     'mouseover': xs.of({target: {}}),
 *   },
 *   '.bar': {
 *     'scroll': xs.of({target: {}}),
 *     elements: xs.of({tagName: 'div'}),
 *   }
 * });
 *
 * // Usage
 * const click$ = domSource.select('.foo').events('click');
 * const element$ = domSource.select('.bar').elements();
 * ```
 *
 * The mocked DOM Source supports isolation. It has the functions `isolateSink`
 * and `isolateSource` attached to it, and performs simple isolation using
 * classNames. *isolateSink* with scope `foo` will append the class `___foo` to
 * the stream of virtual DOM nodes, and *isolateSource* with scope `foo` will
 * perform a conventional `mockedDOMSource.select('.__foo')` call.
 *
 * @param {Object} mockConfig an object where keys are selector strings
 * and values are objects. Those nested objects have `eventType` strings as keys
 * and values are streams you created.
 * @return {Object} fake DOM source object, with an API containing `select()`
 * and `events()` and `elements()` which can be used just like the DOM Driver's
 * DOMSource.
 *
 * @function mockDOMSource
 */
export { MockedDomSource } from './MockedDomSource.js'

/**
 * The hyperscript function `h()` is a function to create virtual DOM objects,
 * also known as VNodes. Call
 *
 * ```js
 * h('div.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * to create a VNode that represents a `DIV` element with className `myClass`,
 * styled with red color, and no children because the `[]` array was passed. The
 * API is `h(tagOrSelector, optionalData, optionalChildrenOrText)`.
 *
 * However, usually you should use "hyperscript helpers", which are shortcut
 * functions based on hyperscript. There is one hyperscript helper function for
 * each DOM tagName, such as `h1()`, `h2()`, `div()`, `span()`, `label()`,
 * `input()`. For instance, the previous example could have been written
 * as:
 *
 * ```js
 * div('.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * There are also SVG helper functions, which apply the appropriate SVG
 * namespace to the resulting elements. `svg()` function creates the top-most
 * SVG element, and `svg.g`, `svg.polygon`, `svg.circle`, `svg.path` are for
 * SVG-specific child elements. Example:
 *
 * ```js
 * svg({attrs: {width: 150, height: 150}}, [
 *   svg.polygon({
 *     attrs: {
 *       class: 'triangle',
 *       points: '20 0 20 150 150 20'
 *     }
 *   })
 * ])
 * ```
 *
 * @function h
 */
export { h } from 'snabbdom/h.js'
import hh from './hyperscript-helpers.js'

export const svg = hh.svg
export const a = hh.a
export const abbr = hh.abbr
export const address = hh.address
export const area = hh.area
export const article = hh.article
export const aside = hh.aside
export const audio = hh.audio
export const b = hh.b
export const base = hh.base
export const bdi = hh.bdi
export const bdo = hh.bdo
export const blockquote = hh.blockquote
export const body = hh.body
export const br = hh.br
export const button = hh.button
export const canvas = hh.canvas
export const caption = hh.caption
export const cite = hh.cite
export const code = hh.code
export const col = hh.col
export const colgroup = hh.colgroup
export const dd = hh.dd
export const del = hh.del
export const dfn = hh.dfn
export const dir = hh.dir
export const div = hh.div
export const dl = hh.dl
export const dt = hh.dt
export const em = hh.em
export const embed = hh.embed
export const fieldset = hh.fieldset
export const figcaption = hh.figcaption
export const figure = hh.figure
export const footer = hh.footer
export const form = hh.form
export const h1 = hh.h1
export const h2 = hh.h2
export const h3 = hh.h3
export const h4 = hh.h4
export const h5 = hh.h5
export const h6 = hh.h6
export const head = hh.head
export const header = hh.header
export const hgroup = hh.hgroup
export const hr = hh.hr
export const html = hh.html
export const i = hh.i
export const iframe = hh.iframe
export const img = hh.img
export const input = hh.input
export const ins = hh.ins
export const kbd = hh.kbd
export const keygen = hh.keygen
export const label = hh.label
export const legend = hh.legend
export const li = hh.li
export const link = hh.link
export const main = hh.main
export const map = hh.map
export const mark = hh.mark
export const menu = hh.menu
export const meta = hh.meta
export const nav = hh.nav
export const noscript = hh.noscript
export const object = hh.object
export const ol = hh.ol
export const optgroup = hh.optgroup
export const option = hh.option
export const p = hh.p
export const param = hh.param
export const pre = hh.pre
export const progress = hh.progress
export const q = hh.q
export const rp = hh.rp
export const rt = hh.rt
export const ruby = hh.ruby
export const s = hh.s
export const samp = hh.samp
export const script = hh.script
export const section = hh.section
export const select = hh.select
export const small = hh.small
export const source = hh.source
export const span = hh.span
export const strong = hh.strong
export const style = hh.style
export const sub = hh.sub
export const sup = hh.sup
export const table = hh.table
export const tbody = hh.tbody
export const td = hh.td
export const textarea = hh.textarea
export const tfoot = hh.tfoot
export const th = hh.th
export const thead = hh.thead
export const title = hh.title
export const tr = hh.tr
export const u = hh.u
export const ul = hh.ul
export const video = hh.video
