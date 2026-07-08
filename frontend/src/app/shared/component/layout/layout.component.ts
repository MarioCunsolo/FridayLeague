import { Component, signal, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from '../../service/auth.service';
import { LegaService } from '../../service/lega.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule, NzSelectModule, FormsModule]
})
export class LayoutComponent {
  public authService = inject(AuthService);
  private legaService = inject(LegaService);
  private router = inject(Router);

  currentTheme = signal<'dark' | 'light'>('dark');

  constructor() {
    // Apply theme to the DOM whenever the signal changes
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.currentTheme());
    });

    // Sync theme from logged-in user profile (highest priority),
    // then fall back to localStorage for guest/offline scenarios.
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.tema) {
        this.currentTheme.set(user.tema as 'dark' | 'light');
      } else {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
        if (savedTheme) this.currentTheme.set(savedTheme);
      }
    });
  }

  toggleTheme() {
    const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.currentTheme.set(newTheme);
    // Persist to localStorage immediately for instant UI feel
    localStorage.setItem('theme', newTheme);
    // Persist to backend if user is logged in
    if (this.authService.currentUser()) {
      this.authService.cambiaTema(newTheme).subscribe();
    }
  }

  onLeagueChange(idLega: number): void {
    this.legaService.cambiaLega(idLega);
    // Reindirizziamo alla homepage per rinfrescare i dati della lega attiva
    this.router.navigate(['/home']);
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
