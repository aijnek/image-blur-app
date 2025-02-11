// スタックブラー関数
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

// ぼかし効果を適用する関数
function applyBlurEffect(sx, sy, width, height) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  const imageData = window.imageLoader.baseCtx.getImageData(sx, sy, width, height);
  tempCtx.putImageData(imageData, 0, 0);
  const radius = 10;
  const iterations = 3;
  for (let i = 0; i < iterations; i++) {
    const pixels = tempCtx.getImageData(0, 0, width, height);
    stackBlur(pixels.data, width, height, radius);
    tempCtx.putImageData(pixels, 0, 0);
  }
  window.imageLoader.baseCtx.drawImage(tempCanvas, 0, 0, width, height, sx, sy, width, height);
  window.historyManager.addToHistory(window.imageLoader.baseCtx.getImageData(0, 0, window.imageLoader.baseCanvas.width, window.imageLoader.baseCanvas.height));
  window.imageLoader.ctx.drawImage(window.imageLoader.baseCanvas, 0, 0);
  console.log('Blur effect applied successfully.');
}

// グローバルに公開
window.imageEffects = {
  applyBlurEffect
};