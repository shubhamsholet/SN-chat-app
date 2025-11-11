import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationShell } from './notification-shell';

describe('NotificationShell', () => {
  let component: NotificationShell;
  let fixture: ComponentFixture<NotificationShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
