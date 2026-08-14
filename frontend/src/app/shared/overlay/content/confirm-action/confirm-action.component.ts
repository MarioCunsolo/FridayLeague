import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { injectAppOverlayData, injectAppOverlayRef } from '../../app-overlay-injectors';

export interface ConfirmActionData {
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-action',
  standalone: true,
  imports: [NzButtonModule, NzIconModule],
  templateUrl: './confirm-action.component.html',
  styleUrl: './confirm-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmActionComponent {
  readonly data = injectAppOverlayData<ConfirmActionData>();
  private readonly overlayRef = injectAppOverlayRef<true>();

  confirm(): void {
    this.overlayRef.close(true);
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }
}
