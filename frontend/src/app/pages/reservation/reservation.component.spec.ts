import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReservationComponent } from './reservation.component';
import { AuthService } from '../../shared/service/auth.service';
import { AuthorizationService } from '../../shared/service/authorization.service';
import { LegaService } from '../../shared/service/lega.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReservationService } from '../../shared/service/reservation.service';
import { ResponsiveOverlayService } from '../../shared/overlay/responsive-overlay.service';

describe('ReservationComponent', () => {
  let component: ReservationComponent;
  let fixture: ComponentFixture<ReservationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReservationComponent],
      providers: [
        {
          provide: ReservationService,
          useValue: {
            reservations: signal([]),
            loadReservations: () => of([]),
            addReservation: () => of(undefined),
            deleteReservation: () => of(undefined),
            seedDummyReservations: () => of(undefined)
          }
        },
        { provide: LegaService, useValue: { getLegaPartecipanti: () => of([]) } },
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: AuthorizationService, useValue: { canDeleteReservation: () => false } },
        { provide: NzMessageService, useValue: { success: () => undefined, error: () => undefined } },
        { provide: ResponsiveOverlayService, useValue: { open: () => ({ afterClosed$: of(undefined) }) } }
      ]
    });
    fixture = TestBed.createComponent(ReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
