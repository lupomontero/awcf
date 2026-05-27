import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jsdom from 'jsdom';

let Component;

before(async () => {
  // Set up the JSDOM environment before running tests
  const { JSDOM } = jsdom;

  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;
  global.customElements = dom.window.customElements;
  global.HTMLElement = dom.window.HTMLElement;
  global.fetch = dom.window.fetch;

  // Load Component module after DOM is initialized
  const module = await import('../src/Component.js');
  Component = module.default;
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

describe('Component', () => {

  it('is an instance of HTMLElement', () => {
    class TestComponent extends Component {}
    customElements.define('is-html-element-instance', TestComponent);

    const instance = new TestComponent();
    assert.ok(
      instance instanceof HTMLElement,
      'Component is not an instance of HTMLElement',
    );
  });

  it('initializes state from constructor', () => {
    class TestComponent extends Component {}
    customElements.define(`initializes-state`, TestComponent);

    const state = { foo: 'bar' };
    const instance = new TestComponent(state);
    assert.deepEqual(
      instance.state,
      state,
      'State initialized from constructor does not match expected state',
    );
  });

  it('exposes state copy via getter', () => {
    class TestComponent extends Component {}
    customElements.define(`handle-state`, TestComponent);

    const state = { foo: 'bar' };
    const instance = new TestComponent(state);
    const stateCopy = instance.state;

    assert.deepEqual(stateCopy, state, 'State copy does not match original state');
    assert.notStrictEqual(stateCopy, instance.state, 'State getter does not return a new object');
  });

  it('renders on connectedCallback', async () => {
    let renderCalled = false;

    class TestComponent extends Component {
      render() {
        renderCalled = true;
      }
    }
    customElements.define(`render-on-connected-callback`, TestComponent);

    const instance = new TestComponent();
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        assert.ok(
          renderCalled,
          'Render method was not called on connectedCallback',
        );
        document.body.removeChild(instance);
        done();
      }, 500);
    });
  });

  it('renders when state is updated', async () => {
    let renderCount = 0;

    class TestComponent extends Component {
      render() {
        renderCount++;
      }
    }
    customElements.define(`render-on-state-update`, TestComponent);

    const instance = new TestComponent({ foo: 'initial' });

    assert.strictEqual(
      renderCount,
      0,
      'Render method should not be called before component is connected to DOM',
    );

    document.body.appendChild(instance);

    assert.strictEqual(
      renderCount,
      0,
      'Render method should not have been called yet as it should be debounced',
    );

    return new Promise((done) => {
      setTimeout(() => {
        assert.strictEqual(
          renderCount,
          1,
          'Render method should have been called once after initial render',
        );
        instance.setState({ foo: 'bar' });

        setTimeout(() => {
          assert.strictEqual(
            renderCount,
            2,
            'Render method should have been called again after state update',
          );
          document.body.removeChild(instance);
          done();
        }, 100);
      }, 100);
    });
  });

  it('merges new state with existing state', async () => {
    class TestComponent extends Component {
      render() {}
    }
    customElements.define(`merges-state`, TestComponent);

    const instance = new TestComponent({ foo: 'bar', count: 1 });
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        assert.deepEqual(
          instance.state,
          { foo: 'bar', count: 1 },
          'Initial state does not match expected state',
        );

        instance.setState({ count: 2 });

        setTimeout(() => {
          assert.deepEqual(
            instance.state,
            { foo: 'bar', count: 2 },
            'State was not merged correctly on update',
          );
          document.body.removeChild(instance);
          done();
        }, 100);
      }, 100);
    });
  });

  it('does not render when state is updated with render=false', async () => {
    let renderCalled = false;

    class TestComponent extends Component {
      render() {
        renderCalled = true;
      }
    }
    customElements.define(`does-not-render-on-state-update`, TestComponent);

    const instance = new TestComponent({ foo: 'initial' });
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        assert.ok(
          renderCalled,
          'Render method was not called on connectedCallback',
        );

        renderCalled = false;
        instance.setState({ foo: 'bar' }, false);

        setTimeout(() => {
          assert.ok(
            !renderCalled,
            'Render method should not have been called when state updated with render=false',
          );
          document.body.removeChild(instance);
          done();
        }, 100);
      }, 100);
    });
  });

  it('renders when observed attribute changes', async () => {
    let renderCalled = false;

    class TestComponent extends Component {
      static get observedAttributes() {
        return ['data-test'];
      }

      render() {
        renderCalled = true;
      }
    }
    customElements.define(`render-on-attribute-change`, TestComponent);

    const instance = new TestComponent();
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        assert.ok(
          renderCalled,
          'Render method was not called on connectedCallback',
        );

        renderCalled = false;
        instance.setAttribute('data-test', 'value');

        setTimeout(() => {
          assert.ok(
            renderCalled,
            'Render method was not called when observed attribute changed',
          );
          document.body.removeChild(instance);
          done();
        }, 100);
      }, 100);
    });
  });

  it('debounces render calls', async () => {
    let renderCount = 0;

    class TestComponent extends Component {
      render() {
        renderCount++;
      }
    }
    customElements.define(`debounces-render-calls`, TestComponent);

    const instance = new TestComponent({ foo: 'initial' });
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        assert.strictEqual(
          renderCount,
          1,
          'Render method should have been called once after initial render',
        );

        instance.setState({ foo: 'update1' });
        instance.setState({ foo: 'update2' });
        instance.setState({ foo: 'update3' });

        setTimeout(() => {
          assert.strictEqual(
            renderCount,
            2,
            'Render method should have been called only once after multiple rapid state updates',
          );
          document.body.removeChild(instance);
          done();
        }, 200);
      }, 100);
    });
  });

  // throws when no render method implemented

  it('invokes unsubscribes on disconnectedCallback', async () => {
    let unsubscribeCalled = false;

    class TestComponent extends Component {
      connectedCallback() {
        super.connectedCallback();
        this.unsubscribes.push(() => {
          unsubscribeCalled = true;
        });
      }

      render() {}
    }

    customElements.define(`invokes-unsubscribes-on-disconnected-callback`, TestComponent);

    const instance = new TestComponent();
    document.body.appendChild(instance);

    return new Promise((done) => {
      setTimeout(() => {
        // We can't directly assert that the console.log was called, but we can check that the unsubscribes array is cleared
        assert.strictEqual(
          instance.unsubscribes.length,
          1,
          'Unsubscribes array should have one function before disconnectedCallback',
        );

        document.body.removeChild(instance);

        setTimeout(() => {
          assert.ok(
            unsubscribeCalled,
            'Unsubscribe function was not called on disconnectedCallback',
          );
          assert.strictEqual(
            instance.unsubscribes.length,
            0,
            'Unsubscribes array should be empty after disconnectedCallback',
          );
          done();
        }, 100);
      }, 100);
    });
  });
});
