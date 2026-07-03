import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../shared/service/auth.service';

@Component({
  selector: 'app-impostazioni-lega',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule],
  templateUrl: './impostazioni-lega.component.html',
  styleUrls: ['./impostazioni-lega.component.css']
})
export class ImpostazioniLegaComponent {
  public authService = inject(AuthService);
}
