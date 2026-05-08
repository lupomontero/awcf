import { debounce } from './util.js';

class Component extends HTMLElement {
  #state;

  constructor(state = {}) {
    super();
    this.#state = state;
    this.render = debounce(this.render.bind(this), 50);
    this.unsubscribes = [];
  }

  get state() {
    return this.#state;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (Array.isArray(this.unsubscribes) && this.unsubscribes.length > 0) {
      this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    }

    this.unsubscribes = [];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const { observedAttributes } = this.constructor;

    if (!observedAttributes.includes(name) || oldValue === newValue) {
      return;
    }

    this.render();
  }

  setState(newState, render = true) {
    this.#state = { ...this.#state, ...newState };
    if (render) {
      this.render();
    }
  }

  render() {
    throw new Error('Render method must be implemented by subclass');
  }
}

export default Component;
