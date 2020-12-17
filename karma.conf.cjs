const ci = !!process.env.CI;
const watch = !!process.env.WATCH;
const live = !!process.env.LIVE;

const ip = 'bs-local.com';

const browserstack = require('./browserstack-karma.cjs');

if (!process.env.TRAVIS_BUILD_NUMBER) {
  const time = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');

  process.env.TRAVIS_BUILD_NUMBER = 'local(' + time + ')';
}

const browsers = ci
  ? Object.keys(browserstack)
  : live
    ? undefined
    : ['Chrome', 'Firefox'];

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha'],
    files: [
      { pattern: 'src/**/*.js' },
      { pattern: 'test/browser/**/*.js' },
      { pattern: 'test/browser/**/*.jsx' },
    ],
    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-browserstack-launcher',
      'karma-webpack'
    ],
    hostname: ci ? ip : 'localhost',
    exclude: [],
    preprocessors: {
      'src/**/*.js': ['webpack'],
      'test/**/*.js': ['webpack'],
      'test/**/*.jsx': ['webpack'],
    },
    browserStack: {
      retryLimit: 3,
      build: process.env.TRAVIS_BUILD_NUMBER,
      name: 'Cycle.js DOM driver',
    },
    browserNoActivityTimeout: 1000000,
    customLaunchers: browserstack,
    webpack: {

    },
    webpackMiddleware: {
      stats: 'errors-only',
    },
    reporters: ['dots', 'BrowserStack'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: browsers,
    singleRun: !watch && !live,
    concurrency: ci ? 1 : Infinity,
  });
};

