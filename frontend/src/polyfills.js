// Minimal polyfills for older Safari/iOS (e.g., 15.1) missing `.at`
// Ensures Array.prototype.at, String.prototype.at, and TypedArray .at exist.

(function () {
  if (typeof Object.defineProperty !== 'function') return;

  function defineAt(proto) {
    if (!proto || typeof proto.at === 'function') return;
    Object.defineProperty(proto, 'at', {
      // Spec-like behavior: supports negative indices
      value: function at(n) {
        const O = Object(this);
        const len = O.length >>> 0; // ToLength
        let k = Number(n);
        if (Number.isNaN(k)) k = 0;
        if (k < 0) k += len;
        if (k < 0 || k >= len) return undefined;
        // For String, ensure we return a string of the code point at position
        if (typeof O === 'string' || O instanceof String) {
          // Basic fallback: surrogate pairs may not be handled perfectly,
          // but this is sufficient for most UI usage.
          return String(O).charAt(k);
        }
        return O[k];
      },
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  // Arrays and Strings
  defineAt(Array.prototype);
  defineAt(String.prototype);

  // Typed arrays (guard existence for older engines)
  typeof Int8Array !== 'undefined' && defineAt(Int8Array.prototype);
  typeof Uint8Array !== 'undefined' && defineAt(Uint8Array.prototype);
  typeof Uint8ClampedArray !== 'undefined' && defineAt(Uint8ClampedArray.prototype);
  typeof Int16Array !== 'undefined' && defineAt(Int16Array.prototype);
  typeof Uint16Array !== 'undefined' && defineAt(Uint16Array.prototype);
  typeof Int32Array !== 'undefined' && defineAt(Int32Array.prototype);
  typeof Uint32Array !== 'undefined' && defineAt(Uint32Array.prototype);
  typeof Float32Array !== 'undefined' && defineAt(Float32Array.prototype);
  typeof Float64Array !== 'undefined' && defineAt(Float64Array.prototype);
  typeof BigInt64Array !== 'undefined' && defineAt(BigInt64Array.prototype);
  typeof BigUint64Array !== 'undefined' && defineAt(BigUint64Array.prototype);
})();

