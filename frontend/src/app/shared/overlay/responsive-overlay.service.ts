import { Injectable, Type, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppDrawerService } from './app-drawer.service';
import { AppModalService } from './app-modal.service';
import {
  APP_MOBILE_OVERLAY_QUERY,
  AppOverlayOptions,
  AppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class ResponsiveOverlayService {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly modals = inject(AppModalService);
  private readonly drawers = inject(AppDrawerService);

  open<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    if (this.breakpoints.isMatched(APP_MOBILE_OVERLAY_QUERY)) {
      return this.drawers.createDrawer<TData, TResult, TComponent>(component, options);
    }

    return this.modals.createModal<TData, TResult, TComponent>(component, options);
  }
}
