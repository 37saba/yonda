// sticky.js
import { rtdb } from "./firebase.js";

/*
  使い方：
  - initStickySync() をアプリ起動時に呼ぶと DB の stickies を監視して自動生成します。
  - createLocalSticky(data) を呼べばローカルで新規作成して DB に push します。
*/

export function initStickySync() {
  // 既存 DB のあるものを作る（child_added で作る）
  rtdb.ref("stickies").on("child_added", (snap) => {
    const id = snap.key;
    const d = snap.val() || {};
    // 既に DOM にあれば skip（重複対策）
    if (document.querySelector(`[data-sticky-id="${id}"]`)) return;
    createStickyFromData(id, d);
  });

  // 変更を反映
  rtdb.ref("stickies").on("child_changed", (snap) => {
    const id = snap.key;
    const d = snap.val() || {};
    const el = document.querySelector(`[data-sticky-id="${id}"]`);
    if (!el) return;
    applyDataToSticky(el, d);
  });

  // 削除
  rtdb.ref("stickies").on("child_removed", (snap) => {
    const id = snap.key;
    const el = document.querySelector(`[data-sticky-id="${id}"]`);
    if (el) el.remove();
  });
}
// === 最小化ボタン ===
minBtn.addEventListener("click", () => {
  stickyData.minimized = !stickyData.minimized;

  if (stickyData.minimized) {
    // クラス付与
    sticky.classList.add("minimized");

    // 元サイズ保存
    sticky.dataset.prevWidth = sticky.style.width;
    sticky.dataset.prevHeight = sticky.style.height;

    // 縦線化
    sticky.style.width = "6px";
    sticky.style.height = sticky.dataset.prevHeight || "140px";

  } else {
    // 展開
    sticky.classList.remove("minimized");

    sticky.style.width = sticky.dataset.prevWidth || "200px";
    sticky.style.height = sticky.dataset.prevHeight || "140px";
  }

  updateSticky(stickyData.id, { minimized: stickyData.minimized });
});


// === 縦線クリックで展開 ===
sticky.addEventListener("click", (e) => {
  // 最小化時だけ反応
  if (!stickyData.minimized) return;

  // 展開処理
  stickyData.minimized = false;
  sticky.classList.remove("minimized");

  sticky.style.width = sticky.dataset.prevWidth || "200px";
  sticky.style.height = sticky.dataset.prevHeight || "140px";

  updateSticky(stickyData.id, { minimized: false });

  e.stopPropagation();
});


export function createLocalSticky(init = {}) {
  // push to DB; listeners will create DOM
  const ref = rtdb.ref("stickies").push();
  const id = ref.key;
  const data = {
    x: init.x || 60,
    y: init.y || 60,
    width: init.width || 180,
    height: init.height || Math.floor((init.width || 180) * 0.6),
    color: init.color || "#fff475",
    text: init.text || "",
    minimized: !!init.minimized,
    createdAt: Date.now()
  };
  ref.set(data);
  return id;
}

/* ====== internal helpers ====== */

function createStickyFromData(id, data) {
  const s = document.createElement("div");
  s.className = "sticky-note";
  s.dataset.stickyId = id;

  // サイズ・位置・色
  s.style.left = (data.x || 60) + "px";
  s.style.top = (data.y || 60) + "px";
  s.style.width = (data.width || 180) + "px";
  s.style.height = (data.height || 110) + "px";
  s.style.background = data.color || "#fff475";

  // header (toggle + close)
  const header = document.createElement("div");
  header.className = "sticky-header";
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "sticky-toggle";
  toggleBtn.type = "button";
  toggleBtn.textContent = "−";
  const closeBtn = document.createElement("button");
  closeBtn.className = "sticky-close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  header.appendChild(toggleBtn);
  header.appendChild(closeBtn);
  s.appendChild(header);

  // content
  const content = document.createElement("div");
  content.className = "sticky-content";
  content.contentEditable = true;
  content.innerHTML = data.text || "";
  s.appendChild(content);

  // add to document
  document.body.appendChild(s);

  // apply minimized if present
  applyDataToSticky(s, data);

  // --- toggle (minimize / restore) ---
  toggleBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const isMin = s.classList.toggle("minimized");
    // if minimized, hide content, else show
    if (isMin) {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
    // persist
    rtdb.ref("stickies/" + id).update({ minimized: isMin });
  });

  // clicking the minimized strip should also restore
  s.addEventListener("click", (ev) => {
    // if minimized and click anywhere on the note -> restore
    if (s.classList.contains("minimized")) {
      s.classList.remove("minimized");
      content.style.display = "block";
      rtdb.ref("stickies/" + id).update({ minimized: false });
    }
  });

  // close
  closeBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    rtdb.ref("stickies/" + id).remove();
    s.remove();
  });

  // drag (header only)
  let dragging = false, ox = 0, oy = 0;
  header.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    dragging = true;
    const rect = s.getBoundingClientRect();
    ox = ev.clientX - rect.left;
    oy = ev.clientY - rect.top;
    header.setPointerCapture(ev.pointerId);
  });
  document.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    s.style.left = (ev.clientX - ox) + "px";
    s.style.top = (ev.clientY - oy) + "px";
  });
  document.addEventListener("pointerup", (ev) => {
    if (!dragging) return;
    dragging = false;
    // save pos
    rtdb.ref("stickies/" + id).update({
      x: parseInt(s.style.left, 10) || 0,
      y: parseInt(s.style.top, 10) || 0
    });
  });

  // resize handle (simple bottom-right handle)
  const rh = document.createElement("div");
  rh.className = "sticky-resize";
  s.appendChild(rh);
  let resizing = false, startW=0, startH=0, startX=0, startY=0;
  rh.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    resizing = true;
    startW = s.offsetWidth;
    startH = s.offsetHeight;
    startX = ev.clientX; startY = ev.clientY;
    rh.setPointerCapture(ev.pointerId);
  });
  document.addEventListener("pointermove", (ev) => {
    if (!resizing) return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    s.style.width = Math.max(60, startW + dx) + "px";
    s.style.height = Math.max(40, startH + dy) + "px";
  });
  document.addEventListener("pointerup", (ev) => {
    if (!resizing) return;
    resizing = false;
    rtdb.ref("stickies/" + id).update({
      width: s.offsetWidth,
      height: s.offsetHeight
    });
  });

  // edit text -> save
  content.addEventListener("input", () => {
    rtdb.ref("stickies/" + id).update({ text: content.innerHTML });
  });
}

function applyDataToSticky(el, data) {
  if (!el) return;
  if (data.x !== undefined) el.style.left = data.x + "px";
  if (data.y !== undefined) el.style.top = data.y + "px";
  if (data.width !== undefined) el.style.width = data.width + "px";
  if (data.height !== undefined) el.style.height = data.height + "px";
  if (data.color !== undefined) el.style.background = data.color;
  const content = el.querySelector(".sticky-content");
  if (content && data.text !== undefined) content.innerHTML = data.text;
  // minimized
  if (data.minimized) {
    el.classList.add("minimized");
    if (content) content.style.display = "none";
  } else {
    el.classList.remove("minimized");
    if (content) content.style.display = "block";
  }
}
