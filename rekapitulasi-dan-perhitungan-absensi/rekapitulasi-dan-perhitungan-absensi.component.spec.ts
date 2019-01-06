import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RekapitulasiPerhitunganAbsensiComponent } from './rekapitulasi-dan-perhitungan-absensi.component';

describe('DaftarListPegawaiComponent', () => {
  let component: RekapitulasiPerhitunganAbsensiComponent;
  let fixture: ComponentFixture<RekapitulasiPerhitunganAbsensiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RekapitulasiPerhitunganAbsensiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RekapitulasiPerhitunganAbsensiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
