// import { Component, OnInit } from '@angular/core';
import { Component, OnInit, Inject, forwardRef } from '@angular/core';
import { HttpClient } from '../../../global/service/HttpClient';
import { Observable } from 'rxjs/Rx';
import { LazyLoadEvent, ConfirmDialogModule, ConfirmationService } from 'primeng/primeng';
import { Validators, FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
// import { AlertService, InfoService, Configuration, AuthGuard, UserDto } from '../../../global';
import { AlertService, InfoService, Configuration, AuthGuard, UserDto, FileService, ReportService } from '../../../global';



@Component({
    selector: 'app-rekapitulasi-perhitungan-absensi',
    templateUrl: './rekapitulasi-dan-perhitungan-absensi.component.html',
    styleUrls: ['./rekapitulasi-dan-perhitungan-absensi.component.scss'],
    providers: [ConfirmationService]

})
export class RekapitulasiPerhitunganAbsensiComponent implements OnInit {
    listData: any[];
    listJadwal: any[];
    list: any[];
    selected: any;
    pencarian: string;
    totalRecords: number;
    tanggalAwal: any;
    tanggalAkhir: any;
    totalT: number;
    totalM: number;
    totalPulangT: number;
    totalPulangM: number;
    totalJamLembur: number;
    totalJamKerja: number;
    form: any;
    kdRuangan: any;
    kdPegawai: any;
    listRuangan: any = [];
    listPegawai: any = [];
    data: any[];
    urlList: any;
    dialogEditRekap: boolean;
    dialogEditStatusPegawai: boolean;
    formEdit: any;
    defaultDate: any;
    jamMasukEdit: any;
    jamKeluarEdit: any;
    test: any;
    view: any;
    listPeriodeHead: any[];
    listPeriode: any[];
    selectedPeriode: any;
    byPegawai: boolean;
    byRuangan: boolean;
    kdPeriodeHead: any;
    first: number = 0;
    listStatusPegawai: any[];
    statusPegawai: any;
    kodeExternalStatus: any;
    tglStatusAbsensi: any;
    tglAkhirPeriode: any;
    dataFixedShiftLibur: any;
    laporan: boolean = false
    urll: any;
    uiGrid: any;
    sidebar: boolean;
    iconSideBar: any;
    periodeDiv: any;
    buttonAktif: boolean;
    styleSidebar: any;
    closing: any;
    namaPeriode: any;
    status: any;

    noHistoriRekap: any; constructor(private alertService: AlertService,
        private InfoService: InfoService,
        private httpService: HttpClient,
        private fb: FormBuilder,
        private authGuard: AuthGuard,
        private confirmationService: ConfirmationService,
        private fileService: FileService,
        @Inject(forwardRef(() => ReportService)) private print: ReportService) { }

    ngOnInit() {

        this.namaPeriode = null;
        localStorage.setItem('proses-penggajian', String(0));
        this.iconSideBar = "fa fa-angle-right";
        this.test = null;
        this.sidebar = false;
        this.uiGrid = 12;
        this.periodeDiv = 1;
        this.kdPeriodeHead = null;
        this.selectedPeriode = null;
        this.tglAkhirPeriode = null;
        this.pencarian = '';
        this.kdRuangan = null;
        this.kdPegawai = null;
        this.byPegawai = false;
        this.byRuangan = false;
        this.buttonAktif = true;
        this.tanggalAwal = new Date();
        this.tanggalAkhir = new Date();
        this.tanggalAwal.setHours(0, 0, 0, 0);
        let tanggalAkhir = this.setTimeStamp(this.tanggalAkhir);
        let tanggalAwal = this.setTimeStamp(this.tanggalAwal);

        this.form = this.fb.group({
            'idFinger': new FormControl({ value: '', disabled: true }),
            'namaPegawai': new FormControl({ value: '', disabled: true }),
            'nik': new FormControl({ value: '', disabled: true }),
            'jabatan': new FormControl({ value: '', disabled: true }),
            'unitKerja': new FormControl({ value: '', disabled: true }),
            'jenisKelamin': new FormControl({ value: '', disabled: true }),
            'tanggalGabung': new FormControl({ value: '', disabled: true }),
            'kategoriPegawai': new FormControl({ value: '', disabled: true }),
            'kdPegawai': new FormControl({ value: '', disabled: false }),
            'kdRuangan': new FormControl({ value: '', disabled: true }),
            'byRuangan': new FormControl({ value: '', disabled: false }),
            'viewAll': new FormControl({ value: '', disabled: false }),
            'tanggalAwal': new FormControl({ value: '', disabled: false }),
        });
        this.formEdit = this.fb.group({
            'tanggal': new FormControl({ value: '', disabled: true }),
            'tanggalMasuk': new FormControl({ value: '', disabled: false }, Validators.required),
            'tanggalKeluar': new FormControl({ value: '', disabled: false }, Validators.required),
            'kdPegawai': new FormControl({ value: '', disabled: false }),
            'kdRuangan': new FormControl({ value: '', disabled: false })/*,
            'kdStatusAbsensi': new FormControl({ value: '', disabled: false })*/
        });
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/findAllPeriodeJadwalHead').subscribe(res => {
            this.listPeriodeHead = [];
            this.listPeriodeHead.push({ label: '--Pilih Periode--', value: null })
            for (var i = 0; i < res.data.length; i++) {
                this.listPeriodeHead.push({ label: res.data[i].namaPeriode, value: res.data[i].kdPeriode })
            };
        },
            error => {
                this.listPeriodeHead = [];
                this.listPeriodeHead.push({ label: '-- ' + error + ' --', value: '' })
            });
        this.listPeriode = [];
        this.listData = [];
        this.hitungTotalMasukT();
        this.hitungTotalMasukM();
        this.hitungTotalPulangT();
        this.hitungTotalPulangM();
        this.hitungTotalJamLembur();
        this.hitungTotalJamKerja();
        this.getLegend();
        this.get();
    }
    getKode(event) {
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/perhitungan-gaji/findPeriodeByHead?kdPeriode=' + event.value).subscribe(res => {
            this.listPeriode = res.data.periodeHead;
        });
    }
    get() {
        this.httpService.get(Configuration.get().dataMaster + '/service/list-generic/?table=Ruangan&select=namaRuangan,id.kode&criteria=kdRuanganHead&values=' + this.authGuard.getUserDto().kdLokasi).subscribe(res => {
            this.listRuangan = [];
            this.listRuangan.push({ label: '--Pilih Unit Kerja--', value: '' });
            for (var i = 0; i < res.data.data.length; i++) {
                this.listRuangan.push({ label: res.data.data[i].namaRuangan, value: res.data.data[i].id_kode })
            };
        },
            error => {
                this.listRuangan = [];
                this.listRuangan.push({ label: '-- ' + error + ' --', value: '' })
            });
        this.getPegawaiAll();
        this.test = "22.00";
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/statusAbsensiPegawai').subscribe(res => {
            this.listStatusPegawai = [...res.data.data];
			/*this.listStatusAbsensi.push({ label: '--Pilih Status Absensi--', value: '' })
			for (var i = 0; i < res.data.data.length; i++) {
				this.listStatusAbsensi.push({ label: res.data.data[i].namaStatus, value: res.data.data[i].kdStatus })
			};*/
        });

        //masih nunggu service buat ambil Settingdatafixed
        this.httpService.get(Configuration.get().dataMasterNew + '/service/list-generic?table=SettingDataFixed&select=nilaiField&page=1&rows=1000&criteria=id.namaField&values=NameShiftLibur&condition=and&profile=y').subscribe(res => {
            this.dataFixedShiftLibur = res.data.data[0].nilaiField;
        });

    }
    pilihPeriode(event) {
        if (event != null) {
            this.closing = event.data.noClosing;
            this.namaPeriode = event.data.namaPeriode;
            this.listData = [];
            this.data = [];
            this.list = [];
        }

    }
    rowSel(self: RekapitulasiPerhitunganAbsensiComponent, event) {
        setTimeout(
            function () {
                self.httpService.serviceData = event.data;
                self.form.get('idFinger').setValue(0);
                self.form.get('namaPegawai').setValue(event.data.namaLengkap);
                self.form.get('jenisKelamin').setValue(event.data.jenisKelamin);
                self.form.get('nik').setValue(event.data.nik);
                self.form.get('jabatan').setValue(event.data.namaJabatan);
                self.form.get('unitKerja').setValue(event.data.namaRuangan);
                self.form.get('tanggalGabung').setValue(new Date(event.data.tanggalGabung * 1000));
                self.form.get('kategoriPegawai').setValue(event.data.namaKategori);
                // console.log(event);
            }, 200);
    }

    onRowSelect(event) {
        this.rowSel(this, event);
        this.form.get('jenisKelamin').setValue(event.data.jenisKelamin);
    }

    setTimeStamp(date) {
        if (date == null || date == undefined || date == '') {
            let dataTimeStamp = (new Date().getTime() / 1000);
            return dataTimeStamp.toFixed(0);
        } else {
            let dataTimeStamp = (new Date(date).getTime() / 1000);
            return dataTimeStamp.toFixed(0);
        }
    }

    hitungTotalMasukT() {
        this.totalT = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalT += this.listData[i].datangT
        }
    }

    hitungTotalMasukM() {
        this.totalM = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalM += this.listData[i].datangM
        }
    }

    hitungTotalPulangT() {
        this.totalPulangT = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalPulangT += this.listData[i].pulangT
        }
    }

    hitungTotalPulangM() {
        this.totalPulangM = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalPulangM += this.listData[i].pulangM
        }
    }

    hitungTotalJamLembur() {
        this.totalJamLembur = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalJamLembur += this.listData[i].jamLembur
        }
    }

    hitungTotalJamKerja() {
        this.totalJamKerja = 0;
        for (let i = 0; i < this.listData.length; i++) {
            this.totalJamKerja += this.listData[i].efektif
        }
    }

    onSubmit() {
        this.simpan();
    }

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    simpan() {
        let data = {
            "kdPegawai": this.kdPegawai,
            "kdRuangan": this.kdRuangan,
            "kdPeriode": this.selectedPeriode.kode.kode,
            "noHistoriBefore": this.selectedPeriode.noHistoriBefore
        }
        // console.log(data);
        this.httpService.post(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/saveRekapitulasiAbsensi', data).subscribe(response => {
            this.alertService.success('Berhasil', 'Data Disimpan');
            // this.get();
            this.reset();
        });
    }

    reset() {
        this.ngOnInit();
    }

    cariPegawai(event) {
        // console.log(event.value)
        if (this.tglAkhirPeriode != null) {
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findPegawai?kdRuangan=' + event.value + '&tglPeriodeAkhir=' + this.tglAkhirPeriode).subscribe(res => {
                this.listPegawai = [];
                this.listPegawai.push({ label: '--Pilih Pegawai--', value: '' });
                for (var i = 0; i < res.data.length; i++) {
                    this.listPegawai.push({ label: res.data[i].namaLengkap, value: res.data[i].kdPegawai })
                };
                this.pilihPeriode(null);
                this.kdPegawai = null;
            },
                error => {
                    this.listPegawai = [];
                    this.listPegawai.push({ label: '-- ' + error + ' --', value: '' })
                });
        } else {
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findPegawai?kdRuangan=' + event.value).subscribe(res => {
                this.listPegawai = [];
                this.listPegawai.push({ label: '--Pilih Pegawai--', value: '' });
                for (var i = 0; i < res.data.length; i++) {
                    this.listPegawai.push({ label: res.data[i].namaLengkap, value: res.data[i].kdPegawai })
                };
                this.pilihPeriode(null);
                this.kdPegawai = null;
            },
                error => {
                    this.listPegawai = [];
                    this.listPegawai.push({ label: '-- ' + error + ' --', value: '' })
                });
        }


    }

    pilihPegawai(event) {
        this.form.get('idFinger').setValue(null);
        this.form.get('namaPegawai').setValue(null);
        this.form.get('jenisKelamin').setValue(null);
        this.form.get('nik').setValue(null);
        this.form.get('jabatan').setValue(null);
        this.form.get('unitKerja').setValue(null);
        this.form.get('tanggalGabung').setValue(null);
        this.form.get('kategoriPegawai').setValue(null);
    }

    editStatusPegawai(data) {
        this.tglStatusAbsensi = new Date(data.tanggal * 1000);
        this.kdPegawai = data.kdPegawai;
        this.kdRuangan = data.kdRuangan;
        this.dialogEditStatusPegawai = true;
    }

    batalStatusPegawai(data) {

        this.tglStatusAbsensi = new Date(data.tanggal * 1000);
        this.kdPegawai = data.kdPegawai;
        this.kdRuangan = data.kdRuangan;

        let formSubmit = {
            "kdPegawai": this.kdPegawai,
            "kdPeriode": this.selectedPeriode.kode.kode,
            "kdRuangan": this.kdRuangan,
            "kdStatusPegawai": null,
            "tglKeluar": this.setTimeStamp(this.tglStatusAbsensi),
            "tglMasuk": this.setTimeStamp(this.tglStatusAbsensi)
        }

        this.httpService.post(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/saveKoreksiAbsensiTidakMasuk', formSubmit).subscribe(response => {
            this.alertService.success('Berhasil', 'Sudah dihapus.');
            this.dialogEditStatusPegawai = false;
            this.tampilkan();
            this.pilihPeriode(null);
        });
    }
    simpanStatusPegawai() {
        let formSubmit = {
            "kdPegawai": this.kdPegawai,
            "kdPeriode": this.selectedPeriode.kode.kode,
            "kdRuangan": this.kdRuangan,
            "kdStatusPegawai": this.statusPegawai.kdStatus,
            "tglKeluar": this.setTimeStamp(this.tglStatusAbsensi),
            "tglMasuk": this.setTimeStamp(this.tglStatusAbsensi)
        }

        this.httpService.post(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/saveKoreksiAbsensiTidakMasuk', formSubmit).subscribe(response => {
            this.alertService.success('Berhasil', 'Sudah disimpan.');
            this.dialogEditStatusPegawai = false;
            this.tampilkan();
            this.pilihPeriode(null);
        });
    }
    edit(tanggal, kdPegawai, kdRuangan, tglMasukAbsensi, tglKeluarAbsensi, noHistori) {
        this.noHistoriRekap = noHistori;
        this.formEdit.get('tanggal').setValue(new Date(tanggal * 1000));
        let date = new Date(tanggal * 1000);
        let masuk = new Date(tglMasukAbsensi * 1000);
        let keluar = new Date(tglKeluarAbsensi * 1000);
        this.defaultDate = '12-03-2016';
        if (tglMasukAbsensi != '-' && tglMasukAbsensi != null && tglMasukAbsensi != undefined) {
            this.formEdit.get('tanggalMasuk').setValue(new Date(date.setHours(masuk.getHours(), masuk.getMinutes(), 0, 0)));
        } else {
            // this.formEdit.get('tanggalMasuk').setValue(null);
            // this.formEdit.get('tanggalKeluar').setValue(new Date(date.setHours(0, 0, 0, 0)));
        }

        if (tglKeluarAbsensi != '-' && tglKeluarAbsensi != null && tglKeluarAbsensi != undefined) {
            this.formEdit.get('tanggalKeluar').setValue(new Date(date.setHours(keluar.getHours(), keluar.getMinutes(), 0, 0)));
        } else {
            // this.formEdit.get('tanggalMasuk').setValue(new Date(date.setHours(0, 0, 0, 0)));
            // this.formEdit.get('tanggalKeluar').setValue(null);
        }
        this.formEdit.get('kdPegawai').setValue(kdPegawai);
        this.formEdit.get('kdRuangan').setValue(kdRuangan);
        this.dialogEditRekap = true;
    }
    confirmEditStatusAbsensi(before: string, after: string) {
        this.confirmationService.confirm({
            message: 'Edit status absensi ' + before + ' menjadi ' + after,
            header: 'Konfirmasi',
            icon: 'fa fa-question-circle',
            accept: () => {

            },
            reject: () => {
            }
        });
    }

    simpanRekapEdit() {

        // if (this.formEdit.get('tanggalMasuk').valid && this.formEdit.get('tanggalKeluar').valid) {

        let date = new Date(this.formEdit.get('tanggal').value);
        let masuk = new Date(this.formEdit.get('tanggalMasuk').value);
        let keluar = new Date(this.formEdit.get('tanggalKeluar').value);
        if (masuk == null) {
            this.jamMasukEdit = null;
        } else {
            let KuluarKurang = new Date(date.setHours(keluar.getHours(), keluar.getMinutes(), 0, 0));
            let keluarKurang = KuluarKurang.getDate();
            this.jamKeluarEdit = KuluarKurang.setDate(keluarKurang) / 1000;
            let tglKeluar = KuluarKurang.setDate(keluarKurang);
        }
        if (keluar == null) {
            this.jamKeluarEdit = null;

        } else {
            let MasukKurang = new Date(date.setHours(masuk.getHours(), masuk.getMinutes(), 0, 0));
            let masukKurang = MasukKurang.getDate();
            this.jamMasukEdit = MasukKurang.setDate(masukKurang) / 1000;
            let tglMasuk = MasukKurang.setDate(masukKurang);
        }
        let tgl = this.setTimeStamp(this.formEdit.get('tanggal').value);

        let kdPegawai = this.formEdit.get('kdPegawai').value;
        let kdRuangan = this.formEdit.get('kdRuangan').value;
        if (this.formEdit.get('tanggalMasuk').value == null) {
            this.jamMasukEdit = null;
        }
        if (this.formEdit.get('tanggalKeluar').value == null) {
            this.jamKeluarEdit = null;
        }
        let formSubmit = {
            "kdPegawai": this.kdPegawai,
            "kdRuangan": this.kdRuangan,
            "pegawai": {
                "kdPegawai": kdPegawai,
                "kdRuangan": kdRuangan,
                "tglKeluar": this.jamKeluarEdit,
                "tglMasuk": this.jamMasukEdit/*,
                    "kdStatusAbsensi": this.formEdit.get('kdStatusAbsensi').value,*/
            },
            "kdPeriode": this.selectedPeriode.kode.kode,
            "noHistori": this.noHistoriRekap
        }

        this.httpService.post(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/saveKoreksiAbsensi', formSubmit).subscribe(response => {
            this.alertService.success('Berhasil', 'Edit disimpan');
            this.dialogEditRekap = false;
            this.pilihPeriode(null);
            this.tampilkan();
        });

        // } else {
        //     this.validateAllFormFields(this.form);
        //     this.alertService.warn("Peringatan", "Data Edit Absensi Wajib Diisi");
        // }

    }

    getTglPengajuan(t) {
        let date = new Date(this.formEdit.get('tanggal').value);
        let masuk = new Date(this.formEdit.get('tanggalMasuk').value);
        let keluar = new Date(this.formEdit.get('tanggalKeluar').value);
        let MasukKurang = new Date(date.setHours(t.getHours(), t.getMinutes(), 0, 0));
        let masukKurang = MasukKurang.getDate() - 1;
    }


    getTglPengajuan1(t) {
        let date = new Date(this.formEdit.get('tanggal').value);
        let KuluarKurang = new Date(date.setHours(t.getHours(), t.getMinutes(), 0, 0));
        let keluarKurang = KuluarKurang.getDate() - 1;
    }

    pegawaiSelec(a) {
        a.resetFilter();
    }
    checkPegawai(event) {
        if (event == false) {
            this.kdPegawai = null;
            this.getPegawaiAll();
            this.pilihPeriode(null);
        }
        this.getPegawaiAll();
    }
    checkRuangan(event) {
        if (event == false) {
            this.kdRuangan = null;
            this.getPegawaiAll();
            this.pilihPeriode(null);
        }
    }
    getPegawaiAll() {
        if (this.tglAkhirPeriode != null) {
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findPegawai?tglPeriodeAkhir=' + this.tglAkhirPeriode).subscribe(res => {
                this.listPegawai = [];
                this.listPegawai.push({ label: '--Pilih Pegawai--', value: '' });
                for (var i = 0; i < res.data.length; i++) {
                    this.listPegawai.push({ label: res.data[i].namaLengkap, value: res.data[i].kdPegawai })
                };
                this.pilihPeriode(null);
                this.kdPegawai = null;
            },
                error => {
                    this.listPegawai = [];
                    this.listPegawai.push({ label: '-- ' + error + ' --', value: '' })
                });
        } else {
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findPegawai').subscribe(res => {
                this.listPegawai = [];
                this.listPegawai.push({ label: '--Pilih Pegawai--', value: '' });
                for (var i = 0; i < res.data.length; i++) {
                    this.listPegawai.push({ label: res.data[i].namaLengkap, value: res.data[i].kdPegawai })
                };
                this.pilihPeriode(null);
                this.kdPegawai = null;
            },
                error => {
                    this.listPegawai = [];
                    this.listPegawai.push({ label: '-- ' + error + ' --', value: '' })
                });
        }

    }
    cariBerdasarkan(view) {
        if (view == "viewAll") {
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/pengajuan-cuti/findPegawai').subscribe(res => {
                this.listPegawai = [];
                this.listPegawai.push({ label: '--Pilih Pegawai--', value: '' })
                for (var i = 0; i < res.data.length; i++) {
                    this.listPegawai.push({ label: res.data[i].namaLengkap, value: res.data[i].kdPegawai })
                };
            },
                error => {
                    this.listPegawai = [];
                    this.listPegawai.push({ label: '-- ' + error + ' --', value: '' })
                });
            this.form.get('kdRuangan').disable();
            this.kdPegawai = null;
            this.kdRuangan = null;
            this.pilihPeriode(null);
            // this.form.get('kdPegawai').disable();
        } else if (view == "byRuangan") {
            this.form.get('kdRuangan').enable();
            // this.form.get('kdPegawai').enable();
        }
    }

    seturlpreviewBaru(kdRuangan, kdPegawai, kdPeriode) {
        // /cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=165&labelLaporan=Laporan%20Histori%20Absensi&kdPeriode=136&kdPegawai=sada&kdUnitKerja=unit&outProfile=true&download=false
        if (kdRuangan == null && kdPegawai == null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&labelLaporan=Laporan%20Histori%20Absensi&kdPeriode=' + kdPeriode + '&outProfile=true&download=false'
        }
        else if (kdRuangan !== null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&labelLaporan=Laporan%20Histori%20Absensi&kdPeriode=' + kdPeriode + '&kdUnitKerja=' + kdRuangan + '&outProfile=true&download=false'
        }
        else if (kdPegawai !== null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&labelLaporan=Laporan%20Histori%20Absensi&kdPeriode=' + kdPeriode + '&kdPegawai=' + kdPegawai + '&outProfile=true&download=false'
        }
    }

    seturlpreview(tglAwalPeriode, tglAkhirPeriode, noHistori, kdRuangan, kdPegawai) {

        if (kdRuangan == null && kdPegawai == null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&noHistori=' + noHistori + '&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode=' + tglAwalPeriode + '&tglAkhirPeriode=' + tglAkhirPeriode + '&outProfile=true&download=false'
            // this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile='+this.authGuard.getUserDto().kdProfile+'&gambarLogo=E:/upload-dir/1_qyGXPQTGm8T8JSI4tEVOqA1518421491047.png&noHistori='+noHistori+'&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode='+tglAwalPeriode+'&tglAkhirPeriode='+tglAkhirPeriode+'&outProfile=true&download=false'
        }
        else if (kdRuangan !== null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&noHistori=' + noHistori + '&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode=' + tglAwalPeriode + '&tglAkhirPeriode=' + tglAkhirPeriode + '&kdUnitKerja=' + kdRuangan + '&outProfile=true&download=false'
            // this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile='+this.authGuard.getUserDto().kdProfile+'&gambarLogo=E:/upload-dir/1_qyGXPQTGm8T8JSI4tEVOqA1518421491047.png&noHistori='+noHistori+'&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode='+tglAwalPeriode+'&tglAkhirPeriode='+tglAkhirPeriode+'&kdUnitKerja='+kdRuangan+'&outProfile=true&download=false'
        }
        else if (kdPegawai !== null) {
            this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile=' + this.authGuard.getUserDto().kdProfile + '&noHistori=' + noHistori + '&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode=' + tglAwalPeriode + '&tglAkhirPeriode=' + tglAkhirPeriode + '&kdPegawai=' + kdPegawai + '&outProfile=true&download=false'
            // this.urll = '/cetakHistoriAbsensi/laporanHistoriAbsensi.pdf?kdProfile='+this.authGuard.getUserDto().kdProfile+'&gambarLogo=E:/upload-dir/1_qyGXPQTGm8T8JSI4tEVOqA1518421491047.png&noHistori='+noHistori+'&labelLaporan=Laporan%20Histori%20Absensi&tglAwalPeriode='+tglAwalPeriode+'&tglAkhirPeriode='+tglAkhirPeriode+'&kdPegawai='+kdPegawai+'&outProfile=true&download=false'
        }



    }

    preview() {
        if (this.selectedPeriode == null) {
            this.alertService.warn('Peringatan', 'Pilih Periode Yang Ingin Dicetak');
        }
        else {

            // this.seturlpreview(this.selectedPeriode.tglAwalPeriode,this.selectedPeriode.tglAkhirPeriode,this.selectedPeriode.noHistori,this.kdRuangan,this.kdPegawai)
            this.seturlpreviewBaru(this.kdRuangan, this.kdPegawai, this.selectedPeriode.kdPeriode)
            this.laporan = true;
            this.print.showEmbedPDFReport(Configuration.get().report + this.urll, 'frmRekapitulasiDanPerhitunganAbsensi_laporanRekapitulasiDanPerhitunganAbsensi')
        }
    }

    tutupPreview() {
        this.laporan = false;
    }
    showBar() {
        this.styleSidebar = { 'margin-top': '45px', 'margin-left': '45px', 'width': '40%', 'height': '88%' };
        this.iconSideBar = "fa fa-angle-left";
        document.getElementById("hide").style.visibility = 'visible';
        this.sidebar = true;
        this.uiGrid = 7;
        this.periodeDiv = 2;
    }
    hideBar() {
        this.styleSidebar = null;
        this.iconSideBar = "fa fa-angle-right";
        document.getElementById("hide").style.visibility = 'hidden';
        this.sidebar = false;
        this.uiGrid = 12;
        this.periodeDiv = 1;
    }

    tampilkan() {
        if (this.selectedPeriode == undefined || this.selectedPeriode == null || this.selectedPeriode == '') {
            this.showBar();
        } else {
            this.first = 0;
            let kdPeriode = this.selectedPeriode.kode.kode;
            this.tglAkhirPeriode = this.selectedPeriode.tglAkhirPeriode;
            let ruangan = this.kdRuangan;
            let pegawai = this.kdPegawai;
            this.listData = [];
            this.data = [];
            this.list = [];
            if (this.closing == null) {
                this.buttonAktif = false;
            } else {
                this.buttonAktif = true;
                this.alertService.warn("Peringatan", "Data Payroll Pada Periode Tersebut Sudah Di Closing");
            }
            if (this.byRuangan == true) {
                if (this.form.get('kdRuangan').value == null || this.form.get('kdRuangan').value == undefined) {
                    this.alertService.warn("Peringatan", "Unit Kerja Tidak Boleh Kosong !");
                } else {
                    if (pegawai == null || pegawai == undefined || pegawai == '') {
                        this.urlList = Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findRekapByRuanganAndPeriode?kdPeriode=' + kdPeriode + '&kdRuangan=' + ruangan;
                    } else {
                        this.urlList = Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findRekapByRuanganAndPeriode?kdPeriode=' + kdPeriode + '&kdRuangan=' + ruangan + '&kdPegawai=' + pegawai;
                    }
                    this.httpService.get(this.urlList).subscribe(table => {
                        this.data = table.data.data;
                        for (let i = 0; i < this.data.length; i++) {
                            let jamLembur = 0;
                            let noHistori = null;
                            if (this.data[i].noHistori != undefined) {
                                noHistori = this.data[i].noHistori
                            }
                            if (this.data[i].jamLembur == 0) {
                                jamLembur = 0;
                            } else if (this.data[i].pulangAwal > 0) {
                                if (this.data[i].jamLembur > this.data[i].pulangAwal) {
                                    jamLembur = Math.floor(this.data[i].pulangAwal / 60);
                                } else {
                                    jamLembur = Math.floor(this.data[i].jamLembur / 60);
                                }
                            } else if (this.data[i].pulang > 0) {
                                if (this.data[i].jamLembur > this.data[i].pulang) {
                                    jamLembur = Math.floor(this.data[i].pulang / 60);
                                } else {
                                    jamLembur = Math.floor(this.data[i].jamLembur / 60);
                                }
                            } else if (this.data[i].namaShift == this.dataFixedShiftLibur) {
                                if (this.data[i].tglKeluar != '-' && this.data[i].tglMasukAbsensi != '-') {
                                    jamLembur = ((this.data[i].tglKeluar - this.data[i].tglMasukAbsensi) / 60);
                                } else {
                                    jamLembur = 0;
                                }
                                if (jamLembur > this.data[i].jamLembur) {
                                    jamLembur = Math.floor(this.data[i].jamLembur / 60);
                                }
                            }
                            //Sk tidak absen tetep cek jam pulang 
                            // else if (this.data[i].isTdkAbsen == true) {
                            //     jamLembur = Math.floor(this.data[i].jamLembur/60);
                            // }
                            //hitung Jam Produktif
                            let jamProduktif;
                            let hours = 0;
                            let rhours = 0;
                            let minutes = 0;
                            let rminutes = 0;
                            let jamBreak = 0;
                            if (this.data[i].statusAbsensi == 'Tidak Masuk' || this.data[i].statusAbsensi == 'Libur') {
                                jamProduktif = rhours + ' Jam ' + rminutes + ' Menit '
                                if (rminutes == 0) {
                                    jamProduktif = rhours + ' Jam ';
                                }
                            } else {
                                let masuk = new Date(this.data[i].tglKalendar * 1000);
                                let pulang = new Date(this.data[i].tglKalendar * 1000);
                                let jamBreakAwal = this.data[i].jamBreakAwal.split(':');
                                let jamBreakAkhir = this.data[i].jamBreakAkhir.split(':');
                                let breakAwal = this.setTimeStamp(new Date(masuk.setHours(jamBreakAwal[0], jamBreakAwal[1], 0, 0)));
                                let breakAkhir = this.setTimeStamp(new Date(pulang.setHours(jamBreakAkhir[0], jamBreakAkhir[1], 0, 0)));
                                jamBreak = (((parseInt(breakAkhir) - parseInt(breakAwal)) / 60) / 60);
                                hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60) - jamBreak;
                                //jika jam masuk lebih dari jam istirahat
                                if (this.data[i].tglMasukAbsensi >= breakAkhir) {
                                    hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                                }
                                //jika jam masuk ditengah tengah jam istirahat
                                if (this.data[i].tglMasukAbsensi >= breakAwal && this.data[i].tglMasukAbsensi <= breakAkhir) {
                                    hours = (((parseInt(this.data[i].tglKeluar) - parseInt(breakAkhir)) / 60) / 60);
                                }

                                //jika jam keluar kurang dari jam istirahat
                                if (this.data[i].tglKeluar <= breakAwal) {
                                    hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                                }
                                //jika jam masuk ditengah tengah jam istirahat
                                if (this.data[i].tglKeluar >= breakAwal && this.data[i].tglKeluar <= breakAkhir) {
                                    hours = (((parseInt(breakAwal) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                                }
                                rhours = Math.floor(hours);
                                minutes = (hours - rhours) * 60;
                                rminutes = Math.round(minutes);
                                jamProduktif = rhours + ' Jam ' + rminutes + ' Menit '
                                if (rminutes == 0) {
                                    jamProduktif = rhours + ' Jam ';
                                }
                                if (this.data[i].tglMasukAbsensi == '-' || this.data[i].tglKeluar == '-' || this.data[i].tglMasukAbsensi == null || this.data[i].tglKeluar == null) {
                                    jamProduktif = 0 + ' Jam ';
                                }
                            }
                            if (+this.data[i].datangAwal > 0) {
                                if (+this.data[i].pulangAwal > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': Math.abs(this.data[i].datangAwal),
                                        'pulangM': Math.abs(this.data[i].pulangAwal),
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,

                                    }
                                } else if (+this.data[i].pulang > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': Math.abs(this.data[i].datangAwal),
                                        'pulangM': 0,
                                        'pulangT': Math.abs(this.data[i].pulang),
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai
                                    }
                                } else if (+this.data[i].pulang == 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': Math.abs(this.data[i].datangAwal),
                                        'pulangM': 0,
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                }
                            } else if (+this.data[i].datang > 0) {
                                if (+this.data[i].pulang > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': Math.abs(this.data[i].datang),
                                        'datangT': 0,
                                        'pulangM': 0,
                                        'pulangT': this.data[i].pulang,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].pulangAwal > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': Math.abs(this.data[i].datang),
                                        'datangT': 0,
                                        'pulangM': Math.abs(this.data[i].pulangAwal),
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].pulang == 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': Math.abs(this.data[i].datang),
                                        'datangT': 0,
                                        'pulangM': 0,
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                }
                            } else if (+this.data[i].pulangAwal > 0) {
                                if (+this.data[i].datangAwal > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': Math.abs(this.data[i].datangAwal),
                                        'pulangM': Math.abs(this.data[i].pulangAwal),
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].datang > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': Math.abs(this.data[i].datang),
                                        'datangT': 0,
                                        'pulangM': Math.abs(this.data[i].pulangAwal),
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].datang == 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': 0,
                                        'pulangM': Math.abs(this.data[i].pulangAwal),
                                        'pulangT': 0,
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                }
                            } else if (+this.data[i].pulang > 0) {
                                if (+this.data[i].datang > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': Math.abs(this.data[i].datang),
                                        'datangT': 0,
                                        'pulangM': 0,
                                        'pulangT': Math.abs(this.data[i].pulang),
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].datangAwal > 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': Math.abs(this.data[i].datangAwal),
                                        'pulangM': 0,
                                        'pulangT': Math.abs(this.data[i].pulang),
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                } else if (+this.data[i].datang == 0) {
                                    this.list[i] = {
                                        'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                        'nik': this.data[i].nik,
                                        'namaJabatan': this.data[i].namaJabatan,
                                        'namaRuangan': this.data[i].namaRuangan,
                                        'tanggal': this.data[i].tglKalendar,
                                        'namaShift': this.data[i].namaShift,
                                        'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                        'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                        'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                        'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                        'jamMasukView': this.data[i].jamMasuk,
                                        'jamPulangView': this.data[i].jamPulang,
                                        'tglMasukView': this.data[i].jamMasukAbsensi,
                                        'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                        'jamBreakAwal': this.data[i].jamBreakAwal,
                                        'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                        'datangM': 0,
                                        'datangT': 0,
                                        'pulangM': 0,
                                        'pulangT': Math.abs(this.data[i].pulang),
                                        'jamLembur': jamLembur,
                                        'statusAbsensi': this.data[i].statusAbsensi,
                                        'statusPegawai': this.data[i].statusPegawai,
                                        'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                        'statusPersonal': this.data[i].statusPersonal,
                                        'kdPegawai': this.data[i].kdPegawai,
                                        'kdRuangan': this.data[i].kdRuangan,
                                        'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                        'tglKeluarAbsensi': this.data[i].tglKeluar,
                                        'isKoreksi': this.data[i].isKoreksi,
                                        'jenisKelamin': this.data[i].jenisKelamin,
                                        'namaKategori': this.data[i].namaKategoryPegawai,
                                        'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                        'isTglMerah': this.data[i].isTglMerah,
                                        'isTdkAbsen': this.data[i].isTdkAbsen,
                                        'isDinas': this.data[i].isDinas,
                                        'isCuti': this.data[i].isCuti,
                                        'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                        'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                    }
                                }
                            } else if (+this.data[i].pulang == 0 && +this.data[i].datang == 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': 0,
                                    'pulangM': 0,
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            }
                        }
                        this.listData = this.list;
                        this.hitungTotalMasukT();
                        this.hitungTotalMasukM();
                        this.hitungTotalJamKerja();
                        this.hitungTotalPulangT();
                        this.hitungTotalPulangM();
                        this.hitungTotalJamLembur();
                    });
                }
            } else {
                if (pegawai == null || pegawai == undefined || pegawai == '') {
                    this.urlList = Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findRekapByRuanganAndPeriode?kdPeriode=' + kdPeriode;
                } else {
                    this.urlList = Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/findRekapByRuanganAndPeriode?kdPeriode=' + kdPeriode + '&kdPegawai=' + pegawai;
                }
                this.httpService.get(this.urlList).subscribe(table => {
                    this.data = table.data.data;
                    for (let i = 0; i < this.data.length; i++) {
                        let jamLembur = 0;
                        let noHistori = null;
                        if (this.data[i].noHistori != undefined) {
                            noHistori = this.data[i].noHistori
                        }
                        if (this.data[i].jamLembur == 0) {
                            jamLembur = 0;
                        } else if (this.data[i].pulangAwal > 0) {
                            if (this.data[i].jamLembur > this.data[i].pulangAwal) {
                                jamLembur = Math.floor(this.data[i].pulangAwal / 60);
                            } else {
                                jamLembur = Math.floor(this.data[i].jamLembur / 60);
                            }

                        } else if (this.data[i].pulang > 0) {
                            if (this.data[i].jamLembur > this.data[i].pulang) {
                                jamLembur = Math.floor(this.data[i].pulang / 60);
                            } else {
                                jamLembur = Math.floor(this.data[i].jamLembur / 60);
                            }
                        } else if (this.data[i].namaShift == this.dataFixedShiftLibur) {
                            if (this.data[i].tglKeluar != '-' && this.data[i].tglMasukAbsensi != '-') {
                                jamLembur = ((this.data[i].tglKeluar - this.data[i].tglMasukAbsensi) / 60);
                            } else {
                                jamLembur = 0;
                            }
                            if (jamLembur > this.data[i].jamLembur) {
                                jamLembur = Math.floor(this.data[i].jamLembur / 60);
                            }
                        }
                        //Sk tidak absen tetep cek jam pulang 
                        // else if (this.data[i].isTdkAbsen == true) {
                        //     jamLembur = Math.floor(this.data[i].jamLembur/60);
                        // } 

                        //hitung Jam Produktif
                        let jamProduktif;
                        let hours = 0;
                        let rhours = 0;
                        let minutes = 0;
                        let rminutes = 0;
                        let jamBreak = 0;
                        if (this.data[i].statusAbsensi == 'Tidak Masuk' || this.data[i].statusAbsensi == 'Libur') {
                            jamProduktif = rhours + ' Jam ' + rminutes + ' Menit '
                            if (rminutes == 0) {
                                jamProduktif = rhours + ' Jam ';
                            }
                        } else {
                            let masuk = new Date(this.data[i].tglKalendar * 1000);
                            let pulang = new Date(this.data[i].tglKalendar * 1000);
                            let jamBreakAwal = this.data[i].jamBreakAwal.split(':');
                            let jamBreakAkhir = this.data[i].jamBreakAkhir.split(':');
                            let breakAwal = this.setTimeStamp(new Date(masuk.setHours(jamBreakAwal[0], jamBreakAwal[1], 0, 0)));
                            let breakAkhir = this.setTimeStamp(new Date(pulang.setHours(jamBreakAkhir[0], jamBreakAkhir[1], 0, 0)));
                            jamBreak = (((parseInt(breakAkhir) - parseInt(breakAwal)) / 60) / 60);

                            hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60) - jamBreak;
                            //jika jam masuk lebih dari jam istirahat
                            if (this.data[i].tglMasukAbsensi >= breakAkhir) {
                                hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                            }
                            //jika jam masuk ditengah tengah jam istirahat
                            if (this.data[i].tglMasukAbsensi >= breakAwal && this.data[i].tglMasukAbsensi <= breakAkhir) {
                                hours = (((parseInt(this.data[i].tglKeluar) - parseInt(breakAkhir)) / 60) / 60);
                            }
                            //jika jam keluar kurang dari jam istirahat
                            if (this.data[i].tglKeluar <= breakAwal) {
                                hours = (((parseInt(this.data[i].tglKeluar) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                            }
                            //jika jam masuk ditengah tengah jam istirahat
                            if (this.data[i].tglKeluar >= breakAwal && this.data[i].tglKeluar <= breakAkhir) {
                                hours = (((parseInt(breakAwal) - parseInt(this.data[i].tglMasukAbsensi)) / 60) / 60);
                            }

                            rhours = Math.floor(hours);
                            minutes = (hours - rhours) * 60;
                            rminutes = Math.round(minutes);
                            jamProduktif = rhours + ' Jam ' + rminutes + ' Menit '
                            if (rminutes == 0) {
                                jamProduktif = rhours + ' Jam ';
                            }
                            if (this.data[i].tglMasukAbsensi == '-' || this.data[i].tglKeluar == '-' || this.data[i].tglMasukAbsensi == null || this.data[i].tglKeluar == null) {

                                jamProduktif = 0 + ' Jam ';
                            }
                        }
                        if (+this.data[i].datangAwal > 0) {
                            if (+this.data[i].pulangAwal > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,

                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': Math.abs(this.data[i].datangAwal),
                                    'pulangM': Math.abs(this.data[i].pulangAwal),
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,

                                }
                            } else if (+this.data[i].pulang > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': Math.abs(this.data[i].datangAwal),
                                    'pulangM': 0,
                                    'pulangT': Math.abs(this.data[i].pulang),
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                };
                            } else if (+this.data[i].pulang == 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': Math.abs(this.data[i].datangAwal),
                                    'pulangM': 0,
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            }
                        } else if (+this.data[i].datang > 0) {
                            if (+this.data[i].pulang > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': Math.abs(this.data[i].datang),
                                    'datangT': 0,
                                    'pulangM': 0,
                                    'pulangT': Math.abs(this.data[i].pulang),
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            } else if (+this.data[i].pulangAwal > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': Math.abs(this.data[i].datang),
                                    'datangT': 0,
                                    'pulangM': Math.abs(this.data[i].pulangAwal),
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            } else if (+this.data[i].pulang == 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': Math.abs(this.data[i].datang),
                                    'datangT': 0,
                                    'pulangM': 0,
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            }
                        } else if (+this.data[i].pulangAwal > 0) {
                            if (+this.data[i].datangAwal > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': Math.abs(this.data[i].datangAwal),
                                    'pulangM': Math.abs(this.data[i].pulangAwal),
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            } else if (+this.data[i].datang > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': Math.abs(this.data[i].datang),
                                    'datangT': 0,
                                    'pulangM': Math.abs(this.data[i].pulangAwal),
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            } else if (+this.data[i].datang == 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': 0,
                                    'pulangM': Math.abs(this.data[i].pulangAwal),
                                    'pulangT': 0,
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            }
                        } else if (+this.data[i].pulang > 0) {
                            if (+this.data[i].datang > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': Math.abs(this.data[i].datang),
                                    'datangT': 0,
                                    'pulangM': 0,
                                    'pulangT': Math.abs(this.data[i].pulang),
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                };
                            } else if (+this.data[i].datangAwal > 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': Math.abs(this.data[i].datangAwal),
                                    'pulangM': 0,
                                    'pulangT': Math.abs(this.data[i].pulang),
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            } else if (+this.data[i].datang == 0) {
                                this.list[i] = {
                                    'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                    'nik': this.data[i].nik,
                                    'namaJabatan': this.data[i].namaJabatan,
                                    'namaRuangan': this.data[i].namaRuangan,
                                    'tanggal': this.data[i].tglKalendar,
                                    'namaShift': this.data[i].namaShift,
                                    'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                    'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                    'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                    'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                    'jamMasukView': this.data[i].jamMasuk,
                                    'jamPulangView': this.data[i].jamPulang,
                                    'tglMasukView': this.data[i].jamMasukAbsensi,
                                    'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                    'jamBreakAwal': this.data[i].jamBreakAwal,
                                    'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                    'datangM': 0,
                                    'datangT': 0,
                                    'pulangM': 0,
                                    'pulangT': Math.abs(this.data[i].pulang),
                                    'jamLembur': jamLembur,
                                    'statusAbsensi': this.data[i].statusAbsensi,
                                    'statusPegawai': this.data[i].statusPegawai,
                                    'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                    'statusPersonal': this.data[i].statusPersonal,
                                    'kdPegawai': this.data[i].kdPegawai,
                                    'kdRuangan': this.data[i].kdRuangan,
                                    'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                    'tglKeluarAbsensi': this.data[i].tglKeluar,
                                    'isKoreksi': this.data[i].isKoreksi,
                                    'jenisKelamin': this.data[i].jenisKelamin,
                                    'namaKategori': this.data[i].namaKategoryPegawai,
                                    'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                    'isTglMerah': this.data[i].isTglMerah,
                                    'isTdkAbsen': this.data[i].isTdkAbsen,
                                    'isDinas': this.data[i].isDinas,
                                    'isCuti': this.data[i].isCuti,
                                    'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                    'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                                }
                            }
                        } else if (+this.data[i].pulang == 0 && +this.data[i].datang == 0) {
                            this.list[i] = {
                                'namaLengkap': this.data[i].namaLengkap, 'noHistori': noHistori,
                                'nik': this.data[i].nik,
                                'namaJabatan': this.data[i].namaJabatan,
                                'namaRuangan': this.data[i].namaRuangan,
                                'tanggal': this.data[i].tglKalendar,
                                'namaShift': this.data[i].namaShift,
                                'jamMasuk': this.data[i].jamMasuk.replace(":", "."),
                                'jamPulang': this.data[i].jamPulang.replace(":", "."),
                                'tglMasuk': this.data[i].jamMasukAbsensi.replace(":", "."),
                                'tglKeluar': this.data[i].jamKeluarAbsensi.replace(":", "."),
                                'jamMasukView': this.data[i].jamMasuk,
                                'jamPulangView': this.data[i].jamPulang,
                                'tglMasukView': this.data[i].jamMasukAbsensi,
                                'tglKeluarView': this.data[i].jamKeluarAbsensi,
                                'jamBreakAwal': this.data[i].jamBreakAwal,
                                'jamBreakAkhir': this.data[i].jamBreakAkhir,
                                'datangM': 0,
                                'datangT': 0,
                                'pulangM': 0,
                                'pulangT': 0,
                                'jamLembur': jamLembur,
                                'statusAbsensi': this.data[i].statusAbsensi,
                                'statusPegawai': this.data[i].statusPegawai,
                                'kodeExternalStatus': this.data[i].kodeExternalStatus,
                                'statusPersonal': this.data[i].statusPersonal,
                                'kdPegawai': this.data[i].kdPegawai,
                                'kdRuangan': this.data[i].kdRuangan,
                                'tglMasukAbsensi': this.data[i].tglMasukAbsensi,
                                'tglKeluarAbsensi': this.data[i].tglKeluar,
                                'isKoreksi': this.data[i].isKoreksi,
                                'jenisKelamin': this.data[i].jenisKelamin,
                                'namaKategori': this.data[i].namaKategoryPegawai,
                                'tanggalGabung': this.data[i].tglMasukPerusahaan,
                                'isTglMerah': this.data[i].isTglMerah,
                                'isTdkAbsen': this.data[i].isTdkAbsen,
                                'isDinas': this.data[i].isDinas,
                                'isCuti': this.data[i].isCuti,
                                'isPhk': this.data[i].isPhk, 'isResign': this.data[i].isResign, 'isPensiun': this.data[i].isPensiun,
                                'isIzinOrSakit': this.data[i].isIzinOrSakit, 'jamProduktifPegawai': jamProduktif, 'tglMasukPerusahaan': this.data[i].tglMasukPerusahaan, 'tglKalendar': this.data[i].tglKalendar, 'tglKeluarPegawai': this.data[i].tglKeluarPegawai,
                            }
                        }
                    }
                    this.listData = this.list;
                    this.hitungTotalMasukT();
                    this.hitungTotalMasukM();
                    this.hitungTotalJamKerja();
                    this.hitungTotalPulangT();
                    this.hitungTotalPulangM();
                    this.hitungTotalJamLembur();
                });
            }
        }
    }

    getLegend() {
        let tampungGabung = [];
        let jumlahTampung = [];

        this.httpService.get(Configuration.get().dataHr2Mod3 + '/rekapitulasiAbsensi/getStatusPegawaiAll').subscribe(table => {
            this.status = table.data;
        });
    }

}


