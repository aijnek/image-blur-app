// DOM要素
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const editArea = document.getElementById('editArea');

// 基本変数
let img = new Image();
let baseCanvas, baseCtx;

// グローバルに公開
window.imageLoader = {
  canvas,
  ctx,
  baseCanvas: null,
  baseCtx: null,
  img
};

// 画像読み込み時の処理
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    img.onload = function() {
      editArea.style.display = 'block';
      canvas.width = img.width;
      canvas.height = img.height;
      baseCanvas = document.createElement('canvas');
      baseCanvas.width = img.width;
      baseCanvas.height = img.height;
      baseCtx = baseCanvas.getContext('2d');
      baseCtx.drawImage(img, 0, 0);
      
      // グローバルオブジェクトを更新
      window.imageLoader.baseCanvas = baseCanvas;
      window.imageLoader.baseCtx = baseCtx;
      
      window.historyManager.initHistory(baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height));
      ctx.drawImage(baseCanvas, 0, 0);
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(file);
});