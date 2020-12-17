// import { Stream as $ } from 'xstream';
// import { adapt } from '@cycle/run/lib/adapt.js';





// const SCOPE_PREFIX = '___';

// export const MockedDomSource = mockConfig => {

//   let _elements = mockConfig.elements
//     ? mockConfig.elements
//     : adapt($.empty())

//   const elements = () => {

//     const out = _elements;
//     out._isCycleSource = 'MockedDOM';

//     return out;
//   }

//   return {
//     elements,
//     element() {

//       const output$ = elements()
//         .filter((arr) => arr.length > 0)
//         .map((arr) => arr[0])
//         .remember();

//       const out = adapt(output$);
//       out._isCycleSource = 'MockedDOM';
//       return out;
//     },

//     events(eventType, options, bubbles) {
//       const streamForEventType = mockConfig[eventType];
//       const out = adapt(streamForEventType || $.empty());

//       out._isCycleSource = 'MockedDOM';

//       return out;
//     },

//     select(selector) {
//       const mockConfigForSelector = mockConfig[selector] || {};

//       return MockedDomSource(mockConfigForSelector);
//     },

//     isolateSource(source, scope) {

//       return source.select('.' + SCOPE_PREFIX + scope);
//     },

//     isolateSink(sink, scope) {

//       return adapt(
//         $.fromObservable(sink).map(vnode => {
//           if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
//             return vnode;
//           } else {
//             vnode.sel += `.${SCOPE_PREFIX}${scope}`;
//             return vnode;
//           }
//         })
//       );
//     }
//   }
// }
import { Stream as $ } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt.js'





const SCOPE_PREFIX = '___'

export const MockedDomSource = _mockConfig => {

  const _elements = _mockConfig.elements || adapt($.empty())

  const elements = () => {
    const out = _elements
    out._isCycleSource = 'MockedDOM'
    return out
  }

  return {
    elements,
    element() {

      const output$ = elements()
        .filter((arr) => arr.length > 0)
        .map((arr) => arr[0])
        .remember()

      const out = adapt(output$)
      out._isCycleSource = 'MockedDOM'
      return out
    },
    events(eventType/* , options, bubbles */) {
      const streamForEventType = _mockConfig[eventType]
      const out = adapt(streamForEventType || $.empty())

      out._isCycleSource = 'MockedDOM'

      return out
    },
    select(selector) {

      const mockConfigForSelector = _mockConfig[selector] || {}

      return MockedDomSource(mockConfigForSelector)
    },
    isolateSource(source, scope) {
      return source.select('.' + SCOPE_PREFIX + scope)
    },
    isolateSink(sink, scope) {
      return adapt(
        $.fromObservable(sink).map(vnode => {
          if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
            return vnode
          } else {
            vnode.sel += `.${SCOPE_PREFIX}${scope}`
            return vnode
          }
        })
      )
    }
  }
}
/* export class MockedDomSource {
  // private _elements: FantasyObservable<any>;

  constructor(_mockConfig) {
    if (_mockConfig.elements) {
      this._elements = _mockConfig.elements;
    } else {
      this._elements = adapt($.empty());
    }
    this._mockConfig = _mockConfig
  }

  elements() {
    const out = this._elements;
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  element() {

    const output$ = this.elements()
      .filter((arr) => arr.length > 0)
      .map((arr) => arr[0])
      .remember();

    const out = adapt(output$);
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  events(
    eventType,
    options,
    bubbles
  ) {
    const streamForEventType = this._mockConfig[eventType];
    const out = adapt(streamForEventType || $.empty());

    out._isCycleSource = 'MockedDOM';

    return out;
  }

  select(selector) {

    const mockConfigForSelector = this._mockConfig[selector] || {};

    return new MockedDomSource(mockConfigForSelector);
  }

  isolateSource(source, scope) {
    return source.select('.' + SCOPE_PREFIX + scope);
  }

  isolateSink(sink, scope) {
    return adapt(
      $.fromObservable(sink).map(vnode => {
        if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
          return vnode;
        } else {
          vnode.sel += `.${SCOPE_PREFIX}${scope}`;
          return vnode;
        }
      })
    );
  }
}
 */