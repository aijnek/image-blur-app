// DOM要素
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const selectedColorBtn = document.getElementById('selectedColorBtn');
let currentColor = 'red'; // 初期色

// カスタムドロップダウンの動作
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

// グローバルに公開
window.colorPicker = {
  getCurrentColor: () => currentColor
};