import * as assert from 'assert';
import { Stream as $ } from 'xstream';
import { setup } from '@cycle/run';
import {
  div,
  span,
  p,
  DomDriver,
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

describe('DOMSource.elements()', function () {
  it('should return a stream of documents when querying "document"', done => {
    function app(_sources) {
      return {
        DOM: $.of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: DomDriver(createRenderTarget()),
    });

    function isDocument(element) {
      return 'body' in element && 'head' in element;
    }

    let dispose;
    sources.DOM.select('document')
      .element()
      .take(1)
      .addListener({
        next: root => {
          assert(root.body !== undefined); //Check type inference
          assert(isDocument(root));
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should return a stream of bodies when querying "body"', done => {
    function app(_sources) {
      return {
        DOM: $.of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: DomDriver(createRenderTarget()),
    });

    function isBody(element) {
      return 'aLink' in element && 'link' in element;
    }

    let dispose;
    sources.DOM.select('body')
      .element()
      .take(1)
      .addListener({
        next: root => {
          assert(root.aLink !== undefined); //Check type inference
          assert(isBody(root));
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should return a stream of arrays of elements of size 1 when querying ":root"', done => {
    function app(_sources) {
      return {
        DOM: $.of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: DomDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.select(':root')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: root => {
          assert(root.forEach !== undefined); //Check type inference
          assert(Array.isArray(root));
          assert(root.length === 1);
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should return a stream of arrays of elements of size 2 when querying ".some"', done => {
    function app(_sources) {
      return {
        DOM: $.of(div('.top-most', [div('.some'), div('.some')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: DomDriver(createRenderTarget()),
    });

    let dispose;
    sources.DOM.select('.some')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: elems => {
          assert(Array.isArray(elems));
          assert(elems.length === 2);
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });
});
