// Database Module — depends on js/supabase-config.js

function normalizeRooms(rooms) {
  return rooms.map(r => ({
    type: r.type || r.t,
    name: r.name || r.n,
    color: r.color || r.c,
    w: r.w, h: r.h, x: r.x, y: r.y,
    category: r.category || r.cat || 'existing'
  }));
}

function denormalizeRooms(rooms) {
  return rooms.map(r => ({
    t: r.type || r.t,
    n: r.name || r.n,
    c: r.color || r.c,
    w: r.w, h: r.h, x: r.x, y: r.y,
    cat: r.category || r.cat || 'existing'
  }));
}

function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

async function getFloorPlans() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('getFloorPlans:', error); return []; }
  return data || [];
}

async function getFloorPlan(id) {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('getFloorPlan:', error); return null; }
  return data;
}

async function createFloorPlan(name, plotWidth, plotDepth) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('floor_plans')
    .insert({
      user_id: session.user.id,
      name: name || 'Untitled Plan',
      plot_width: plotWidth || 50,
      plot_depth: plotDepth || 77,
      rooms: [],
      settings: {}
    })
    .select()
    .single();
  if (error) { console.error('createFloorPlan:', error); return null; }
  return data;
}

async function updateFloorPlan(id, rooms, settings) {
  const updateData = { rooms: normalizeRooms(rooms) };
  if (settings !== undefined) updateData.settings = settings;
  const { error } = await supabase
    .from('floor_plans')
    .update(updateData)
    .eq('id', id);
  if (error) { console.error('updateFloorPlan:', error); return false; }
  return true;
}

async function deleteFloorPlan(id) {
  const { error } = await supabase
    .from('floor_plans')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteFloorPlan:', error); return false; }
  return true;
}

async function duplicateFloorPlan(id) {
  const original = await getFloorPlan(id);
  if (!original) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('floor_plans')
    .insert({
      user_id: session.user.id,
      name: original.name + ' (Copy)',
      plot_width: original.plot_width,
      plot_depth: original.plot_depth,
      rooms: original.rooms,
      settings: original.settings,
      is_public: false,
      share_token: null
    })
    .select()
    .single();
  if (error) { console.error('duplicateFloorPlan:', error); return null; }
  return data;
}

async function getPublicPlan(shareToken) {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*, profiles(full_name)')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single();
  if (error) { console.error('getPublicPlan:', error); return null; }
  return data;
}

async function toggleShare(id, enable) {
  if (enable) {
    const plan = await getFloorPlan(id);
    const token = plan?.share_token || generateShareToken();
    const { error } = await supabase
      .from('floor_plans')
      .update({ is_public: true, share_token: token })
      .eq('id', id);
    if (error) { console.error('toggleShare:', error); return null; }
    return token;
  } else {
    const { error } = await supabase
      .from('floor_plans')
      .update({ is_public: false })
      .eq('id', id);
    if (error) { console.error('toggleShare:', error); return null; }
    return null;
  }
}
