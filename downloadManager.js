// DOM要素
const downloadBtn = document.getElementById('downloadBtn');

// 画像ダウンロードの処理
downloadBtn.addEventListener('click', function() {
  const fileInput = document.getElementById('fileInput');
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
  link.href = window.imageLoader.canvas.toDataURL();
  link.click();
  console.log(`Download initiated: ${newFileName}`);
});