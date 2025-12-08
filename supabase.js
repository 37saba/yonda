// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON
);

// -----------------------
// STROKES（描画）
// -----------------------
export async function saveStroke(stroke) {
  const row = {
    id: stroke.id,
    user_id: "anon",
    mode: stroke.mode,
    color: stroke.color,
    size: stroke.size,
    segments: stroke.segments,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("strokes").insert(row);
  if (error) throw error;
}

export function onStrokeChange(callback) {
  supabase
    .channel("strokes-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "strokes",
      },
      payload => {
        callback(payload.new);
      }
    )
    .subscribe();
}

// -----------------------
// STICKIES（ふせん）
// -----------------------
export async function saveSticky(sticky) {
  const row = {
    id: sticky.id,
    user_id: "anon",
    text: sticky.text,
    left: sticky.left,
    top: sticky.top,
    width: sticky.width,
    height: sticky.height,
    color: sticky.color,
    textColor: sticky.textColor,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("stickies")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
}

export async function deleteSticky(id) {
  const { error } = await supabase.from("stickies").delete().eq("id", id);
  if (error) throw error;
}

export function onStickyChange(callback) {
  supabase
    .channel("stickies-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stickies",
      },
      payload => {
        callback(payload.new);
      }
    )
    .subscribe();
}
