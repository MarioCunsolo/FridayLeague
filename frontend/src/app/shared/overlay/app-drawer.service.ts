import { Injectable, Type, inject } from '@angular/core';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  AppOverlayOptions,
  AppOverlayRef,
  DefaultAppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class AppDrawerService {
  private readonly drawer = inject(NzDrawerService);

  createDrawer<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    const ref = this.drawer.create<TComponent, object, TResult>({
      nzContent: component,
      nzData: options.data,
      nzTitle: options.title,
      nzPlacement: 'bottom',
      nzHeight: options.drawer?.height ?? 'auto',
      nzClosable: options.showClose ?? true,
      nzMaskClosable: options.maskClosable ?? true,
      nzKeyboard: options.keyboard ?? true,
      nzCloseOnNavigation: options.closeOnNavigation ?? true,
      nzZIndex: options.zIndex ?? 2000,
      nzWrapClassName: 'app-drawer-overlay',
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
