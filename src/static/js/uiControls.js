export class UIControls {
  constructor() {
    this.initializeElements();
  }

  initializeElements() {
    this.undoButton = document.getElementById('undoButton');
    this.clearButton = document.getElementById('clearButton');
    this.downloadButton = document.getElementById('downloadButton');
    this.processingIndicator = document.getElementById('processingIndicator');
    this.errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    this.errorModal.show();
  }

  showProcessingIndicator() {
    this.processingIndicator.style.display = 'inline-flex';
  }

  hideProcessingIndicator() {
    this.processingIndicator.style.display = 'none';
  }

  updateButtonStates(hasHistory) {
    this.undoButton.disabled = !hasHistory;
    this.downloadButton.disabled = !hasHistory;
    this.clearButton.disabled = !hasHistory;
  }

  disableAllButtons() {
    this.undoButton.disabled = true;
    this.downloadButton.disabled = true;
    this.clearButton.disabled = true;
  }

  enableButtons() {
    this.undoButton.disabled = false;
    this.downloadButton.disabled = false;
    this.clearButton.disabled = false;
  }

  downloadImage(canvas, originalFileName) {
    const dataURL = canvas.toDataURL('image/png');
    
    const lastDotIndex = originalFileName.lastIndexOf('.');
    const newFileName = lastDotIndex !== -1
      ? originalFileName.substring(0, lastDotIndex) + '_blurred' + originalFileName.substring(lastDotIndex)
      : originalFileName + '_blurred';
    
    const link = document.createElement('a');
    link.download = newFileName;
    link.href = dataURL;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}