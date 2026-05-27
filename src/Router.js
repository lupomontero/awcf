import Component from './Component.js';
import Route from './Route.js';
import { isPlainObject } from './util.js';

class Router extends Component {
  #urlPrefix;
  #routes;
  #renderedRoute;

  constructor(routes, state = {}, urlPrefix = '') {
    super(state);

    if (!isPlainObject(routes)) {
      throw new Error('Routes must be a plain object');
    }

    if (!isPlainObject(state)) {
      throw new Error('State must be a plain object');
    }

    if (typeof urlPrefix !== 'string') {
      throw new Error('URL prefix must be a string');
    }

    this.#routes = routes;
    this.#urlPrefix = urlPrefix;

    this.render = this.render.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.navigateTo = this.navigateTo.bind(this);
    this.outlet = Object.assign(document.createElement('slot'), {
      name: 'outlet',
    });

    this.appendChild(this.outlet);
  }

  connectedCallback() {
    window.addEventListener('popstate', this.render);
    this.addEventListener('click', this.handleLinkClick);
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.render);
    this.removeEventListener('click', this.handleLinkClick);
  }

  handleLinkClick(event) {
    const findContainingAnchor = (element) => {
      if (!element) {
        return null;
      }

      if (element.tagName === 'A') {
        return element;
      }

      return findContainingAnchor(element.parentElement);
    };

    const a = findContainingAnchor(event.target);

    if (!a) {
      return;
    }

    // if link is external, ignore
    if (a.hostname !== window.location.hostname) {
      return;
    }

    event.preventDefault();
    this.navigateTo(a.getAttribute('href'));
  }

  // Extracts the pathname from the current URL, removing the URL prefix if it
  // exists, and returns a "normalized" pathname that can be used for route
  // matching (always leading slash and never trailing slash).
  // NOTE: this.#urlPrefix is a user provided string that may or may not have
  // leading/trailing slashes, so we need to normalize it before using it.
  getPathnameWithoutPrefix() {
    const normalizedUrlPrefix = this.#urlPrefix
      ? `/${this.#urlPrefix.replace(/^\/|\/$/g, '')}`
      : '';
    const pathname = window.location.pathname;

    if (normalizedUrlPrefix && pathname.startsWith(normalizedUrlPrefix)) {
      return pathname.slice(normalizedUrlPrefix.length) || '/';
    }

    return pathname;
  }

  async render() {
    const pathname = this.getPathnameWithoutPrefix();
    const [route, params] = this.matchRoute(pathname) || [this.#routes['/404'], {}];

    this.#renderedRoute = await route(this, params);

    if (!(this.#renderedRoute instanceof Route)) {
      console.warn(`Route ${pathname} did not return a Route instance`);
    }

    if (!(this.#renderedRoute instanceof HTMLElement)) {
      console.error(`Route ${pathname} did not return an HTMLElement instance`);
      return;
    }

    this.outlet.innerHTML = '';
    this.outlet.appendChild(this.#renderedRoute);

    if (window.location.hash) {
      const targetId = window.location.hash.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView();
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  matchRoute(pathname) {
    if (this.#routes[pathname]) {
      return [this.#routes[pathname], {}];
    }

    const absoluteURL = new URL(pathname, window.location.origin);

    for (const route in this.#routes) {
      const match = new URLPattern(route, window.location.origin).exec(absoluteURL);
      if (match) {
        return [this.#routes[route], match.pathname.groups];
      }
    }

    return null;
  }

  navigateTo(path) {
    const normalizedPath = (
      path.startsWith('/') && this.#urlPrefix.endsWith('/')
        ? `${this.#urlPrefix}${path.slice(1)}`
        : `${this.#urlPrefix}${path}`
    );

    window.history.pushState({}, '', `${normalizedPath}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

customElements.define('awcf-router', Router);
export default Router;
