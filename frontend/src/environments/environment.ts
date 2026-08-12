declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
    };
  }
}

const runtimeApiUrl = typeof window !== 'undefined' ? window.__env?.apiUrl : undefined;

export const environment = {
  production: true,
  apiUrl: runtimeApiUrl ?? 'https://api.lineup.it/api'
};
