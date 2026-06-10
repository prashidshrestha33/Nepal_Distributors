import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { HomepageService } from './services/homepage.service';
import { of } from 'rxjs';

describe('App', () => {
  let mockHomepageService: any;

  beforeEach(async () => {
    mockHomepageService = {
      getHomepageData: () => of({
        heroBanners: [{ imageUrl: '', caption: 'Test Banner', displayOrder: 1 }],
        aboutUs: { imageUrl: '', description: 'Test About' },
        services: [],
        categories: [],
        products: [],
        brands: [],
        contactInfo: {}
      })
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: HomepageService, useValue: mockHomepageService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('NEPAL DISTRIBUTORS');
  });
});
