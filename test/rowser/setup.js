export const isIE10 = !window.MutationObserver;

if (isIE10)
  window.MutationObserver = require('mutation-observer');


if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

import 'es6-map/implement'; // tslint:disable-line
import 'es6-set/implement'; // tslint:disable-line
