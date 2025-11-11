import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChattingTemplete } from './chatting-templete';

describe('ChattingTemplete', () => {
  let component: ChattingTemplete;
  let fixture: ComponentFixture<ChattingTemplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChattingTemplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChattingTemplete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
