import { isIE10 } from './setup';
import * as assert from 'assert';
import isolate from '@cycle/isolate';
import { Stream as $ } from 'xstream';
import delay from 'xstream/extra/delay';
import concat from 'xstream/extra/concat';
import { setup } from '@cycle/run';
import {
  div,
  textarea,
  input,
  span,
  h2,
  h3,
  h4,
  form,
  button,
  makeDOMDriver,
} from '../../src/index';

function createRenderTarget(id = null) {
  const element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

function testFragmentEvents() {
  let captures = false;
  let bubbles = false;
  const captureEvent = document.createEvent('CustomEvent');
  const bubbleEvent = document.createEvent('CustomEvent');
  const fragment = document.createDocumentFragment();
  const parent = document.createElement('div');
  const child = document.createElement('div');
  fragment.appendChild(parent);
  parent.appendChild(child);
  parent.addEventListener(
    'fragmentCapture',
    () => {
      captures = true;
    },
    true
  );
  parent.addEventListener(
    'fragmentBubble',
    () => {
      bubbles = true;
    },
    false
  );
  captureEvent.initCustomEvent('fragmentCapture', false, true, null);
  bubbleEvent.initCustomEvent('fragmentBubble', true, true, null);
  child.dispatchEvent(captureEvent);
  child.dispatchEvent(bubbleEvent);
  return { captures, bubbles };
}

const fragmentSupport = testFragmentEvents();

describe('DOMSource.events()', function () {
  it('should catch a basic click interaction Observable', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose;
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: function (root) {
          const myElement = root.querySelector(
            '.myelementclass'
          );
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should setup click detection with events() after run() occurs', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(h3('.test2.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const dispose = run();
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next(ev) {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Foobar');
          dispose();
          done();
        },
      });

    setTimeout(() => {
      const myElement = document.querySelector(
        '.test2.myelementclass'
      );
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click());
      });
    }, 200);
  });

  it('should setup click detection on a ready DOM element (e.g. from server)', function (done) {
    function app(_sources) {
      return {
        DOM: $.never(),
      };
    }

    const containerElement = createRenderTarget();
    const headerElement = document.createElement('H3');
    headerElement.className = 'myelementclass';
    headerElement.textContent = 'Foobar';
    containerElement.appendChild(headerElement);

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(containerElement),
    });
    const dispose = run();
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Foobar');
          dispose();
          done();
        },
      });

    setTimeout(() => {
      const myElement = containerElement.querySelector(
        '.myelementclass'
      );
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click());
      });
    }, 200);
  });

  it('should catch events using id of root element in DOM.select', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-001')),
    });

    let dispose;
    sources.DOM.select('#parent-001')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const myElement = root.querySelector(
            '.myelementclass'
          );
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch events using id of top element in DOM.select', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(h3('#myElementId', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002')),
    });

    let dispose;
    sources.DOM.select('#myElementId')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const myElement = root.querySelector('#myElementId');
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch interaction events without prior select()', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [h3('.myelementclass', 'Foobar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.events('click').addListener({
      next: ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        dispose();
        done();
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const myElement = root.querySelector(
            '.myelementclass'
          );
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch user events using DOM.select().select().events()', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.select('.foo')
      .select('.bar')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Correct');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const wrongElement = root.querySelector('.bar');
          const correctElement = root.querySelector('.foo .bar');
          assert.notStrictEqual(wrongElement, null);
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof wrongElement, 'undefined');
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(wrongElement.tagName, 'H2');
          assert.strictEqual(correctElement.tagName, 'H4');
          assert.doesNotThrow(function () {
            setTimeout(() => wrongElement.click());
            setTimeout(() => correctElement.click(), 15);
          });
        },
      });
    dispose = run();
  });

  it('should catch events from many elements using DOM.select().events()', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [
            h4('.clickable.first', 'First'),
            h4('.clickable.second', 'Second'),
          ])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.select('.clickable')
      .events('click')
      .take(1)
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'First');
        },
      });

    sources.DOM.select('.clickable')
      .events('click')
      .drop(1)
      .take(1)
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Second');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const firstElem = root.querySelector('.first');
          const secondElem = root.querySelector('.second');
          assert.notStrictEqual(firstElem, null);
          assert.notStrictEqual(typeof firstElem, 'undefined');
          assert.notStrictEqual(secondElem, null);
          assert.notStrictEqual(typeof secondElem, 'undefined');
          assert.doesNotThrow(function () {
            setTimeout(() => firstElem.click());
            setTimeout(() => secondElem.click(), 5);
          });
        },
      });
    dispose = run();
  });

  it('should catch interaction events from future elements', function (done) {
    function app(_sources) {
      return {
        DOM: concat(
          $.of(h2('.blesh', 'Blesh')),
          $.of(h3('.blish', 'Blish')).compose(delay(150)),
          $.of(h4('.blosh', 'Blosh')).compose(delay(150))
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002')),
    });

    let dispose;
    sources.DOM.select('.blosh')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Blosh');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(3)
      .take(1)
      .addListener({
        next: root => {
          const myElement = root.querySelector('.blosh');
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H4');
          assert.strictEqual(myElement.textContent, 'Blosh');
          assert.doesNotThrow(function () {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch bubbling events in a DocumentFragment', function (done) {
    if (isIE10) {
      done();
      return;
    }

    const { bubbles: thisBrowserBubblesFragmentEvents } = fragmentSupport;

    function app(_sources) {
      return {
        DOM: $.of(div([div('.clickable', 'Hello')])),
      };
    }

    if (!thisBrowserBubblesFragmentEvents) {
      done();
    } else {
      const fragment = document.createDocumentFragment();
      const renderTarget = fragment.appendChild(document.createElement('div'));

      const { sinks, sources, run } = setup(app, {
        DOM: makeDOMDriver(renderTarget),
      });

      sources.DOM.select('.clickable')
        .events('click', { useCapture: false })
        .addListener({
          next: ev => {
            const elem = ev.target;
            assert.strictEqual(ev.type, 'click');
            assert.strictEqual(elem.tagName, 'DIV');
            assert.strictEqual(elem.className, 'clickable');
            assert.strictEqual(elem.textContent, 'Hello');
            const top = elem.parentElement;
            const renderTarget2 = top.parentNode;
            const frag = renderTarget2.parentNode;
            assert.strictEqual(frag instanceof DocumentFragment, true);
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: root => {
            const clickable = root.querySelector('.clickable');
            setTimeout(() => clickable.click(), 80);
          },
        });
      run();
    }
  });

  it('should catch non-bubbling events in a DocumentFragment with useCapture', function (done) {
    if (isIE10) {
      done();
      return;
    }

    const { captures: thisBrowserCapturesFragmentEvents } = fragmentSupport;

    function app(_sources) {
      return {
        DOM: $.of(div([textarea('.blurable', 'Hello')])),
      };
    }

    if (!thisBrowserCapturesFragmentEvents) {
      done();
    } else {
      const fragment = document.createDocumentFragment();
      const renderTarget = fragment.appendChild(document.createElement('textarea'));

      const { sinks, sources, run } = setup(app, {
        DOM: makeDOMDriver(renderTarget),
      });

      sources.DOM.select('.blurable')
        .events('mouseenter', { useCapture: true })
        .addListener({
          next: ev => {
            const elem = ev.target;
            assert.strictEqual(ev.type, 'mouseenter');
            assert.strictEqual(elem.tagName, 'TEXTAREA');
            assert.strictEqual(elem.className, 'blurable');
            assert.strictEqual(elem.textContent, 'Hello');
            const top = elem.parentElement;
            const renderTarget2 = top.parentNode;
            const frag = renderTarget2.parentNode;
            assert.strictEqual(frag instanceof DocumentFragment, true);
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: root => {
            const blurable = root.querySelector('.blurable');

            setTimeout(() => {
              let event;
              if (typeof (MouseEvent) === 'function') {
                event = new MouseEvent('mouseenter', {
                  'view': window,
                  'bubbles': false,
                  'cancelable': false
                });
              } else {
                event = document.createEvent('MouseEvent');
                event.initMouseEvent('mouseenter', false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
              }

              blurable.dispatchEvent(event);
            }, 80);
          },
        });
      run();
    }
  });

  it('should have currentTarget or ownerTarget pointed to the selected parent', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.top', [h2('.parent', [span('.child', 'Hello world')])])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.select('.parent')
      .events('click')
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'SPAN');
          assert.strictEqual(target.className, 'child');
          assert.strictEqual(target.textContent, 'Hello world');
          const currentTarget = ev.currentTarget;
          const ownerTarget = ev.ownerTarget;
          const currentTargetIsParentH2 =
            currentTarget.tagName === 'H2' &&
            currentTarget.className === 'parent';
          const ownerTargetIsParentH2 =
            ownerTarget.tagName === 'H2' && ownerTarget.className === 'parent';
          assert.strictEqual(
            currentTargetIsParentH2 || ownerTargetIsParentH2,
            true
          );
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const child = root.querySelector('.child');
          assert.notStrictEqual(child, null);
          assert.notStrictEqual(typeof child, 'undefined');
          assert.strictEqual(child.tagName, 'SPAN');
          assert.strictEqual(child.className, 'child');
          assert.doesNotThrow(function () {
            setTimeout(() => child.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch a non-bubbling Form `reset` event', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [form('.form', [input('.field', { type: 'text' })])])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.form')
      .events('reset', {}, false)
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'reset');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'FORM');
          assert.strictEqual(target.className, 'form');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _form = root.querySelector('.form');
          setTimeout(() => _form.reset());
        },
      });
    run();
  });

  it('should catch a non-bubbling click event with useCapture', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [div('.clickable', 'Hello')])),
      };
    }

    function click(el) {
      const ev = document.createEvent(`MouseEvent`);
      ev.initMouseEvent(
        `click`,
        false, // bubble
        true, // cancelable
        window,
        0,
        0,
        0,
        0,
        0, // coordinates
        false,
        false,
        false,
        false, // modifier keys
        0, //left
        null
      );
      el.dispatchEvent(ev);
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.clickable')
      .events('click', { useCapture: true }, false)
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'DIV');
          assert.strictEqual(target.className, 'clickable');
          assert.strictEqual(target.textContent, 'Hello');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const clickable = root.querySelector('.clickable');
          setTimeout(() => click(clickable));
        },
      });
    run();
  });

  it('should emit to multiple nonbubbling event streams', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [
            input('.input', { type: 'text' }),
          ])
        ),
      };
    }

    if (!document.hasFocus()) {
      done();
    } else {
      const { sinks, sources, run } = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      $.merge(
        sources.DOM.select('.input').events('focus'),
        sources.DOM.select('.input').events('focus'),
      )
        .mapTo(1)
        .fold((prev, current) => prev + current, 0)
        .addListener({
          next: (count) => {
            if (count === 2) {
              done();
            }
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: root => {
            const inputElement = root.querySelector('.input');
            setTimeout(() => inputElement.focus(), 50);
          },
        });
      run();
    }
  });

  it('should catch a blur event with useCapture', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [
            input('.correct', { type: 'text' }, []),
            input('.wrong', { type: 'text' }, []),
            input('.dummy', { type: 'text' }),
          ])
        ),
      };
    }

    if (!document.hasFocus()) {
      done();
    } else {
      const { sinks, sources, run } = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.select('.correct')
        .events('blur', { useCapture: true })
        .addListener({
          next: ev => {
            assert.strictEqual(ev.type, 'blur');
            assert.strictEqual(ev.target.className, 'correct');
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: root => {
            const correct = root.querySelector('.correct');
            const wrong = root.querySelector('.wrong');
            const dummy = root.querySelector('.dummy');
            setTimeout(() => wrong.focus(), 50);
            setTimeout(() => dummy.focus(), 100);
            setTimeout(() => correct.focus(), 150);
            setTimeout(() => dummy.focus(), 200);
          },
        });
      run();
    }
  });

  it('should catch a blur event by default (no options)', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [
            input('.correct', { type: 'text' }, []),
            input('.wrong', { type: 'text' }, []),
            input('.dummy', { type: 'text' }),
          ])
        ),
      };
    }

    if (!document.hasFocus()) {
      done();
    } else {
      const { sinks, sources, run } = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.select('.correct')
        .events('blur')
        .addListener({
          next: ev => {
            assert.strictEqual(ev.type, 'blur');
            assert.strictEqual(ev.target.className, 'correct');
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: root => {
            const correct = root.querySelector('.correct');
            const wrong = root.querySelector('.wrong');
            const dummy = root.querySelector('.dummy');
            setTimeout(() => wrong.focus(), 50);
            setTimeout(() => dummy.focus(), 100);
            setTimeout(() => correct.focus(), 150);
            setTimeout(() => dummy.focus(), 200);
          },
        });
      run();
    }
  });

  it('should not simulate bubbling for non-bubbling events', done => {
    function app(_sources) {
      return {
        DOM: $.of(
          div('.parent', [form('.form', [input('.field', { type: 'text' })])])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.parent')
      .events('reset')
      .addListener({
        next: ev => {
          done(new Error('Reset event should not bubble to parent'));
        },
      });

    sources.DOM.select('.form')
      .events('reset')
      .compose(delay(200))
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'reset');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'FORM');
          assert.strictEqual(target.className, 'form');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _form = root.querySelector('.form');
          setTimeout(() => _form.reset());
        },
      });
    run();
  });

  it('should have the DevTools flag in the source stream', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const event$ = sources.DOM.select('.myelementclass').events('click');
    assert.strictEqual(event$._isCycleSource, 'DOM');
    done();
  });

  it('should allow restarting of event streams from isolated components', function (done) {
    const outSubject = $.create();
    const switchSubject = $.create();

    function component(_sources) {
      const itemMouseDown$ = _sources.DOM.select('.item').events(
        'mousedown',
        {},
        false
      );
      const itemMouseUp$ = _sources.DOM.select('.item').events(
        'mouseup',
        {},
        false
      );

      const itemMouseClick$ = itemMouseDown$
        .map(down => itemMouseUp$.filter(up => down.target === up.target))
        .flatten();

      switchSubject
        .map(() => itemMouseClick$)
        .flatten()
        .addListener({
          next: ev => {
            outSubject.shamefullySendNext(ev);
          },
        });

      return {
        DOM: $.of(button('.item', ['stuff'])),
      };
    }

    function app(_sources) {
      return isolate(component)(_sources);
    }

    function mouseevent(el, type) {
      // This works on IE10
      const ev = document.createEvent('MouseEvent');
      ev.initMouseEvent(
        type,
        false, // bubble
        true, // cancelable
        window,
        0,
        0,
        0,
        0,
        0, // coordinates
        false,
        false,
        false,
        false, // modifier keys
        0, //left
        null
      );

      // Would rather user this line below but does not work on IE10
      //const ev = new MouseEvent(type)

      el.dispatchEvent(ev);
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let count = 0;
    outSubject.addListener({
      next: ev => {
        assert.strictEqual(ev.type, 'mouseup');
        count++;
        if (count === 2) {
          done();
        }
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const clickable = root.querySelector('.item');
          setTimeout(() => switchSubject.shamefullySendNext(null));
          setTimeout(() => mouseevent(clickable, 'mousedown'), 100);
          setTimeout(() => mouseevent(clickable, 'mouseup'), 200);
          setTimeout(() => switchSubject.shamefullySendNext(null), 300);
          setTimeout(() => mouseevent(clickable, 'mousedown'), 400);
          setTimeout(() => mouseevent(clickable, 'mouseup'), 500);
        },
      });
    run();
  });

  it('should allow preventing default event behavior', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', { preventDefault: true })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with function', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', { preventDefault: ev => ev.type === 'click' })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with object', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', { preventDefault: { type: 'click' } })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with array in object', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button.to-prevent')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {
        preventDefault: { target: { classList: ['button', 'to-prevent'] } },
      })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button to-prevent');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from function predicate', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', { preventDefault: ev => ev.type !== 'click' })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from object predicate', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', { preventDefault: { type: 'notClick' } })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from array-in-object predicate', function (done) {
    function app(_sources) {
      return {
        DOM: $.of(div('.parent', [button('.button.to-prevent')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {
        preventDefault: { target: { classList: ['button', 'missing-class'] } },
      })
      .addListener({
        next: ev => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button to-prevent');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          const _button = root.querySelector('.button');
          setTimeout(() => _button.click());
        },
      });
    run();
  });
});
