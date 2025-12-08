const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON = window.SUPABASE_ANON;

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// サインイン（匿名 or OAuth）
export async function signInAnonymously(){
  const { data, error } = await supabase.auth.signInWithOAuth?.({ provider: 'anonymous' }).catch(()=>({error:'no-op'}));
  const userResp = await supabase.auth.getUser();
  if(userResp.error) { console.warn('getUser error', userResp.error); return null; }
  return userResp.data.user ?? null;
}

// 現在ユーザーID取得
async function getUserId(){
  try{
    const r = await supabase.auth.getUser();
    return r?.data?.user?.id ?? null;
  } catch(e){ return null; }
}

// -------------------- saveStroke --------------------
export async function saveStroke(stroke){
  if(!stroke || !stroke.id) stroke.id = crypto?.randomUUID?.() || (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
  const user_id = await getUserId();
  const row = {
    id: stroke.id,
    user_id: user_id,
    color: stroke.color ?? null,
    size: Number(stroke.size) || 0,
    mode: stroke.mode ?? null,
    segments: stroke.segments ?? [] // jsonb
  };
  const { data, error } = await supabase.from('strokes').upsert(row, { onConflict: 'id' });
  if(error) console.error('saveStroke error', error);
  return { data, error };
}

// -------------------- saveSticky --------------------
export async function saveSticky(sticky){
  if(!sticky || !sticky.id) sticky.id = crypto?.randomUUID?.() || (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
  const user_id = await getUserId();
  const row = {
    id: sticky.id,
    user_id: user_id,
    text: sticky.text ?? '',
    top: Number(sticky.top) || 0,
    left: Number(sticky.left) || 0,
    width: Number(sticky.width) || 0,
    height: Number(sticky.height) || 0,
    color: sticky.color ?? null,
    textColor: sticky.textColor ?? sticky.text_color ?? null
  };
  const { data, error } = await supabase.from('stickies').upsert(row, { onConflict: 'id' });
  if(error) console.error('saveSticky error', error);
  return { data, error };
}

// -------------------- deleteSticky --------------------
export async function deleteSticky(id){
  if(!id) return;
  const { data, error } = await supabase.from('stickies').delete().eq('id', id);
  if(error) console.error('deleteSticky error', error);
  return { data, error };
}

// -------------------- リアルタイム購読: strokes --------------------
export function onStrokeChange(cb){
  const chan = supabase.channel('realtime:strokes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'strokes' }, payload => {
      if(!payload) return;
      // INSERT / UPDATE のみ
      if(payload.new) cb(payload.new);
    })
    .subscribe();
  return chan;
}

// -------------------- リアルタイム購読: stickies --------------------
export function onStickyChange(cb){
  const chan = supabase.channel('realtime:stickies')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stickies' }, payload => {
      if(!payload) return;
      // INSERT / UPDATE のみ
      if(payload.new) cb(payload.new);
    })
    .subscribe();
  return chan;
}
