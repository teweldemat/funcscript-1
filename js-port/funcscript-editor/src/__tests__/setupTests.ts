import '@testing-library/jest-dom/vitest';

const rangePrototype = typeof Range !== 'undefined' ? Range.prototype : undefined;

if (rangePrototype && !rangePrototype.getClientRects) {
  rangePrototype.getClientRects = () => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {}
  }) as any;
}

if (rangePrototype && !rangePrototype.getBoundingClientRect) {
  rangePrototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
}
