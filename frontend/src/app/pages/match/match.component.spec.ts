import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MatchComponent } from './match.component';
import { AuthService } from '../../shared/service/auth.service';
import { MatchService } from '../../shared/service/match.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ResponsiveOverlayService } from '../../shared/overlay/responsive-overlay.service';

describe('MatchComponent', () => {
  let component: MatchComponent;
  let fixture: ComponentFixture<MatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        {
          provide: MatchService,
          useValue: {
            getMatches: () => signal([]),
            availableSeasons: () => [],
            getMatchById: () => undefined
          }
        },
        { provide: AuthService, useValue: { isAdminOrCoAdmin: () => false } },
        { provide: NzMessageService, useValue: { success: () => undefined, error: () => undefined } },
        { provide: ResponsiveOverlayService, useValue: { open: () => ({ afterClosed$: of(undefined) }) } }
      ]
    });
    fixture = TestBed.createComponent(MatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
