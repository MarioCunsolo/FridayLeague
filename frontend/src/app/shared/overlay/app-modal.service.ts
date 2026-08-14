import { Injectable, Type, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AppOverlayOptions,
  AppOverlayRef,
  DefaultAppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class AppModalService {
  private readonly modal = inject(NzModalService);

  createModal<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    const ref = this.modal.create<TComponent, TData, TResult>({
      nzContent: component,
      nzData: options.data,
      nzTitle: options.title,
      nzFooter: null,
      nzWidth: options.modal?.width ?? 512,
      nzCentered: options.modal?.centered ?? true,
      nzClosable: options.showClose ?? true,
      nzMaskClosable: options.maskClosable ?? true,
      nzKeyboard: options.keyboard ?? true,
      nzCloseOnNavigation: options.closeOnNavigation ?? true,
      nzAutofocus: options.autofocus ?? null,
      nzZIndex: options.zIndex ?? 2000,
      nzWrapClassName: 'app-modal-overlay',
      nzBodyStyle: {
        padding: '0',
        overflow: 'auto'
      }
    });

    return new DefaultAppOverlayRef<TResult>(
      ref.afterClose,
      result => ref.close(result)
    );
  }
}
