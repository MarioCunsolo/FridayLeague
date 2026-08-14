import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { Subject } from 'rxjs';
import { AppDrawerService } from './app-drawer.service';

@Component({ standalone: true, template: '' })
class TestDrawerContentComponent {}

describe('AppDrawerService', () => {
  const afterClose = new Subject<string | undefined>();
  const nativeRef = {
    afterClose,
    close: jasmine.createSpy('close')
  };
  const drawer = jasmine.createSpyObj<NzDrawerService>('NzDrawerService', ['create']);

  beforeEach(() => {
    drawer.create.calls.reset();
    nativeRef.close.calls.reset();
    drawer.create.and.returnValue(nativeRef as never);
    TestBed.configureTestingModule({
      providers: [
        AppDrawerService,
        { provide: NzDrawerService, useValue: drawer }
      ]
    });
  });

  it('crea un drawer dal basso con animazione nativa', () => {
    TestBed.inject(AppDrawerService).createDrawer<{ id: number }, string>(
      TestDrawerContentComponent,
      { title: 'Test', data: { id: 3 }, drawer: { height: '80dvh' } }
    );

    const config = drawer.create.calls.mostRecent().args[0] as Record<string, unknown>;
    expect(config['nzContent']).toBe(TestDrawerContentComponent);
    expect(config['nzData']).toEqual({ id: 3 });
    expect(config['nzPlacement']).toBe('bottom');
    expect(config['nzHeight']).toBe('80dvh');
    expect(config['nzNoAnimation']).toBeUndefined();
    expect(config['nzWrapClassName']).toBe('app-drawer-overlay');
  });

  it('inoltra il risultato alla reference Ng-Zorro', () => {
    const ref = TestBed.inject(AppDrawerService).createDrawer<{ id: number }, string>(
      TestDrawerContentComponent,
      { title: 'Test', data: { id: 3 } }
    );

    ref.close('ok');
    expect(nativeRef.close).toHaveBeenCalledWith('ok');
    expect(ref.afterClosed$).toBe(afterClose);
  });
});
