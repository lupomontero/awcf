import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { isPlainObject } from './util.js';

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    assert.equal(isPlainObject({}), true);
    assert.equal(isPlainObject({ a: 1 }), true);
  });

  it('should return false for non-plain objects', () => {
    assert.equal(isPlainObject([]), false);
    assert.equal(isPlainObject(null), false);
    assert.equal(isPlainObject(undefined), false);
    assert.equal(isPlainObject(() => {}), false);
    assert.equal(isPlainObject(new Date()), false);
  });

  it('should return false for primitive types', () => {
    assert.equal(isPlainObject(42), false);
    assert.equal(isPlainObject('hello'), false);
    assert.equal(isPlainObject(true), false);
  });

  it('should return false for functions', () => {
    assert.equal(isPlainObject(function() {}), false);
    assert.equal(isPlainObject(() => {}), false);
  });
});