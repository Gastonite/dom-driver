import { adapt } from '@cycle/run/lib/adapt.js'
import { DocumentDOMSource } from './DocumentDomSource.js'
import { BodyDomSource } from './BodyDomSource.js'
import { ElementFinder } from './ElementFinder.js'
import { makeIsolateSink, getScopeObj } from './isolate.js'





export class MainDOMSource {
  constructor(
    _rootElement$,
    _sanitation$,
    _namespace = [],
    _isolateModule,
    _eventDelegator,
    _name
  ) {

    Object.assign(this, {
      _rootElement$,
      _sanitation$,
      _namespace,
      _isolateModule,
      _eventDelegator,
      _name
    })

    this.isolateSource = (source, scope) =>
      new MainDOMSource(
        source._rootElement$,
        source._sanitation$,
        source._namespace.concat(getScopeObj(scope)),
        source._isolateModule,
        source._eventDelegator,
        source._name
      )

    this.isolateSink = makeIsolateSink(this._namespace)
  }

  _elements() {
    if (this._namespace.length === 0) {
      return this._rootElement$.map(x => [x])
    } else {
      const elementFinder = new ElementFinder(
        this._namespace,
        this._isolateModule
      )
      return this._rootElement$.map(() => elementFinder.call())
    }
  }

  elements() {

    const out = adapt(
      this._elements().remember()
    )

    out._isCycleSource = this._name
    return out
  }

  element() {
    const out = adapt(
      this._elements()
        .filter(arr => arr.length > 0)
        .map(arr => arr[0])
        .remember()
    )
    out._isCycleSource = this._name
    return out
  }

  get namespace() {
    return this._namespace
  }

  select(selector) {

    if (typeof selector !== 'string')
      throw new Error(
        'DOM driver\'s select() expects the argument to be a ' +
        'string as a CSS selector'
      )

    if (selector === 'document')
      return new DocumentDOMSource(this._name)

    if (selector === 'body')
      return new BodyDomSource(this._name)

    const namespace =
      selector === ':root'
        ? []
        : this._namespace.concat({ type: 'selector', scope: selector.trim() })

    return new MainDOMSource(
      this._rootElement$,
      this._sanitation$,
      namespace,
      this._isolateModule,
      this._eventDelegator,
      this._name
    )
  }

  events(eventType, options = {}, bubbles) {

    if (typeof eventType !== 'string')
      throw new Error(
        'DOM driver\'s events() expects argument to be a ' +
        'string representing the event type to listen for.'
      )

    const event$ = this._eventDelegator.addEventListener(
      eventType,
      this._namespace,
      options,
      bubbles
    )

    const out = adapt(event$)
    out._isCycleSource = this._name
    return out
  }

  dispose() {

    this._sanitation$.shamefullySendNext(null)
    //this._isolateModule.reset();
  }

  // The implementation of these are in the constructor so that their `this`
  // references are automatically bound to the instance, so that library users
  // can do destructuring `const {isolateSource, isolateSink} = sources.DOM` and
  // not get bitten by a missing `this` reference.

  // public isolateSource: (source: MainDOMSource, scope: string) => MainDOMSource;
  // public isolateSink: IsolateSink<VNode>;
}
