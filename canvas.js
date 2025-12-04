// ==========================
// canvas.js（完全版）
// ==========================

export let canvas, ctx;

export function initCanvas() {
  canvas = document.getElementById("drawCanvas");
  ctx = canvas.getContext("2d");

  // CSS の見た目サイズを取得して内部サイズに合わせる
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  // 初期化時に1回実行
  resizeCanvas();

  // リサイズ時も常に合わせる
  window.addEventListener("resize", resizeCanvas);
}

