let isDrawing = false;
let startX, startY, endX, endY;

// マウス押下で座標記録
window.imageLoader.canvas.addEventListener('mousedown', function(e) {
  const rect = window.imageLoader.canvas.getBoundingClientRect();
  const scaleX = window.imageLoader.canvas.width / rect.width;
  const scaleY = window.imageLoader.canvas.height / rect.height;
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  isDrawing = true;
});

// マウス移動で選択矩形を描画
window.imageLoader.canvas.addEventListener('mousemove', function(e) {
  if (!isDrawing) return;
  const rect = window.imageLoader.canvas.getBoundingClientRect();
  const scaleX = window.imageLoader.canvas.width / rect.width;
  const scaleY = window.imageLoader.canvas.height / rect.height;
  endX = (e.clientX - rect.left) * scaleX;
  endY = (e.clientY - rect.top) * scaleY;
  window.imageLoader.ctx.drawImage(window.imageLoader.baseCanvas, 0, 0);
  window.imageLoader.ctx.strokeStyle = window.colorPicker.getCurrentColor();
  window.imageLoader.ctx.lineWidth = 3;
  const sx = Math.min(startX, endX);
  const sy = Math.min(startY, endY);
  const sw = Math.abs(endX - startX);
  const sh = Math.abs(endY - startY);
  window.imageLoader.ctx.strokeRect(sx, sy, sw, sh);
});

// マウスリリース時に選択領域へぼかし処理を適用
window.imageLoader.canvas.addEventListener('mouseup', function(e) {
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
  window.imageEffects.applyBlurEffect(sx, sy, width, height);
});