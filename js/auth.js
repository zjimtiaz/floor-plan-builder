// Auth Module — depends on js/supabase-config.js

async function requireAuth(options = {}) {
  if (options.shareParam) {
    const params = new URLSearchParams(window.location.search);
    if (params.get(options.shareParam)) return null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return profile;
}

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard.html' }
  });
  if (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}
