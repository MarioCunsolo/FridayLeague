import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  title = 'angular16-base';

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const preventMobileKeyboard = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.matches('.ant-picker-input input, .ant-picker input, input.ant-calendar-picker-input')) {
          target.setAttribute('inputmode', 'none');
          target.setAttribute('readonly', 'readonly');
        }
      };
      document.addEventListener('focusin', preventMobileKeyboard, true);
      document.addEventListener('touchstart', preventMobileKeyboard, true);
      document.addEventListener('click', preventMobileKeyboard, true);
    }
  }
}
