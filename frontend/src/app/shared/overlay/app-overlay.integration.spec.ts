import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AppDrawerService } from './app-drawer.service';
import { AppModalService } from './app-modal.service';
import { injectAppOverlayData, injectAppOverlayRef } from './app-overlay-injectors';

interface IntegrationData {
  value: number;
}

@Component({
  standalone: true,
  template: '<button type="button" (click)="complete()">Conferma</button>'
})
class IntegrationOverlayContentComponent {
  readonly data = injectAppOverlayData<IntegrationData>();
  private readonly overlayRef = injectAppOverlayRef<number>();

  complete(): void {
    this.overlayRef.close(this.data.value);
  }
}

describe('App overlay integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NzModalModule, NzDrawerModule],
      providers: [provideNoopAnimations()]
    });
  });

  it('fornisce dati e reference al contenuto di una modale reale', fakeAsync(() => {
    const ref = TestBed.inject(AppModalService).createModal<IntegrationData, number>(
      IntegrationOverlayContentComponent,
      { title: 'Test', data: { value: 5 } }
    );

    tick();
    const modal = document.querySelector('.app-modal-overlay');
    const pane = modal?.closest('.cdk-overlay-pane');
    const mask = pane?.previousElementSibling;

    expect(modal?.querySelector('button')).not.toBeNull();
    expect(pane).not.toBeNull();
    expect(mask?.classList.contains('ant-modal-mask')).toBeTrue();
    expect(getComputedStyle(pane!).zIndex).toBe(getComputedStyle(mask!).zIndex);
    ref.close();
    tick();
  }));

  it('fornisce dati e reference al contenuto di un drawer reale', fakeAsync(() => {
    const ref = TestBed.inject(AppDrawerService).createDrawer<IntegrationData, number>(
      IntegrationOverlayContentComponent,
      { title: 'Test', data: { value: 5 } }
    );

    tick();
    expect(document.querySelector('.app-drawer-overlay button')).not.toBeNull();
    ref.close();
    tick();
  }));
});
