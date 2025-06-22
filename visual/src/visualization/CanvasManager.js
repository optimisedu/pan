export class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth * 0.8;
        this.canvas.height = window.innerHeight * 0.8;
    }

    clear() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCircle(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGlowLayers(x, y, hue, saturation, lightness) {
        for (let i = 5; i >= 0; i--) {
            this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.1 - i * 0.015})`;
            this.drawCircle(x, y, 20 + i * 5);
        }
    }

    drawConnectingLine(x1, y1, x2, y2, hue, saturation, lightness) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawHeightIndicator(centerX, centerY, positionY, hue, saturation, lightness) {
        const lineHeight = 100;
        const startY = centerY - lineHeight / 2;
        const endY = centerY + lineHeight / 2;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(centerX, startY);
        this.ctx.lineTo(centerX, endY);
        this.ctx.stroke();

        this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.drawCircle(centerX, positionY, 5);
    }

    drawInfoSection(title, x, y, values) {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(title, x, y);
        this.ctx.font = '14px Arial';
        values.forEach((value, index) => {
            this.ctx.fillText(value, x + 10, y + 20 + (index * 20));
        });
    }

    drawVisualizationBars(dataArray, bufferLength, currentDetailLevel) {
        const barWidth = (this.canvas.width / bufferLength) * currentDetailLevel;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] * 2;
            const hue = (i / bufferLength) * 360;
            
            this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth;
        }
    }
}
