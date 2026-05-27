import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jsdom from 'jsdom';

let Router;

before(async () => {
  // Set up the JSDOM environment before running tests
  const { JSDOM } = jsdom;

  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;
  global.customElements = dom.window.customElements;
  global.HTMLElement = dom.window.HTMLElement;
  global.fetch = dom.window.fetch;

  // Load Router module after DOM is initialized
  const module = await import('../src/Router.js');
  Router = module.default;
});

after(() => {
  // Clean up the JSDOM environment after tests are done
  delete global.window;
  delete global.document;
  delete global.customElements;
  delete global.HTMLElement;
  delete global.fetch;
});

beforeEach(() => {
  // Clear the document body before each test to ensure a clean slate
  document.body.innerHTML = '';
});

describe('Router', () => {
  it('is an instance of HTMLElement', () => {
    class TestRouter extends Router {}
    customElements.define('is-html-element-instance', TestRouter);

    const instance = new TestRouter();
    assert.ok(
      instance instanceof HTMLElement,
      'Router is not an instance of HTMLElement',
    );
  });
});