import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * @param value - the content or URL
   * @param type - 'html' for innerHTML, 'url' for iframe/src
   */
  transform(value: string | null | undefined, type: 'html' | 'url' = 'html'): SafeHtml | SafeResourceUrl | null {
    if (!value) return null;

    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        return null;
    }
  }
}
