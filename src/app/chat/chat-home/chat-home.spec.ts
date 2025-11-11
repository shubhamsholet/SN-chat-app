import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatHome } from './chat-home';

describe('ChatHome', () => {
  let component: ChatHome;
  let fixture: ComponentFixture<ChatHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
