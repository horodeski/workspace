import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom (required by react-router-dom)
Object.assign(globalThis, { TextEncoder, TextDecoder });
