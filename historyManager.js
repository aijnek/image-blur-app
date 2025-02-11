// DOM要素
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');

// 履歴スタック
let historyStack = [];

// 履歴の初期化
function initHistory(initialState) {
  historyStack = [initialState];
}

// 履歴に状態を追加
function addToHistory(state) {
  historyStack.push(state);
}

// Undoボタンの処理
undoBtn.addEventListener('click', function() {
  if (historyStack.length > 1) {
    historyStack.pop();
    const previousState = historyStack[historyStack.length - 1];
    window.imageLoader.baseCtx.putImageData(previousState, 0, 0);
    window.imageLoader.ctx.drawImage(window.imageLoader.baseCanvas, 0, 0);
    console.log('Undo applied.');
  } else {
    console.log('これ以上Undoできません。');
  }
});

// クリアボタンの処理
clearBtn.addEventListener('click', function() {
  if (historyStack.length > 0) {
    window.imageLoader.baseCtx.putImageData(historyStack[0], 0, 0);
    window.imageLoader.ctx.drawImage(window.imageLoader.baseCanvas, 0, 0);
    historyStack = [historyStack[0]];
    console.log('クリア：初期状態に戻しました。');
  }
});

// グローバルに公開
window.historyManager = {
  initHistory,
  addToHistory
};