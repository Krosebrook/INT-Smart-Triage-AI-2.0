import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initAuthFlow } from '../src/portal/authFlow.js';

let dom;
let window;
let document;

function createDom() {
  dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div id="authScreen" style="display: none;">
        <form id="loginForm">
          <input id="loginEmail" type="email" />
          <input id="loginPassword" type="password" />
          <button type="submit">Sign In</button>
        </form>
      </div>
      <div id="portalApp" style="display: none;">
        <span id="userDisplay"></span>
      </div>
    </body>
  `, { url: 'http://localhost' });
  window = dom.window;
  document = window.document;
}

function createSupabaseMock({ sessionUser = null, signInUser = null, signInError = null, signUpError = null } = {}) {
  const auth = {
    lastSignIn: null,
    lastSignUp: null,
    signedOut: false,
    async getSession() {
      return {
        data: {
          session: sessionUser ? { user: sessionUser } : null
        }
      };
    },
    async signInWithPassword(credentials) {
      auth.lastSignIn = credentials;
      if (signInError) {
        return { data: null, error: { message: signInError } };
      }
      return { data: { user: signInUser || sessionUser || { email: credentials.email } }, error: null };
    },
    async signUp(credentials) {
      auth.lastSignUp = credentials;
      if (signUpError) {
        return { data: null, error: { message: signUpError } };
      }
      return { data: { user: { email: credentials.email } }, error: null };
    },
    async signOut() {
      auth.signedOut = true;
    }
  };

  return { auth };
}

beforeEach(() => {
  createDom();
});

afterEach(() => {
  dom.window.close();
});

test('checkAuth shows portal when Supabase session exists', async () => {
  const supabase = createSupabaseMock({ sessionUser: { email: 'agent@example.com' } });
  const controller = initAuthFlow({
    supabase,
    document,
    window,
    onPortalReady: () => {}
  });

  await controller.checkAuth();

  assert.equal(document.getElementById('portalApp').style.display, 'block');
  assert.equal(document.getElementById('authScreen').style.display, 'none');
  assert.equal(document.getElementById('userDisplay').textContent, 'agent@example.com');
});

test('skipAuth exposes guest user flow', () => {
  const supabase = createSupabaseMock();
  const controller = initAuthFlow({
    supabase,
    document,
    window,
    onPortalReady: () => {}
  });

  controller.skipAuth();

  assert.equal(document.getElementById('portalApp').style.display, 'block');
  assert.equal(controller.getCurrentUser().role, 'guest');
  assert.equal(document.getElementById('userDisplay').textContent, 'guest@example.com');
});

test('successful login updates the portal view and user context', async () => {
  const supabase = createSupabaseMock({ signInUser: { email: 'new.user@example.com' } });
  const alerts = [];
  let resolvePortal;
  const portalPromise = new Promise((resolve) => {
    resolvePortal = resolve;
  });

  const controller = initAuthFlow({
    supabase,
    document,
    window,
    onPortalReady: (user) => {
      resolvePortal(user);
    },
    alertFn: (message) => alerts.push(message)
  });

  document.getElementById('loginEmail').value = 'new.user@example.com';
  document.getElementById('loginPassword').value = 'secure-password';

  const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
  document.getElementById('loginForm').dispatchEvent(submitEvent);

  const user = await portalPromise;

  assert.equal(user.email, 'new.user@example.com');
  assert.equal(document.getElementById('portalApp').style.display, 'block');
  assert.equal(document.getElementById('authScreen').style.display, 'none');
  assert.equal(document.getElementById('userDisplay').textContent, 'new.user@example.com');
  assert.equal(alerts.length, 0, 'no alerts should be shown on successful login');
});
