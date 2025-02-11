const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const editArea = document.getElementById('editArea');

// カラー関連
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const selectedColorBtn = document.getElementById('selectedColorBtn');
let currentColor = 'red'; // 初期色

let img = new Image();
let isDrawing = false;
let startX, startY, endX, endY;

// 累積編集用オフスクリーンキャンバスと履歴スタック
let baseCanvas, baseCtx;
let historyStack = [];

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
      historyStack = [];
      historyStack.push(baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height));
      ctx.drawImage(baseCanvas, 0, 0);
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(file);
});

// --- カスタムドロップダウンの動作 ---
dropdownToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  dropdownMenu.classList.toggle('show');
});
document.addEventListener('click', (event) => {
  const isClickInside =
    dropdownToggle.contains(event.target) ||
    dropdownMenu.contains(event.target);
  if (!isClickInside) {
    dropdownMenu.classList.remove('show');
  }
});
const swatches = document.querySelectorAll('.color-swatch');
swatches.forEach(swatch => {
  swatch.addEventListener('click', (e) => {
    currentColor = e.target.dataset.color;
    selectedColorBtn.style.backgroundColor = currentColor;
    dropdownMenu.classList.remove('show');
  });
});

// マウス押下で座標記録
canvas.addEventListener('mousedown', function(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  isDrawing = true;
});

// マウス移動で選択矩形を描画
canvas.addEventListener('mousemove', function(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  endX = (e.clientX - rect.left) * scaleX;
  endY = (e.clientY - rect.top) * scaleY;
  ctx.drawImage(baseCanvas, 0, 0);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 3;
  const sx = Math.min(startX, endX);
  const sy = Math.min(startY, endY);
  const sw = Math.abs(endX - startX);
  const sh = Math.abs(endY - startY);
  ctx.strokeRect(sx, sy, sw, sh);
});

// マウスリリース時に選択領域へぼかし処理を適用
canvas.addEventListener('mouseup', function(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const sx = Math.min(startX, endX);
  const sy = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  if (width === 0 || height === 0) {
    console.log('Selection rectangle has zero width or height. Abort blur operation.');
    return;
  }
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  const imageData = baseCtx.getImageData(sx, sy, width, height);
  tempCtx.putImageData(imageData, 0, 0);
  const radius = 10;
  const iterations = 3;
  for (let i = 0; i < iterations; i++) {
    const pixels = tempCtx.getImageData(0, 0, width, height);
    stackBlur(pixels.data, width, height, radius);
    tempCtx.putImageData(pixels, 0, 0);
  }
  baseCtx.drawImage(tempCanvas, 0, 0, width, height, sx, sy, width, height);
  historyStack.push(baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height));
  ctx.drawImage(baseCanvas, 0, 0);
  console.log('Blur effect applied successfully.');
});

// Undoボタンの処理
undoBtn.addEventListener('click', function() {
  if (historyStack.length > 1) {
    historyStack.pop();
    const previousState = historyStack[historyStack.length - 1];
    baseCtx.putImageData(previousState, 0, 0);
    ctx.drawImage(baseCanvas, 0, 0);
    console.log('Undo applied.');
  } else {
    console.log('これ以上Undoできません。');
  }
});

// クリアボタンの処理
clearBtn.addEventListener('click', function() {
  if (historyStack.length > 0) {
    baseCtx.putImageData(historyStack[0], 0, 0);
    ctx.drawImage(baseCanvas, 0, 0);
    historyStack = [historyStack[0]];
    console.log('クリア：初期状態に戻しました。');
  }
});

// 画像ダウンロードの処理
downloadBtn.addEventListener('click', function() {
  if (!fileInput.files[0]) return;

  // 元のファイル名を取得し、拡張子を分割
  const originalFileName = fileInput.files[0].name;
  const fileParts = originalFileName.split('.');
  const extension = fileParts.pop(); // 拡張子
  const baseName = fileParts.join('.'); // 拡張子を除いた部分

  // 新しいファイル名を作成
  const newFileName = `${baseName}_blurred.${extension}`;

  const link = document.createElement('a');
  link.download = newFileName;
  link.href = canvas.toDataURL();
  link.click();
  console.log(`Download initiated: ${newFileName}`);
});

// --- スタックブラー関数 ---
function stackBlur(pixels, width, height, radius) {
  const w4 = width << 2;
  for (let y = 0; y < height; y++) {
    let rsum = 0, gsum = 0, bsum = 0, asum = 0;
    let count = 0;
    for (let rx = -radius; rx <= radius; rx++) {
      let ix = Math.min(width - 1, Math.max(0, rx));
      let p = y * w4 + ix * 4;
      rsum += pixels[p];
      gsum += pixels[p + 1];
      bsum += pixels[p + 2];
      asum += pixels[p + 3];
      count++;
    }
    let p = y * w4;
    pixels[p] = (rsum / count) >>> 0;
    pixels[p + 1] = (gsum / count) >>> 0;
    pixels[p + 2] = (bsum / count) >>> 0;
    pixels[p + 3] = (asum / count) >>> 0;
    for (let x = 1; x < width; x++) {
      let leftIndex = x - radius - 1;
      if (leftIndex >= 0) {
        let pLeft = y * w4 + leftIndex * 4;
        rsum -= pixels[pLeft];
        gsum -= pixels[pLeft + 1];
        bsum -= pixels[pLeft + 2];
        asum -= pixels[pLeft + 3];
        count--;
      }
      let rightIndex = x + radius;
      if (rightIndex < width) {
        let pRight = y * w4 + rightIndex * 4;
        rsum += pixels[pRight];
        gsum += pixels[pRight + 1];
        bsum += pixels[pRight + 2];
        asum += pixels[pRight + 3];
        count++;
      }
      let pCurrent = y * w4 + x * 4;
      pixels[pCurrent] = (rsum / count) >>> 0;
      pixels[pCurrent + 1] = (gsum / count) >>> 0;
      pixels[pCurrent + 2] = (bsum / count) >>> 0;
      pixels[pCurrent + 3] = (asum / count) >>> 0;
    }
  }
  for (let x = 0; x < width; x++) {
    let rsum = 0, gsum = 0, bsum = 0, asum = 0;
    let count = 0;
    for (let ry = -radius; ry <= radius; ry++) {
      let iy = Math.min(height - 1, Math.max(0, ry));
      let p = iy * w4 + x * 4;
      rsum += pixels[p];
      gsum += pixels[p + 1];
      bsum += pixels[p + 2];
      asum += pixels[p + 3];
      count++;
    }
    let p = x * 4;
    pixels[p] = (rsum / count) >>> 0;
    pixels[p + 1] = (gsum / count) >>> 0;
    pixels[p + 2] = (bsum / count) >>> 0;
    pixels[p + 3] = (asum / count) >>> 0;
    for (let y = 1; y < height; y++) {
      let topIndex = y - radius - 1;
      if (topIndex >= 0) {
        let pTop = topIndex * w4 + x * 4;
        rsum -= pixels[pTop];
        gsum -= pixels[pTop + 1];
        bsum -= pixels[pTop + 2];
        asum -= pixels[pTop + 3];
        count--;
      }
      let bottomIndex = y + radius;
      if (bottomIndex < height) {
        let pBottom = bottomIndex * w4 + x * 4;
        rsum += pixels[pBottom];
        gsum += pixels[pBottom + 1];
        bsum += pixels[pBottom + 2];
        asum += pixels[pBottom + 3];
        count++;
      }
      let pCurrent = y * w4 + x * 4;
      pixels[pCurrent] = (rsum / count) >>> 0;
      pixels[pCurrent + 1] = (gsum / count) >>> 0;
      pixels[pCurrent + 2] = (bsum / count) >>> 0;
      pixels[pCurrent + 3] = (asum / count) >>> 0;
    }
  }
}