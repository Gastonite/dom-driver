import xs, { } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt.js'
import { fromEvent } from './fromEvent.js'






export class DocumentDOMSource {
  constructor(_name) {
    this._name = _name

  }

  select() {
    // This functionality is still undefined/undecided.
    return this
  }

  elements() {

    // const { document } = window

    const out = adapt(
      xs.of([document])
    )

    out._isCycleSource = this._name

    return out
  }

  element() {

    const out = adapt(
      xs.of(document)
    )

    out._isCycleSource = this._name

    return out
  }

  events(eventType, options = {}) {
    let stream

    stream = fromEvent(
      document,
      eventType,
      options.useCapture,
      options.preventDefault
    )

    const out = adapt(stream)

    out._isCycleSource = this._name

    return out
  }
}
