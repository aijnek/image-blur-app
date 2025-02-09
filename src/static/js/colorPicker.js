export class ColorPicker {
  constructor() {
    this.selectedColor = '#FF0000';
    this.initializeUI();
    this.setupEventListeners();
  }

  initializeUI() {
    this.selectedColorSample = document.getElementById('selectedColorSample');
    this.colorDropdown = document.getElementById('colorDropdown');
    this.selectedColorSample.style.backgroundColor = this.selectedColor;
  }

  setupEventListeners() {
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.color-select-container')) {
        this.colorDropdown.classList.remove('show');
      }
    });
  }

  toggleDropdown() {
    this.colorDropdown.classList.toggle('show');
  }

  selectColor(color) {
    this.selectedColor = color;
    this.selectedColorSample.style.backgroundColor = color;
    this.colorDropdown.classList.remove('show');
  }

  getSelectedColor() {
    return this.selectedColor;
  }
}