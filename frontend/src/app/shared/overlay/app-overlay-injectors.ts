import { inject } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AppOverlayContentRef } from './app-overlay.types';

export function injectAppOverlayData<TData extends object>(): TData {
  const modalData = inject(NZ_MODAL_DATA, { optional: true }) as TData | null;
  const drawerData = inject(NZ_DRAWER_DATA, { optional: true }) as TData | null;
  const data = modalData ?? drawerData;

  if (!data) {
    throw new Error('Il componente deve essere aperto tramite un AppOverlayService.');
  }

  return data;
}

export function injectAppOverlayRef<TResult>(): AppOverlayContentRef<TResult> {
  const modalRef = inject<NzModalRef<object, TResult>>(NzModalRef, { optional: true });
  const drawerRef = inject<NzDrawerRef<object, TResult>>(NzDrawerRef, { optional: true });

  if (!modalRef && !drawerRef) {
    throw new Error('Overlay reference non disponibile.');
  }

  return {
    close: (result: TResult) => {
      if (modalRef) {
        modalRef.close(result);
      } else {
        drawerRef!.close(result);
      }
    },
    dismiss: () => {
      if (modalRef) {
        modalRef.close();
      } else {
        drawerRef!.close();
      }
    }
  };
}
