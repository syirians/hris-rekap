import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JadwalKerjaPegawaiComponent } from './jadwal-kerja-pegawai.component';

describe('JadwalKerjaPegawaiComponent', () => {
  let component: JadwalKerjaPegawaiComponent;
  let fixture: ComponentFixture<JadwalKerjaPegawaiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JadwalKerjaPegawaiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JadwalKerjaPegawaiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
