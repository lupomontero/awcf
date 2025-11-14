async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

async function detectSWUpdate() {
  const registration = await navigator.serviceWorker.ready;

  registration.addEventListener('updatefound', event => {
    const newSW = registration.installing;

    newSW.addEventListener('statechange', (event) => {
      console.log('New service worker state:', newSW.state);
      if (newSW.state == 'installed') {
        // New service worker is installed, but waiting activation
        if (navigator.serviceWorker.controller) {
          if (confirm('New version available. Do you want to update?')) {
            newSW.postMessage({ action: 'skipWaiting' });
          }
        } else {
          console.log('Content is now available offline!');
        }
      } else if (newSW.state == 'activated') {
        console.log('New service worker activated');
        // window.location.reload();
      }
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New service worker activated, reloading page...');
    // window.location.reload();
  });
}

if (import.meta.env.PROD) {
  registerServiceWorker();
  detectSWUpdate();
}
