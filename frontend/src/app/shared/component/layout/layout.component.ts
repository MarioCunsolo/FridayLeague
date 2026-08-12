import { Component, DestroyRef, DOCUMENT, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from '../../service/auth.service';
import { LegaService } from '../../service/lega.service';
import { MatchService } from '../../service/match.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Uuid } from '../../../models/api/core.models';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule, NzSelectModule, FormsModule]
})
export class LayoutComponent {
  public authService = inject(AuthService);
  private legaService = inject(LegaService);
  private matchService = inject(MatchService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  currentTheme = signal<'dark' | 'light'>('dark');
  isMobileMenuOpen = signal<boolean>(false);
  isChangingLeague = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  constructor() {
    // Apply theme to the DOM whenever the signal changes
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.currentTheme());
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

    // Ricarica le partite della lega attiva dal backend al login e ad ogni cambio lega
    effect(() => {
      const legaId = this.authService.currentUser()?.legaId;
      if (legaId) {
        this.matchService.loadMatches().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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

  onLeagueChange(idLega: Uuid): void {
    if (this.isChangingLeague() || idLega === this.authService.currentUser()?.legaId) return;
    this.isChangingLeague.set(true);
    this.legaService.cambiaLega(idLega).subscribe({
      next: () => {
        this.isChangingLeague.set(false);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.isChangingLeague.set(false);
        this.message.error('Impossibile cambiare lega. Riprova.');
      }
    });
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
