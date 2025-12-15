// Minimal ambient module declaration so TypeScript doesn't error when Leaflet
// is not installed locally (we have a CDN fallback at runtime).
declare module 'leaflet';

declare global {
  interface Window {
    L?: any;
  }
}

export {};
