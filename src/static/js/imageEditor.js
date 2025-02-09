import { ColorPicker } from './colorPicker.js';
import { UIControls } from './uiControls.js';
import { ImageProcessor } from './imageProcessing.js';

export class ImageEditor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error('キャンバス要素が見つかりません');
    }

    this.ctx = this.canvas.getContext('2d');
    this.initializeComponents();
    this.initializeState();
    this.setupEventListeners();
  }

  initializeComponents() {
    this.uiControls = new UIControls();
    this.colorPicker = new ColorPicker();
    this.imageProcessor = new ImageProcessor(this.canvas, this.uiControls);
  }

  initializeState() {
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.imageData = null;
    this.originalImageData = null;
    this.selectedRect = null;
    this.imageHistory = [];
    this.scale = 1;
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  getScaledCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.scale,
      y: (e.clientY - rect.top) * this.scale
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const coords = this.getScaledCoordinates(e);
    this.startX = coords.x;
    this.startY = coords.y;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.selectedRect = null;
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    const coords = this.getScaledCoordinates(e);
    this.currentX = coords.x;
    this.currentY = coords.y;
    
    this.ctx.putImageData(this.imageData, 0, 0);
    
    // 選択された色で実線を描画
    this.ctx.strokeStyle = this.colorPicker.getSelectedColor();
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.rect(this.startX, this.startY, this.currentX - this.startX, this.currentY - this.startY);
    this.ctx.stroke();
  }

  async stopDrawing() {
    if (this.isDrawing) {
      this.selectedRect = {
        x: Math.min(this.startX, this.currentX),
        y: Math.min(this.startY, this.currentY),
        width: Math.abs(this.currentX - this.startX),
        height: Math.abs(this.currentY - this.startY)
      };
      
      this.ctx.putImageData(this.imageData, 0, 0);
      
      if (this.selectedRect.width > 0 && this.selectedRect.height > 0) {
        await this.applyBlur();
      }
    }
    this.isDrawing = false;
  }

  async applyBlur() {
    const newImageData = await this.imageProcessor.applyBlur(
      this.selectedRect,
      this.imageData,
      (updatedImageData) => {
        this.imageHistory.push(this.imageData);
        this.imageData = updatedImageData;
      }
    );

    if (newImageData) {
      this.imageData = newImageData;
    }
  }

  clearCanvas() {
    if (this.originalImageData) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.selectedRect = null;
      
      this.imageHistory = [];
      this.uiControls.disableAllButtons();
    }
  }

  undoLastAction() {
    if (this.imageHistory.length > 0) {
      const lastState = this.imageHistory.pop();
      this.ctx.putImageData(lastState, 0, 0);
      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      this.uiControls.updateButtonStates(this.imageHistory.length > 0);
    }
  }

  handleResize() {
    this.scale = this.canvas.width / this.canvas.getBoundingClientRect().width;
  }

  async loadImage(imgSrc, isInitialLoad = false) {
    try {
      const { imageData, scale } = await this.imageProcessor.loadImage(imgSrc, isInitialLoad);
      this.imageData = imageData;
      this.scale = scale;
      
      if (isInitialLoad) {
        this.originalImageData = imageData;
        this.imageHistory = [];
      }
    } catch (error) {
      this.uiControls.showError(error.message);
    }
  }

  downloadImage(fileName) {
    this.uiControls.downloadImage(this.canvas, fileName);
  }
}