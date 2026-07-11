import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzButtonModule],
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.css']
})
export class PasswordModalComponent {
  @Input() isVisible: boolean = false;

  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  nuovaPassword = '';
  confermaPassword = '';
  errorMessage = '';

  onConfirm(): void {
    this.errorMessage = '';

    if (!this.nuovaPassword || this.nuovaPassword.length < 6) {
      this.errorMessage = 'La password deve contenere almeno 6 caratteri.';
      return;
    }

    if (this.nuovaPassword !== this.confermaPassword) {
      this.errorMessage = 'Le password inserite non coincidono.';
      return;
    }

    this.confirm.emit(this.nuovaPassword);
    this.reset();
  }

  onCancel(): void {
    this.cancel.emit();
    this.reset();
  }

  private reset(): void {
    this.nuovaPassword = '';
    this.confermaPassword = '';
    this.errorMessage = '';
  }
}
