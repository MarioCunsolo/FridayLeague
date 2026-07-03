import { Component, signal, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule, NzSelectModule, FormsModule]
})
export class LayoutComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  currentTheme = signal<'dark' | 'light'>('dark');

  constructor() {
    // Apply theme whenever it changes
    effect(() => {
      const theme = this.currentTheme();
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    }
  }

  toggleTheme() {
    this.currentTheme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  onLeagueChange(idLega: number): void {
    this.authService.cambiaLega(idLega);
    // Reindirizziamo alla homepage per rinfrescare i dati della lega attiva
    this.router.navigate(['/']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Fallback: naviga comunque se il server dà errore (es. token già nullo)
        this.router.navigate(['/login']);
      }
    });
  }
}
