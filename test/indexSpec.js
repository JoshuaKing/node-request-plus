/* eslint-env jasmine */
'use strict';
const rpPlus = require('../src/index');
const nock = require('nock');
const cm = require('cache-manager');
const pc = require('prom-client');

describe('index', () => {
  it('throws on unknown wrapper', () => {
    expect(() => rpPlus().plus.wrap('bad')).toThrow();
  });

  it('throws on bad custom wrapper', () => {
    expect(() => rpPlus().plus.wrap({something: 'strange'})).toThrow();
  });

  it('supports registering custom wrappers', done => {
    function myWrapper() {
      return function() {
        rpPlus.unregisterWrapper('myWrapper');
        done();
      };
    }
    rpPlus.registerWrapper('myWrapper', myWrapper);
    const rp = rpPlus().plus.wrap('myWrapper');
    nock('http://index0.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp('http://index0.com/test-path');
  });

  it('does not break basic functionility', done => {
    const rp = rpPlus();
    nock('http://index0.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp('http://index0.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });

  it('all std. decorators can be used', done => {
    const rp = rpPlus({
      event: true,
      retry: true,
      cache: {cache: cm.caching({store: 'memory'})},
      prom: {metric: new pc.Counter({name: 'some', help: 'some_help'})},
      log: {events: {}}, // mute aall events
    });

    nock('http://index1.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp('http://index1.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });

  it('same decorators added multiple times', done => {
    const rp = rpPlus()
      .plus.wrap('retry')
      .plus.wrap('event')
      .plus.wrap('retry');

    nock('http://index2.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp('http://index2.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });
});
