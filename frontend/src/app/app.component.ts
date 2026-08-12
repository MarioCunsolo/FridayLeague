import { ChangeDetectionStrategy, Component, DOCUMENT, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private preventMobileKeyboard?: (event: Event) => void;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.preventMobileKeyboard = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.matches('.ant-picker-input input, .ant-picker input, input.ant-calendar-picker-input')) {
          target.setAttribute('inputmode', 'none');
          target.setAttribute('readonly', 'readonly');
        }
      };
      this.document.addEventListener('focusin', this.preventMobileKeyboard, true);
      this.document.addEventListener('touchstart', this.preventMobileKeyboard, true);
      this.document.addEventListener('click', this.preventMobileKeyboard, true);
    }
  }

  ngOnDestroy(): void {
    if (!this.preventMobileKeyboard) return;
    this.document.removeEventListener('focusin', this.preventMobileKeyboard, true);
    this.document.removeEventListener('touchstart', this.preventMobileKeyboard, true);
    this.document.removeEventListener('click', this.preventMobileKeyboard, true);
  }
}
