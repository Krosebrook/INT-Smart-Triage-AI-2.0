export function initAuthFlow({ supabase, document, window, onPortalReady, alertFn = (message) => window?.alert?.(message) }) {
  if (!supabase || !supabase.auth) {
    throw new Error('Supabase client with auth methods is required');
  }

  const state = {
    currentUser: null
  };

  const getAuthScreen = () => document.getElementById('authScreen');
  const getPortalApp = () => document.getElementById('portalApp');
  const getUserDisplay = () => document.getElementById('userDisplay');

  function showAuthScreen() {
    const authScreen = getAuthScreen();
    const portalApp = getPortalApp();

    if (authScreen) authScreen.style.display = 'block';
    if (portalApp) portalApp.style.display = 'none';
  }

  function showPortal() {
    const authScreen = getAuthScreen();
    const portalApp = getPortalApp();
    const userDisplay = getUserDisplay();

    if (authScreen) authScreen.style.display = 'none';
    if (portalApp) portalApp.style.display = 'block';

    if (userDisplay) {
      userDisplay.textContent = state.currentUser?.email || 'Guest User';
    }

    onPortalReady?.(state.currentUser);
  }

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        state.currentUser = session.user;
        showPortal();
      } else {
        state.currentUser = null;
        showAuthScreen();
      }
    } catch (error) {
      console.error('Auth session check failed:', error);
      showAuthScreen();
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    const email = emailInput?.value || '';
    const password = passwordInput?.value || '';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message?.includes('Invalid')) {
          const { error: signUpError } = await supabase.auth.signUp({ email, password });
          if (!signUpError) {
            alertFn?.('Account created! You can now sign in.');
          } else if (signUpError?.message) {
            alertFn?.(`Login error: ${signUpError.message}`);
          }
        } else {
          alertFn?.(`Login error: ${error.message}`);
        }
        return;
      }

      state.currentUser = data?.user || null;
      showPortal();
    } catch (authError) {
      console.error('Login attempt failed:', authError);
      alertFn?.('Login error: Unable to sign in at this time.');
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    state.currentUser = null;
    showAuthScreen();
  }

  function skipAuth() {
    state.currentUser = { email: 'guest@example.com', role: 'guest' };
    showPortal();
  }

  function getCurrentUser() {
    return state.currentUser;
  }

  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);

  if (window) {
    window.skipAuth = skipAuth;
    window.logout = logout;
  }

  return {
    checkAuth,
    showAuthScreen,
    showPortal,
    skipAuth,
    logout,
    getCurrentUser
  };
}
