export class ImageProcessor {
  constructor(canvas, uiControls) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiControls = uiControls;
  }

  async applyBlur(selectedRect, imageData, onSuccess) {
    if (!selectedRect) {
      this.uiControls.showError('ぼかす領域を選択してください');
      return null;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectedRect.width;
    tempCanvas.height = selectedRect.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
      this.canvas,
      selectedRect.x, selectedRect.y, selectedRect.width, selectedRect.height,
      0, 0, selectedRect.width, selectedRect.height
    );

    this.uiControls.showProcessingIndicator();

    try {
      const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
      const formData = new FormData();
      formData.append('image', blob);

      const response = await fetch('/apply_blur', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ぼかし処理中にエラーが発生しました');
      }

      const blurredBlob = await response.blob();
      const blurredImage = await this.createImageFromBlob(blurredBlob);
      
      this.ctx.putImageData(imageData, 0, 0);
      this.ctx.drawImage(blurredImage, selectedRect.x, selectedRect.y);
      
      const newImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.uiControls.hideProcessingIndicator();
      this.uiControls.enableButtons();
      
      if (onSuccess) {
        onSuccess(newImageData);
      }
      
      return newImageData;
    } catch (error) {
      console.error('Error:', error);
      this.uiControls.showError(error.message);
      this.uiControls.hideProcessingIndicator();
      return null;
    }
  }

  createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('画像の読み込みに失敗しました'));
      };
      img.src = url;
    });
  }

  loadImage(imgSrc, isInitialLoad = false) {
    return new Promise((resolve, reject) => {
      const newImg = new Image();
      newImg.onload = () => {
        this.canvas.width = newImg.width;
        this.canvas.height = newImg.height;
        this.ctx.drawImage(newImg, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        if (isInitialLoad) {
          this.uiControls.disableAllButtons();
        }
        
        resolve({
          imageData,
          scale: this.canvas.width / this.canvas.getBoundingClientRect().width
        });
      };
      newImg.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      newImg.src = imgSrc;
    });
  }
}