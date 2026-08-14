import { Observable } from 'rxjs';

export const APP_MOBILE_OVERLAY_QUERY = '(max-width: 768px)';

export type AppOverlayAutofocus = 'auto' | 'ok' | 'cancel' | null;

export interface AppModalPresentation {
  width?: number | string;
  centered?: boolean;
}

export interface AppDrawerPresentation {
  height?: number | string;
}

export interface AppOverlayOptions<TData extends object> {
  title: string;
  data: TData;
  showClose?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  closeOnNavigation?: boolean;
  autofocus?: AppOverlayAutofocus;
  zIndex?: number;
  modal?: AppModalPresentation;
  drawer?: AppDrawerPresentation;
}

export interface AppOverlayRef<TResult> {
  readonly afterClosed$: Observable<TResult | undefined>;
  close(result?: TResult): void;
}

export interface AppOverlayContentRef<TResult> {
  close(result: TResult): void;
  dismiss(): void;
}

export class DefaultAppOverlayRef<TResult> implements AppOverlayRef<TResult> {
  constructor(
    readonly afterClosed$: Observable<TResult | undefined>,
    private readonly closeOverlay: (result?: TResult) => void
  ) {}

  close(result?: TResult): void {
    this.closeOverlay(result);
  }
}
