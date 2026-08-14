import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { AppDrawerService } from './app-drawer.service';
import { AppModalService } from './app-modal.service';
import { ResponsiveOverlayService } from './responsive-overlay.service';
import { AppOverlayRef } from './app-overlay.types';

@Component({ standalone: true, template: '' })
class TestResponsiveContentComponent {}

describe('ResponsiveOverlayService', () => {
  const overlayRef: AppOverlayRef<number> = {
    afterClosed$: of(undefined),
    close: jasmine.createSpy('close')
  };
  const breakpoints = jasmine.createSpyObj<BreakpointObserver>('BreakpointObserver', ['isMatched']);
  const modals = jasmine.createSpyObj<AppModalService>('AppModalService', ['createModal']);
  const drawers = jasmine.createSpyObj<AppDrawerService>('AppDrawerService', ['createDrawer']);

  beforeEach(() => {
    breakpoints.isMatched.calls.reset();
    modals.createModal.calls.reset();
    drawers.createDrawer.calls.reset();
    modals.createModal.and.returnValue(overlayRef);
    drawers.createDrawer.and.returnValue(overlayRef);

    TestBed.configureTestingModule({
      providers: [
        ResponsiveOverlayService,
        { provide: BreakpointObserver, useValue: breakpoints },
        { provide: AppModalService, useValue: modals },
        { provide: AppDrawerService, useValue: drawers }
      ]
    });
  });

  it('usa il drawer sui viewport mobile', () => {
    breakpoints.isMatched.and.returnValue(true);
    const options = { title: 'Test', data: { value: 1 } };

    TestBed.inject(ResponsiveOverlayService).open<{ value: number }, number>(
      TestResponsiveContentComponent,
      options
    );

    expect(drawers.createDrawer).toHaveBeenCalledWith(TestResponsiveContentComponent, options);
    expect(modals.createModal).not.toHaveBeenCalled();
  });

  it('usa la modale sui viewport desktop', () => {
    breakpoints.isMatched.and.returnValue(false);
    const options = { title: 'Test', data: { value: 1 } };

    TestBed.inject(ResponsiveOverlayService).open<{ value: number }, number>(
      TestResponsiveContentComponent,
      options
    );

    expect(modals.createModal).toHaveBeenCalledWith(TestResponsiveContentComponent, options);
    expect(drawers.createDrawer).not.toHaveBeenCalled();
  });
});
