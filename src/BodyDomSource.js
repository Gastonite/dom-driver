import { Stream as $ } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt.js'
import { fromEvent } from './fromEvent.js'





// // eslint-disable-next-line no-undef
// const { document } = window

export class BodyDomSource {
  constructor(_name) {
    this._name = _name
  }

  select() {
    // This functionality is still undefined/undecided.
    return this
  }

  elements() {

    const out = adapt($.of([document.body]))

    out._isCycleSource = this._name

    return out
  }

  element() {

    const out = adapt($.of(document.body))

    out._isCycleSource = this._name

    return out
  }

  events(eventType, options = {}) {

    let stream

    stream = fromEvent(
      document.body,
      eventType,
      options.useCapture,
      options.preventDefault
    )

    const out = adapt(stream)

    out._isCycleSource = this._name

    return out
  }
}
