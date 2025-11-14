# awcf (A Web Component Framework)

`awcf` is a silly experiment, not a _real_ framework. Use at your own risk.

## Purpose

## Core Modules

### Router (`Router.js`)

```javascript
import Router from 'awcf/Router';
import Home from './routes/Home';

const routes = {
  '/': async (state) => {
    return new Home(state);
  },
  '/404': async () => {
    return Object.assign(document.createElement('div'), {
      className: 'page 404',
      innerHTML: `
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <a href="/" class="button primary">Go to Home</a>
      `,
    });
  },
};

const state = {};
const router = new Router(routes, state);

const root = document.getElementById('root');
root.appendChild(router);

// Update all components with new state
// router.setState(newState);
```

**Features:**
- Dynamic component loading
- Centralized state management
- Async route handling
- Component lifecycle management

### Service Worker (`register-sw.js`)

Progressive Web App functionality:

```javascript
import 'awcf/register-sw';
// Automatically registers service worker
```

**Features:**
- Automatic service worker registration
- Cache management strategies
- Offline functionality
- Update notifications

### Build Integration (`vite-plugin-sw.js`)

Vite plugin for service worker integration:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { swPlugin } from 'awcf/vite-plugin-sw';

export default defineConfig({
  plugins: [swPlugin()],
});
```

## File Structure

```
sdk/
├── Router.js           # Component mounting system
├── register-sw.js      # Service worker registration
├── vite-plugin-sw.js  # Vite service worker plugin
└── package.json       # Dependencies and peer deps
```

## Basic Setup

### Initialize project and add dependencies

```sh
mkdir your-project
cd your-project
npm init -y
npm pkg delete main description keywords author license
npm pkg set type="module"
npm pkg set scripts.start="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
npm i awcf
npm i -D vite
```

Your `package.json` should look something like:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "awcf": "^1.0.0"
  },
  "devDependencies": {
    "vite": "^7.1.9"
  }
}
```

### Create your `vite.config.js`

```js
// vite.config.js
import { populateServiceWorkerPreCache } from 'awcf/vite-plugin-sw.js';

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

### Create `src/index.html` and load your `main.js`

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root">Loading interface...</div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

### Create routes

```js
// src/routes/Home/index.js
class Home extends HTMLElement {
  constructor(state = {}) {
    super();
    this.state = state;
    this.classList.add('page');
  }

  setState(state) {
    this.state = state;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = ``;
  }
}

customElements.define('x-home', Home);
export default Home;
```

### Create routes map

```js
// src/routes.js
export default {
  '/': async (state) => {
    const { default: Home } = await import('./routes/Home');
    return new Home(state);
  },
  '/example': async (state) => {
    const { default: Example } = await import('./routes/Example');
    return new Example(state);
  },
  '/404': async (state) => {
    return Object.assign(document.createElement('div'), {
      className: 'page 404',
      innerHTML: `
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <a href="/" class="button primary">Go to Home</a>
      `,
    });
  },
};
```

### Set up the `Router`

```javascript
// src/main.js
import 'awcf/register-sw';
import Router from 'awcf/Router';

const main = async () => {
  const root = document.getElementById('root');
  const state = { user };
  const routes = await import('./routes').then(m => m.default);
  const router = new Router(routes, state);

  root.innerHTML = '';
  root.appendChild(router);

  // router.setState(state);
};

window.addEventListener('load', main);
```
