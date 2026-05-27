import Router from '../../src/Router.js';

const routes = {
  '/': async () => Object.assign(document.createElement('div'), {
    innerHTML: `
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/users/XYZ">User XYZ</a>
      </nav>
    `,
  }),
  '/about': async () => Object.assign(document.createElement('div'), {
    textContent: 'About Page',
  }),
  '/users/:id': async (_, params) => Object.assign(document.createElement('div'), {
    textContent: `User Page: ${params.id}`,
  }),
  '/404': async () => Object.assign(document.createElement('div'), {
    textContent: '404 Not Found',
  }),
};

const router = new Router(routes, {}, '/examples/router-minimal');
const root = document.getElementById('root');

root.appendChild(router);
