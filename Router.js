class Router extends HTMLElement {
  #urlPrefix = import.meta.env.BASE_URL || '';
  #renderedRoute;
  #routes;
  #state;

  constructor(routes, state) {
    super();

    this.#routes = routes;
    this.#state = state;
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

  setState(newState) {
    this.#state = {
      ...this.#state,
      ...newState,
    };

    [...this.children].forEach(child => {
      if (typeof child.setState === 'function') {
        child.setState({ ...this.#state, router: this });
      }
    });
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

    // const a = (
    //   event.target.tagName === 'A'
    //     ? event.target
    //     : event.target.parentElement?.tagName === 'A'
    //       ? event.target.parentElement
    //       : null
    // );

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

  async render() {
    const pathname = window.location.pathname.replace(this.#urlPrefix, '/');
    const route = this.matchRoute(pathname) || this.#routes['/404'];

    this.#renderedRoute = await route({
      ...this.#state,
      router: this,
    });
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
      return this.#routes[pathname];
    }

    const pathSegments = pathname.split('/').filter(Boolean);

    for (const route in this.#routes) {
      const routeSegments = route.split('/').filter(Boolean);

      if (routeSegments.length !== pathSegments.length) {
        continue;
      }

      const params = {};
      let isMatch = true;

      for (let i = 0; i < routeSegments.length; i++) {
        if (routeSegments[i].startsWith(':')) {
          const paramName = routeSegments[i].slice(1);
          params[paramName] = pathSegments[i];
        } else if (routeSegments[i] !== pathSegments[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return (...args) => this.#routes[route](...args, params);
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
