import { Component } from '@angular/core';

@Component({
  selector: 'app-grid-shape',
  imports: [],
  templateUrl: './grid-shape.component.html',
  styles: [`
    .grid-background-top,
    .grid-background-bottom {
      height: 100%;
      background-image: 
        linear-gradient(rgba(70, 95, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(70, 95, 255, 0.1) 1px, transparent 1px);
      background-size: 30px 30px;
      opacity: 0.5;
    }
  `]
})
export class GridShapeComponent {

}
