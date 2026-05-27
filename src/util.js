// Source - https://stackoverflow.com/a/75988895
// Posted by Mr. Polywhirl, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-06, License - CC BY-SA 4.0

export const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
}

export const isPlainObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};
