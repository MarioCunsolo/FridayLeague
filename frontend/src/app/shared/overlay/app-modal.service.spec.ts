import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { AppModalService } from './app-modal.service';

@Component({ standalone: true, template: '' })
class TestOverlayContentComponent {}

describe('AppModalService', () => {
  const afterClose = new Subject<number | undefined>();
  const nativeRef = {
    afterClose,
    close: jasmine.createSpy('close')
  };
  const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['create']);

  beforeEach(() => {
    modal.create.calls.reset();
    nativeRef.close.calls.reset();
    modal.create.and.returnValue(nativeRef as never);
    TestBed.configureTestingModule({
      providers: [
        AppModalService,
        { provide: NzModalService, useValue: modal }
      ]
    });
  });

  it('crea una modale con dati tipizzati e autofocus disabilitato', () => {
    TestBed.inject(AppModalService).createModal<{ value: number }, number>(
      TestOverlayContentComponent,
      { title: 'Test', data: { value: 1 } }
    );

    expect(modal.create).toHaveBeenCalledWith(jasmine.objectContaining({
      nzContent: TestOverlayContentComponent,
      nzData: { value: 1 },
      nzTitle: 'Test',
      nzAutofocus: null,
      nzWrapClassName: 'app-modal-overlay'
    }));
  });

  it('inoltra il risultato alla reference Ng-Zorro', () => {
    const ref = TestBed.inject(AppModalService).createModal<{ value: number }, number>(
      TestOverlayContentComponent,
      { title: 'Test', data: { value: 1 } }
    );

    ref.close(7);
    expect(nativeRef.close).toHaveBeenCalledWith(7);
    expect(ref.afterClosed$).toBe(afterClose);
  });
});
