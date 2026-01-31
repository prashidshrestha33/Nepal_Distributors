import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css']
})
export class ImageViewerComponent {

  @Input() imageUrl!: string;
  @Output() close = new EventEmitter<void>();

  scale = 1;
  translateX = 0;
  translateY = 0;

  isDragging = false;
  lastX = 0;
  lastY = 0;

  zoomIn() {
    this.scale = Math.min(this.scale + 0.2, 3);
  }

  zoomOut() {
    this.scale = Math.max(this.scale - 0.2, 1);
  }

  reset() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    this.translateX += event.clientX - this.lastX;
    this.translateY += event.clientY - this.lastY;

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
  }

  closeViewer() {
    this.close.emit();
  }
}
