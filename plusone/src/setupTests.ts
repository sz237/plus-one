import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 3000 });

// Polyfill TextEncoder/Decoder if missing (Node + jsdom)
import { TextEncoder, TextDecoder } from 'node:util';
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder;
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder as any;