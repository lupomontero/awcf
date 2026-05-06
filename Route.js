import Component from './Component.js';
import Router from './Router.js';

class Route extends Component {
  constructor(router, params = {}, defaultClass = 'page') {
    if (!(router instanceof Router)) {
      throw new Error('First argument to Route constructor must be an instance of Router');
    }

    super(router.state);
    this.router = router;
    this.params = params;

    if (defaultClass) {
      this.classList.add(defaultClass);
    }
  }

  // connectedCallback() {
  //   // ...
  // }

  // disconnectedCallback() {
  //   // ...
  // }

  navigateTo(path) {
    const { router } = this;

    if (!router) {
      console.warn('Router instance not found. Make sure to set the router property on the Route component.');
      return;
    }

    router.navigateTo(path);
  }
}

export default Route;
