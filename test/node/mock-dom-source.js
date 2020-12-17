import 'symbol-observable'
import * as assert from 'assert'
import { Stream as $ } from 'xstream'
import { setup } from '@cycle/run'
import { setAdapt } from '@cycle/run/lib/adapt.js'
import {
  h3,
  h4,
  h2,
  div,
  h,
  MockedDomSource,
} from '../../src/index.js'





describe('MockedDomSource', function () {

  beforeEach(() => {
    setAdapt($.from)
  })

  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof MockedDomSource, 'function')
  })

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
      },
    })
    userEvents
      .select('.foo')
      .events('click')
      .subscribe({
        next: ev => {
          assert.strictEqual(ev, 135)
          done()
        },
        error: done,
        complete: () => { },
      })
  })

  it('should make multiple user event Observables', function (done) {
    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
      },
      '.bar': {
        scroll: $.of(2),
      },
    })
    $.combine(
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll'),
    )
      .map(([a, b]) => a * b)
      .subscribe({
        next: ev => {
          assert.strictEqual(ev, 270)
          done()
        },
        error: done,
        complete: () => { },
      })
  })

  it('should make multiple user event Observables on the same selector', function (done) {
    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
        scroll: $.of(3),
      },
    })
    $.combine(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
    )
      .map(([a, b]) => a * b)
      .subscribe({
        next: ev => {
          assert.strictEqual(ev, 405)
          done()
        },
        error: done,
        complete: () => { },
      })
  })

  it('should return an empty Observable if query does not match', function (done) {

    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
      },
    })

    userEvents
      .select('.impossible')
      .events('scroll')
      .subscribe({
        next: done,
        error: done,
        complete: done,
      })
  })

  it('should return empty Observable for select().elements and none is defined', function (done) {
    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
      },
    })
    userEvents
      .select('.foo')
      .elements()
      .subscribe({
        next: done,
        error: done,
        complete: done,
      })
  })

  it('should return defined Observable for select().elements', function (done) {
    const mockedDOMSource = MockedDomSource({
      '.foo': {
        elements: $.of(135),
      },
    })
    mockedDOMSource
      .select('.foo')
      .elements()
      .subscribe({
        next: (e) => {
          assert.strictEqual(e, 135)
          done()
        },
        error: done,
        complete: () => { },
      })
  })

  it('should have DevTools flag in elements() source stream', function (done) {
    const mockedDOMSource = MockedDomSource({
      '.foo': {
        elements: $.of(135),
      },
    })
    assert.strictEqual(
      mockedDOMSource.select('.foo').elements()._isCycleSource,
      'MockedDOM'
    )
    done()
  })

  it('should have DevTools flag in events() source stream', function (done) {
    const userEvents = MockedDomSource({
      '.foo': {
        click: $.of(135),
      },
    })
    assert.strictEqual(
      userEvents.select('.foo').events('click')._isCycleSource,
      'MockedDOM'
    )
    done()
  })

  it('should return defined Observable when chaining .select()', function (done) {
    const mockedDOMSource = MockedDomSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: $.of(135),
          },
        },
      },
    })
    mockedDOMSource
      .select('.bar')
      .select('.foo')
      .select('.baz')
      .elements()
      .subscribe({
        next: e => {
          assert.strictEqual(e, 135)
          done()
        },
        error: done,
        complete: () => { },
      })
  })

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = MockedDomSource({})
      DOM.select('.something')
        .select('.other')
        .events('click')
    })
  })

  it('multiple .select()s should return some observable if not defined', () => {
    const DOM = MockedDomSource({})
    const domSource = DOM.select('.something').select('.other')
    assert.strictEqual(
      typeof domSource.events('click').subscribe,
      'function',
      'domSource.events(click) should be an Observable instance'
    )
    assert.strictEqual(
      typeof domSource.elements().subscribe,
      'function',
      'domSource.elements() should be an Observable instance'
    )
  })
})

describe('isolation on MockedDomSource', function () {
  it('should have the same effect as DOM.select()', function (done) {

    function app() {
      return {
        DOM: $.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.child.___foo', [h4('.bar', 'Correct')]),
          ])
        ),
      }
    }

    const { sources, run } = setup(app, {
      DOM: () =>
        MockedDomSource({
          '.___foo': {
            '.bar': {
              elements: $.of('skipped', 135),
            },
          },
        }),
    })

    let dispose
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo')

    // Make assertions
    isolatedDOMSource
      .select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .subscribe({
        next: elements => {
          assert.strictEqual(elements, 135)
          setTimeout(() => {
            dispose()
            done()
          })
        }
      })
    dispose = run()
  })

  it('should have isolateSource and isolateSink', function (done) {
    function app() {
      return {
        DOM: $.of(h('h3.top-most.___foo')),
      }
    }

    const { sources, run } = setup(app, {
      DOM: () => MockedDomSource({}),
    })
    const dispose = run()
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo')
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function')
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function')
    dispose()
    done()
  })

  it('should prevent parent from DOM.selecting() inside the isolation', function (done) {
    function app(_sources) {
      const child$ = _sources.DOM.isolateSink(
        $.of(div('.foo', [h4('.bar', 'Wrong')])),
        'ISOLATION'
      )
      return {
        DOM: child$.map(child =>
          h3('.top-most', [child, h2('.bar', 'Correct')])
        ),
      }
    }

    const { sources, run } = setup(app, {
      DOM: () =>
        MockedDomSource({
          '.___ISOLATION': {
            '.bar': {
              elements: $.of('skipped', 'Wrong'),
            },
          },
          '.bar': {
            elements: $.of('skipped', 'Correct'),
          },
        }),
    })

    sources.DOM.select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .subscribe({
        next: function (x) {
          assert.strictEqual(x, 'Correct')
          done()
        }
      })
    run()
  })
})
