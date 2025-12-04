// ==========================
// firebase.js（Realtime DB 用 正しい版）
// ==========================

// ==== あなたの firebaseConfig をそのまま入れる ====
const firebaseConfig = {
  apiKey: "AIzaSyDZ2UDYp0iMp-9MtXk-HuoIsy6jcPCAHBw",
  authDomain: "yonda-3f85f.firebaseapp.com",
  databaseURL: "https://yonda-3f85f-default-rtdb.firebaseio.com",
  projectId: "yonda-3f85f",
  storageBucket: "yonda-3f85f.firebasestorage.app",
  messagingSenderId: "299265439268",
  appId: "1:299265439268:web:9667b9cb0f4d0f2ede8ab1",
  measurementId: "G-MGZD9YFWPT"
};

// ① Firebase 初期化
firebase.initializeApp(firebaseConfig);

// ② 匿名ログイン
firebase.auth().signInAnonymously().catch(err => {
  console.error("匿名ログイン失敗:", err);
});

// ③ Realtime Database の参照を export
export const rtdb = firebase.database();

