// ==========================
// supabase.js（Supabase 用 正しい版）
// ==========================

// ① Supabase のクライアント作成

const supabase = window.supabase.createClient(
  "https://pphwdbxacalkjobjdmhf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaHdkYnhhY2Fsa2pvYmpkbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTc3MDUsImV4cCI6MjA4MDUzMzcwNX0.OF6fzndDhtmrjUn_o9Jg5Fne9eHwSnWzfFT49_Iv6h0"
);

// ② 匿名ログイン（Supabase Auth）
async function signIn() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) console.error("匿名ログイン失敗:", error);
}

signIn();

// ③ strokes（描画線）を保存
export async function saveStroke(stroke) {
  const { error } = await supabase.from("strokes").insert(stroke);
  if (error) console.error("stroke 保存エラー:", error);
}

// ④ stickies（ふせん）を保存
export async function saveSticky(sticky) {
  const { error } = await supabase.from("stickies").insert(sticky);
  if (error) console.error("sticky 保存エラー:", error);
}

// ⑤ strokes のリアルタイム購読
export function onStrokeChange(callback) {
  supabase
    .channel("strokes-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "strokes" }, payload => {
      callback(payload.new);
    })
    .subscribe();
}

// ⑥ stickies のリアルタイム購読
export function onStickyChange(callback) {
  supabase
    .channel("stickies-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "stickies" }, payload => {
      callback(payload.new);
    })
    .subscribe();
}
