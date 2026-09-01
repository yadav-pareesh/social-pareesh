import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: jest.fn(), writable: true });
Object.defineProperty(window, 'alert', { value: jest.fn(), writable: true });
Object.defineProperty(window, 'confirm', { value: jest.fn(() => true), writable: true });
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: class { observe() {} disconnect() {} unobserve() {} },
});