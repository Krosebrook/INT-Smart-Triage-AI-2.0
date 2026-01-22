const runtimeEnv = typeof import !== 'undefined' && typeof import.meta !== 'undefined'
  ? (import.meta.env || {})
  : {};

const demoModeFlag = (runtimeEnv.VITE_DEMO_MODE || process.env.VITE_DEMO_MODE || process.env.DEMO_MODE) === 'true';
const demoEmail = runtimeEnv.VITE_DEMO_EMAIL || process.env.VITE_DEMO_EMAIL || '';
const demoPassword = runtimeEnv.VITE_DEMO_PASSWORD || process.env.VITE_DEMO_PASSWORD || '';
const demoProxyKey = runtimeEnv.VITE_DEMO_PROXY_KEY || process.env.VITE_DEMO_PROXY_KEY || process.env.DEMO_PROXY_KEY || '';

let currentSession = null;
let demoGuestMode = false;

export function setCurrentSession(session) {
  currentSession = session;
  if (session) {
    demoGuestMode = false;
  }
}

export function clearSession() {
  currentSession = null;
}

export function getCurrentSession() {
  return currentSession;
}

export function enableDemoGuestMode() {
  if (demoModeFlag) {
    demoGuestMode = true;
  }
}

export function disableDemoGuestMode() {
  demoGuestMode = false;
}

export function isDemoModeEnabled() {
  return demoModeFlag;
}

export function isGuestDemoMode() {
  return demoModeFlag && demoGuestMode && !currentSession;
}

export function getDemoCredentials() {
  return { email: demoEmail, password: demoPassword };
}

export function getDemoProxyKey() {
  return demoProxyKey;
}
