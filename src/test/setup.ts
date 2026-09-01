import '@testing-library/jest-dom/vitest'

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}
