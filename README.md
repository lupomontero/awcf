# awcf (A Web Component Framework)

`awcf` is a minimal, zero-dependency web component framework built on native browser APIs. No virtual DOM, no build-time transforms — just custom elements and the History API.

> Experimental. Use at your own risk.

## Modules

| Export | Description |
|---|---|
| `awcf/Component` | Base class for all UI components |
| `awcf/Route` | Base class for page-level route components |
| `awcf/Router` | Client-side router custom element (`<awcf-router>`) |
| `awcf/util` | Utility helpers (`debounce`) |
| `awcf/vite-plugin-sw` | Vite plugin for service worker pre-cache population |

---

## `Component`

`Component` extends `HTMLElement`. It provides state management and a debounced render cycle.

```js
import Component from 'awcf/Component';

class MyWidget extends Component {
  render() {
    this.innerHTML = `<p>Hello, ${this.state.name}!</p>`;
  }
}

customElements.define('my-widget', MyWidget);
```

### API

**`constructor(state = {})`**  
Initializes the component with an optional initial state object. `render()` is automatically debounced (50 ms).

**`get state`**  
Returns a shallow copy of the current state. The internal state is private (`#state`) and cannot be mutated directly.

**`setState(newState, render = true)`**  
Merges `newState` into the current state. Triggers `render()` by default; pass `false` as the second argument to suppress re-rendering.

**`render()`**  
Must be implemented by subclasses. Called automatically on `connectedCallback` and after `setState`. Throws if not overridden.

**`unsubscribes`**  
An array of cleanup functions. Populate it in `connectedCallback` with teardown callbacks (e.g. Firestore `onSnapshot` unsubscribes). They are called automatically on `disconnectedCallback`.

**`attributeChangedCallback(name, oldValue, newValue)`**  
Calls `render()` when a watched attribute changes. Requires the subclass to define a static `observedAttributes` array.

---

## `Route`

`Route` extends `Component`. It is the expected return type of route handler functions. It provides access to the router instance and URL params.

```js
import Route from 'awcf/Route';

class Happening extends Route {
  connectedCallback() {
    const { happeningId } = this.params;
    super.connectedCallback(); // triggers initial render
    // set up subscriptions, etc.
  }

  render() {
    this.innerHTML = `<h1>Happening ${this.params.happeningId}</h1>`;
  }
}

customElements.define('x-happening', Happening);
export default Happening;
```

### API

**`constructor(router, params = {}, defaultClass = 'page')`**  
- `router` — must be a `Router` instance (validated at construction time).
- `params` — URL parameters extracted from the matched route pattern (e.g. `{ happeningId: '123' }` for `/happenings/:happeningId`).
- `defaultClass` — CSS class added to the element automatically (default: `'page'`). Pass `null` to disable.

Inherits the router's current state via `super(router.state)`.

**`this.router`** — the `Router` instance.  
**`this.params`** — the URL params object for the current match.

**`navigateTo(path)`**  
Delegates to `router.navigateTo(path)`. Performs a client-side navigation without a full page reload.

---

## `Router`

`Router` extends `Component` and registers as the `<awcf-router>` custom element. It manages client-side routing via the History API.

```js
import Router from 'awcf/Router';

const routes = await import('./routes.js').then(m => m.default);
const state = { user, network };
const router = new Router(routes, state);

document.getElementById('root').appendChild(router);
```

### Route handler signature

Each entry in the routes map is an async function that receives the **router instance** and an optional **params object**:

```js
// src/routes.js
export default {
  '/': async (router) => {
    const { default: Home } = await import('./routes/Home');
    return new Home(router);
  },
  '/happenings/:happeningId': async (router, params) => {
    const { default: Happening } = await import('./routes/Happening');
    return new Happening(router, params);
  },
  '/404': async () => {
    return Object.assign(document.createElement('div'), {
      className: 'page 404',
      innerHTML: `<h2>404 - Page Not Found</h2>`,
    });
  },
};
```

Route handlers must return an `HTMLElement`. If the returned element is not a `Route` instance, a warning is logged.

### Features

- **Parameterized paths** — segments prefixed with `:` are captured as params (e.g. `/users/:id`).
- **`/404` fallback** — rendered when no route matches.
- **Link interception** — clicks on any `<a>` whose `hostname` matches `window.location.hostname` are intercepted and handled as client-side navigations.
- **Hash scrolling** — after navigation, scrolls to the element matching `window.location.hash`, or to the top of the page.
- **`BASE_URL` support** — strips Vite's `import.meta.env.BASE_URL` prefix from pathnames before matching.

### API

**`constructor(routes, state)`**  
- `routes` — plain object mapping path strings to async handler functions.
- `state` — initial shared state passed down to all route components.

**`setState(newState)`**  
Updates the router's state and propagates it to all direct children that implement `setState`.

**`navigateTo(path)`**  
Pushes `path` to the History stack and triggers a re-render.

**`matchRoute(pathname)`**  
Returns `[handlerFn, params]` for the best matching route, or `null` if none matches.

---

## `util`

```js
import { debounce } from 'awcf/util';

const handler = debounce(() => doSomething(), 200);
```

**`debounce(callback, wait)`** — returns a debounced version of `callback` that delays invocation by `wait` milliseconds.

---

## `vite-plugin-sw` — Service Worker Pre-cache Plugin

After a Vite build, this plugin scans the output directory and injects the file list into your `sw.js`, replacing the `// This is populated with the build step.` placeholder. It also bumps `OFFLINE_VERSION` to the current timestamp to force cache invalidation.

```js
// vite.config.js
import { populateServiceWorkerPreCache } from 'awcf/vite-plugin-sw';

export default {
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [populateServiceWorkerPreCache()],
};
```

Your `public/sw.js` should contain placeholders like:

```js
const OFFLINE_VERSION = 1;
const PRECACHE_URLS = [
  // This is populated with the build step.
];
```

---

## Setup

### 1. Initialize project

```sh
mkdir your-project && cd your-project
npm init -y
npm pkg set type="module"
npm pkg set scripts.start="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
npm i awcf
npm i -D vite
```

### 2. `vite.config.js`

```js
import { populateServiceWorkerPreCache } from 'awcf/vite-plugin-sw';

export default {
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [populateServiceWorkerPreCache()],
};
```

### 3. `src/index.html`

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root">Loading...</div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

### 4. Create a route component

```js
// src/routes/Home/index.js
import Route from 'awcf/Route';

class Home extends Route {
  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    this.innerHTML = `<h1>Welcome</h1>`;
  }
}

customElements.define('x-home', Home);
export default Home;
```

### 5. Define your routes map

```js
// src/routes.js
export default {
  '/': async (router) => {
    const { default: Home } = await import('./routes/Home');
    return new Home(router);
  },
  '/404': async () => {
    return Object.assign(document.createElement('div'), {
      className: 'page 404',
      innerHTML: `<h2>404 - Not Found</h2><a href="/">Go home</a>`,
    });
  },
};
```

### 6. Bootstrap the app

```js
// src/main.js
import Router from 'awcf/Router';

const main = async () => {
  const root = document.getElementById('root');
  const state = {};
  const routes = await import('./routes').then(m => m.default);
  const router = new Router(routes, state);

  root.innerHTML = '';
  root.appendChild(router);
};

window.addEventListener('load', main);
```

---

## Testing

Tests use Node.js's built-in test runner with [jsdom](https://github.com/jsdom/jsdom) for a DOM environment:

```sh
node --test src/*.spec.js
```
