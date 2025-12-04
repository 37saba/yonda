// ==========================
// strokes.js（ペン & 消しゴム 完全版）
// ==========================

import { rtdb } from "./firebase.js";
import { canvas } from "./canvas.js";

let currentColor = "#000000"; // ペン色
let currentSize = 3;          // 太さ
let mode = "pen";             // "pen" or "eraser"
let drawing = false;
let lastPos = null;

const clientId = Math.random().toString(36).substring(2);

export function initStrokeSync() {
  console.log("stroke sync ready");

  const ctx = canvas.getContext("2d");

  // -------- UI イベント --------
  document.getElementById("colorPicker").addEventListener("input", (e) => {
    currentColor = e.target.value;
  });

  document.getElementById("sizeInput").addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (!isNaN(v) && v > 0) currentSize = v;
  });

  // ペン
  document.getElementById("penBtn").addEventListener("click", () => {
    mode = "pen";
  });

  // 消しゴム
  document.getElementById("eraserBtn").addEventListener("click", () => {
    mode = "eraser";
  });

  // -------- 描画開始 --------
  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    lastPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const newPos = { x: e.clientX, y: e.clientY };

    // 消しゴムなら白色に変換
    const colorToUse = mode === "eraser" ? "#FFFFFF" : currentColor;

    // Firebase に送るデータ
    const stroke = {
      x1: lastPos.x / window.innerWidth,
      y1: lastPos.y / window.innerHeight,
      x2: newPos.x / window.innerWidth,
      y2: newPos.y / window.innerHeight,
      color: colorToUse,
      size: currentSize,
      mode: mode,
      clientId: clientId,
      createdAt: Date.now(),
    };

    rtdb.ref("strokes").push(stroke);

    drawStroke(stroke);

    lastPos = newPos;
  });

  // -------- 受信して描画 --------
  rtdb.ref("strokes").on("child_added", (snap) => {
    const s = snap.val();

    if (s.clientId === clientId) return;

    drawStroke(s);
  });
}

// -------- 共通描画 --------
function drawStroke(s) {
  const ctx = canvas.getContext("2d");

  // 消しゴムなら透明削除モード
  if (s.mode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = s.color;
  }

  ctx.lineWidth = s.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(s.x1 * window.innerWidth, s.y1 * window.innerHeight);
  ctx.lineTo(s.x2 * window.innerWidth, s.y2 * window.innerHeight);
  ctx.stroke();

  // 元に戻す
  ctx.globalCompositeOperation = "source-over";
}
