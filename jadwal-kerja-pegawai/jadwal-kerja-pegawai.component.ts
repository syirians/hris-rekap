import { Component, OnInit } from '@angular/core';
import { HttpClient } from '../../../global/service/HttpClient';
import { Observable } from 'rxjs/Rx';
import { LazyLoadEvent, Message, ConfirmDialogModule, ConfirmationService } from 'primeng/primeng';
import { AlertService, InfoService, Configuration, AuthGuard, UserDto, FileService } from '../../../global';
import * as _ from 'underscore';
import { CanDeactivate, Router, ActivatedRoute } from '@angular/router';
import { Observer } from 'rxjs';
@Component({
    selector: 'app-jadwal-kerja-pegawai',
    templateUrl: './jadwal-kerja-pegawai.component.html',
    styleUrls: ['./jadwal-kerja-pegawai.component.scss'],
    providers: [ConfirmationService]
})
export class JadwalKerjaPegawaiComponent implements OnInit {
    listTahun: any = [];
    listBulan: any = [];
    listRuangan: any = [];
    listTanggal: any = [];
    listPegawai: any = [];
    listPegawaiView: any = [];
    listHariLibur: any = [];
    errorShift: any[];
    blockData: boolean
    kdBulan: any;
    kdTahun: any;
    namaBulan: string;
    date10: Date;
    kdunitKerja: any;
    disableButton: boolean;
    isOtomatis: boolean;
    dataFixed: any;
    dataFixedKelompokTransaksi: any;
    listPeriodeHead: any[];
    listPeriode: any[];
    kdPeriode: any;
    kdPeriodeHead: any;
    selectedPeriode: any[];
    checkedAll: boolean;
    kdShifLibur: any[];
    dataFixedKelompok: any[];
    kdWarna: any;
    listData: any[]
    dataFixedKeterangan: any[];
    isChange: boolean = false;
    disPeriode: boolean = false;
    kdShiftLibur: any;
    tempEventPeriode: any;
    namaPeriode: any;
    kdPeriodeHeadEvent: any;

    jumlahHari: any;
    uiGrid: any;
    sidebar: boolean;
    test: string;
    iconSideBar: any;
    periodeDiv: any;
    styleSidebar: any;
    jumlahData: any;

    base64textString: any;
    namaDokumen: any;
    myfile: any[];
    dataEx: any[];
    tempEventPeriodeV1: any[];
    constructor(private httpService: HttpClient,
        private alertService: AlertService,
        private infoService: InfoService,
        private confirmationService: ConfirmationService,
        private authGuard: AuthGuard,
        private fileService: FileService,
        private route: ActivatedRoute) { }

    ngOnInit() {
        this.myfile = [];
        this.iconSideBar = "fa fa-angle-right";
        this.test = null;
        this.sidebar = false;
        this.uiGrid = 12;
        this.periodeDiv = 1;
        this.jumlahHari = 31;
        this.jumlahData = 0;
        this.tempEventPeriodeV1 = [];
        var u = document.getElementsByName("tdDynamic");
        for (var i = 0; i < u.length; i++) {
            u[i].setAttribute("colspan", this.jumlahHari);
        }
        this.checkedAll = false;
        this.isOtomatis = false;
        this.listPegawaiView = [];
        this.listTahun = [];
        this.listBulan = [];
        this.selectedPeriode = [];
        this.checkedAll = false;
        for (let i = 2000; i <= new Date().getFullYear() + 20; i++) {
            this.listTahun.push({ label: i, value: i });
        };
        for (let i = 0; i <= 11; i++) {
            this.listBulan.push({ label: this.numberToMonth(i), value: i })
        };
        let tanggal = new Date();
        let bulan = tanggal.getMonth();
        let tahun = tanggal.getFullYear();
        this.kdBulan = bulan;
        this.kdTahun = tahun;
        this.listTanggal = [];
        this.kdunitKerja = this.authGuard.getUserDto().idRuangan;
        this.cekIdFingerPrint(this.kdunitKerja);
        let jumlahHari = this.getJumlahHari(this.kdTahun, this.kdBulan)
        for (let j = 1; j <= jumlahHari; j++) {
            this.listTanggal.push({ "id": j })
        }
        this.namaBulan = this.numberToMonth(this.kdBulan)
        this.get();
        this.findLastPeriode();
    }

    canDeactivate() {
        // let dataLocalEvent = JSON.parse(localStorage.getItem(this.authGuard.getUserDto().kdProfile + "jadwalKerja"));

        // if (dataLocalEvent !== undefined || dataLocalEvent !== null) {
        //     this.isChange=dataLocalEvent.isChange;
        // }
        if (!this.isChange) {
            return true;
        }
        return Observable.create((observer: Observer<boolean>) => {
            this.confirmationService.confirm({
                message: 'Ada perubahan jadwal. Apakah Anda Yakin Akan Meninggalkan Halaman Ini?',
                header: 'Confirmation',
                icon: 'fa fa-question-circle',
                accept: () => {
                    observer.next(true);
                    observer.complete();
                },
                reject: () => {
                    observer.next(false);
                    observer.complete();
                }
            });
        });
    }

    get() {
        this.kdShifLibur = [];
        this.httpService.get(Configuration.get().dataMaster + '/service/list-generic/?table=Ruangan&select=namaRuangan,id.kode&criteria=kdRuanganHead&values=' + this.authGuard.getUserDto().kdLokasi).subscribe(res => {
            this.listRuangan = [];
            this.listRuangan.push({ label: '-- Pilih --', value: '' });
            for (var i = 0; i < res.data.data.length; i++) {
                this.listRuangan.push({ label: res.data.data[i].namaRuangan, value: res.data.data[i].id_kode })
            };
        },
            error => {
                this.listRuangan = [];
                this.listRuangan.push({ label: '-- ' + error + ' --', value: '' })
            });

        this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/getSettingDataFixed').subscribe(res => {
            this.dataFixed = res.data;
            this.dataFixedKelompokTransaksi = res.data.kelompokTransaksi;
            let kdShiftNonShift = []
            let kdKelompokShift = res.data.kdKelompokShiftNonShift
            for (let i = 0; i < this.dataFixedKelompokTransaksi.length; i++) {
                if (this.dataFixedKelompokTransaksi[i].idKelompokShift == kdKelompokShift) {
                    for (let j = 0; j < this.dataFixedKelompokTransaksi[i].details.length; j++) {
                        kdShiftNonShift.push(this.dataFixedKelompokTransaksi[i].details[j].kdShift)
                    }
                }
            }
            this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/getKodeLibur').subscribe(table => {
                this.kdShifLibur = table.data;
                this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/getAllShift').subscribe(respone => {
                    this.dataFixedKeterangan = respone.data;
                    let fix = [];
                    let warna = ["fill blue", "fill orange", "fill green", "fill navi", "fill grey", "fill ijo1", "fill ijo2", "fill ijo3"];
                    this.dataFixedKelompok = [];

                    for (var i = 0; i < this.dataFixedKeterangan.length; i++) {

                        if (this.dataFixedKeterangan[i].namaShift == table.data.namaShift) {
                            this.dataFixedKelompok[i] = {
                                'kode': this.dataFixedKeterangan[i].kodeExternal,
                                'warna': "fill libur",
                                'namaShift': this.dataFixedKeterangan[i].namaShift,
                                'jamMasuk': this.dataFixedKeterangan[i].jamMasuk,
                                'jamPulang': this.dataFixedKeterangan[i].jamPulang

                            }
                        } else if (kdShiftNonShift.includes(this.dataFixedKeterangan[i].kdShift)) {
                            this.dataFixedKelompok[i] = {
                                'kode': this.dataFixedKeterangan[i].kodeExternal,
                                'warna': "fill nonShift",
                                'namaShift': this.dataFixedKeterangan[i].namaShift,
                                'jamMasuk': this.dataFixedKeterangan[i].jamMasuk,
                                'jamPulang': this.dataFixedKeterangan[i].jamPulang
                            }
                        } else {
                            this.dataFixedKelompok[i] = {
                                'kode': this.dataFixedKeterangan[i].kodeExternal,
                                'warna': "fill shift",
                                'namaShift': this.dataFixedKeterangan[i].namaShift,
                                'jamMasuk': this.dataFixedKeterangan[i].jamMasuk,
                                'jamPulang': this.dataFixedKeterangan[i].jamPulang
                            }
                        }
                    }
                    this.listData = this.dataFixedKelompok;
                });
            });


        });
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/findAllPeriodeJadwalHead').subscribe(res => {
            this.listPeriodeHead = [];
            this.listPeriodeHead.push({ label: '-- Pilih --', value: null })
            for (var i = 0; i < res.data.length; i++) {
                this.listPeriodeHead.push({ label: res.data[i].namaPeriode, value: res.data[i].kdPeriode })
            };
        });
        this.listPeriode = [];
    }

    findLastPeriode() {
        this.httpService.get(Configuration.get().dataHr1Mod1 + '/suratKeputusan/findLastPeriode').subscribe(res => {
            let periodeJadwal = res.data.periodeJadwal;
            let tahunSkr = res.data.tahunSkr;
            let tahunDpn = res.data.tahunDpn;

            let ingat = false
            let peringatanHabis1 = '';
            let tahunSkrTxt = ' tahun sekarang (' + tahunSkr + ')'

            let per = 'Periode ' + tahunSkrTxt

            if (periodeJadwal <= 0) {
                ingat = true
                peringatanHabis1 = per + ' jadwal sudah habis dan periode jadwal untuk tahun depan (' + tahunDpn + ') belum dibuat.'
            } else if (periodeJadwal < 4) {
                ingat = true
                peringatanHabis1 = per + ' jadwal hampir habis, tersisa ' + periodeJadwal + ' periode lagi dan periode jadwal untuk tahun depan (' + tahunDpn + ') belum dibuat.'
            }

            if (ingat) {
                this.alertService.warn('Peringatan', peringatanHabis1);
            }
        });
    }


    getKode(event) {
        this.kdPeriodeHeadEvent = event;
        console.log(this.selectedPeriode);
        console.log(this.tempEventPeriodeV1);
        this.selectedPeriode = [];
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/perhitungan-gaji/findPeriodeByHead?kdPeriode=' + event.value).subscribe(res => {
            this.listPeriode = res.data.periodeHead;
            this.listPeriode.forEach(function (data) {
                data.status = false;
            })
            if (this.tempEventPeriodeV1.length != 0) {
                for (let i = 0; i < this.tempEventPeriodeV1.length; i++) {
                    let index = this.listPeriode.map(function (e) { return e.kode.kode; }).indexOf(this.tempEventPeriodeV1[i].kode.kode);
                    this.listPeriode[index].status = true;
                }
                this.selectedPeriode = this.tempEventPeriodeV1;
            }
            this.tempEventPeriodeV1 = [];
            // this.checkedAll = false;

        });
    }
    getPegawaiOtomatis() {
        this.listPegawaiView = [];
        this.blockData = true;
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/findJadwalPegawai?kdRuangan=' + this.kdunitKerja + '&bulan=' + (this.kdBulan + 1) + '&tahun=' + this.kdTahun).subscribe(res => {
            this.listPegawai = res.data.data;
            this.listPegawaiView = [];
            let error = [];
            let formatNomor = 1;
            this.jumlahHari = res.data.data[0].jadwal.length;
            for (let i = 0; i < this.listPegawai.length; i++) {
                let dataTemp = {
                    "nomor": formatNomor++,
                    "kdPegawai": this.listPegawai[i].kdPegawai,
                    "namaLengkap": this.listPegawai[i].namaLengkap,
                    "kdRuangan": this.listPegawai[i].kdRuangan,
                    // "kelompokShift": this.listPegawai[i].kelompokShift,
                    // "kdKelompokShift": this.listPegawai[i].kdKelompokShift,
                    "jadwal": []
                }
                let jumlahLoop = this.listPegawai[i].jadwal.length;
                let jumlahHari = this.getJumlahHari(this.kdTahun, this.kdBulan);
                for (let j = 0; j < jumlahLoop; j++) {
                    if (this.listPegawai[i].jadwal[j].shiftKerja == null && this.listPegawai[i].jadwal[j].kdKelompokShift == this.dataFixed.kdKelompokShiftNonShift) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": undefined,
                            "kodeExternal": "-",
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null
                        }
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                    } else if (this.listPegawai[i].jadwal[j].shiftKerja != null) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": this.listPegawai[i].jadwal[j].shiftKerja.kode,
                            "kodeExternal": this.listPegawai[i].jadwal[j].shiftKerja.kodeExternal,
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null
                        }
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                    } else {
                        // if (this.listPegawai[i].jadwal[j].shiftKerja == null && dataTemp.kdKelompokShift == this.dataFixedKelompokTransaksi[2]) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": 100,
                            "kodeExternal": "-",
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null
                        }
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                    }
                }
                this.listPegawai[i] = dataTemp;
                this.listPegawaiView.push(this.listPegawai[i]);
            }
            this.errorShift = [];
            if (error.length != 0) {
                for (let k = 0; k < error.length; k++) {
                    // this.errorShift.push({ severity: 'warn', summary: error[k], detail: 'Belum Memiliki Kelompok Shift' });
                }
            }
            /*this.listPegawaiView.forEach(function (data) {
                data.jadwal.sort(function (a, b) {
                    return a.tanggal - b.tanggal;
                });
            })*/
            this.blockData = false;
        },
            error => {
                this.blockData = false;



            });

    }
    tampilkanJadwalManual() {
        this.listPegawaiView = [];
        this.listPegawai = [];
        this.blockData = true;
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/findJadwalPegawaiManualPerPeriode?kdRuangan=' + this.kdunitKerja + '&kdPeriode=' + this.kdPeriode + '&nmPeriode=' + this.namaPeriode).subscribe(res => {
            this.listPegawaiView = [];
            this.listPegawai = res.data.data;
            let error = [];
            let formatNomor = 1;
            this.jumlahHari = 31;
            this.jumlahData = res.data.data.length;
            if (res.data.data != 0) {
                this.jumlahHari = res.data.data[0].jadwal.length;
            }
            var u = document.getElementsByName("tdDynamic");
            for (var i = 0; i < u.length; i++) {
                u[i].setAttribute("colspan", this.jumlahHari);
            }


            for (let i = 0; i < this.listPegawai.length; i++) {
                let errorShift = []
                let dataTemp = {
                    "nomor": formatNomor++,
                    "kdPegawai": this.listPegawai[i].kdPegawai,
                    "namaLengkap": this.listPegawai[i].namaLengkap,
                    "kdRuangan": this.listPegawai[i].kdRuangan,
                    "tglClosing": null,
                    "jadwal": []
                }
                let jumlahLoop = this.listPegawai[i].jadwal.length;
                // let jumlahHari = this.getJumlahHari(this.kdTahun, this.kdBulan);
                for (var j = 0; j < jumlahLoop; j++) {
                    //apabila shifkerja kosong dan kelompok shift sama dengan non shift
                    if (this.listPegawai[i].jadwal[j].shiftKerja == null && this.listPegawai[i].jadwal[j].kdKelompokShift == this.dataFixed.kdKelompokShiftNonShift) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": undefined,
                            "kodeExternal": "-",
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "tanggalLong": this.listPegawai[i].jadwal[j].tanggal.tanggal,
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null,
                            "isCuti": this.listPegawai[i].jadwal[j].isCuti,
                            "isIzinSakit": this.listPegawai[i].jadwal[j].isIzinSakit,
                            "isLibur": this.listPegawai[i].jadwal[j].isLibur,
                            "isCutiSet": this.listPegawai[i].jadwal[j].isCuti,
                            "isLiburSet": this.listPegawai[i].jadwal[j].isLibur,
                        }
                        //apabila tidak jadwal kosong
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        if (j == 0) {
                            dataTemp.tglClosing = this.listPegawai[i].jadwal[j].tglClosing;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                        //shif kerja kosng dan kelompok shift bukan non shift
                    } else if (this.listPegawai[i].jadwal[j].shiftKerja != null) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": this.listPegawai[i].jadwal[j].shiftKerja.kode,
                            "kodeExternal": this.listPegawai[i].jadwal[j].shiftKerja.kodeExternal,
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "tanggalLong": this.listPegawai[i].jadwal[j].tanggal.tanggal,
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null,
                            "isIzinSakit": this.listPegawai[i].jadwal[j].isIzinSakit,
                            "isCuti": this.listPegawai[i].jadwal[j].isCuti,
                            "isLibur": this.listPegawai[i].jadwal[j].isLibur,
                            "isCutiSet": this.listPegawai[i].jadwal[j].isCuti,
                            "isLiburSet": this.listPegawai[i].jadwal[j].isLibur,
                        }
                        //apabila jawal tidak kosng
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        if (j == 0) {
                            dataTemp.tglClosing = this.listPegawai[i].jadwal[j].tglClosing;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                    } else {
                        // if (this.listPegawai[i].jadwal[j].shiftKerja == null && dataTemp.kdKelompokShift == this.dataFixed) {
                        let hari = new Date(this.listPegawai[i].jadwal[j].tanggal.tanggal * 1000);
                        let dataJadwaltemp = {
                            "kdShift": undefined,
                            "kodeExternal": "-",
                            "kdkalender": this.listPegawai[i].jadwal[j].tanggal.kdTanggal,
                            "tanggal": hari.getDate(),
                            "tanggalLong": this.listPegawai[i].jadwal[j].tanggal.tanggal,
                            "kdKelompokShift": this.listPegawai[i].jadwal[j].kdKelompokShift,
                            "kelompokShift": this.listPegawai[i].jadwal[j].kelompokShift,
                            "noHistori": null,
                            "noRec": null,
                            "isIzinSakit": this.listPegawai[i].jadwal[j].isIzinSakit,
                            "isCuti": this.listPegawai[i].jadwal[j].isCuti,
                            "isLibur": this.listPegawai[i].jadwal[j].isLibur,
                            "isCutiSet": this.listPegawai[i].jadwal[j].isCuti,
                            "isLiburSet": this.listPegawai[i].jadwal[j].isLibur,
                        }
                        //apabila jadwal tidak kosng
                        if (this.listPegawai[i].jadwal[j].jadwalKerja != undefined) {
                            dataJadwaltemp.noHistori = this.listPegawai[i].jadwal[j].jadwalKerja.noHistori;
                            dataJadwaltemp.noRec = this.listPegawai[i].jadwal[j].jadwalKerja.noRec;
                        }
                        if (j == 0) {
                            dataTemp.tglClosing = this.listPegawai[i].jadwal[j].tglClosing;
                        }
                        dataTemp.jadwal.push(dataJadwaltemp);
                        //apabila shift kerja tidak kosong
                    }
                }
                dataTemp.jadwal.forEach(function (data) {
                    if (data.kdKelompokShift == undefined) {
                        errorShift.push(data.tanggal)
                    }
                })
                this.listPegawai[i] = dataTemp;
                this.listPegawaiView.push(this.listPegawai[i]);
                if (errorShift.length != 0) {
                    error.push({
                        "namaLengkap": dataTemp.namaLengkap,
                        "tanggal": errorShift,
                        "jumlahHariKerja": dataTemp.jadwal.length
                    })
                }
            }
            this.errorShift = [];
            if (error.length != 0) {
                for (let k = 0; k < error.length; k++) {
                    if (error[k].jumlahHariKerja == error[k].tanggal.length) {
                        this.disableButton = true;
                        this.errorShift.push({ severity: 'warn', summary: error[k].namaLengkap, detail: 'Belum Memiliki Kelompok Shift Pada Tanggal ' + error[k].tanggal.toString() });
                    } else {
                        this.disableButton = false;
                    }
                }
            }
            /*this.listPegawaiView.forEach(function (data) {
                data.jadwal.sort(function (a, b) {
                    return a.tanggal - b.tanggal;
                });
            })*/
            this.blockData = false;
            console.log(this.listPegawaiView);
        },
            error => {
                this.blockData = false;
            }
        );
    }
    clearPeriode(event) {
        // this.checkedAll = false;
        this.cekIdFingerPrint(event.value)

    }

    cekIdFingerPrint(event) {
        this.httpService.get(Configuration.get().dataHr2Mod3 + '/PegawaiHistoriAbsensi/getStatusIdFingerPrint?kdUnitKerja=' + event).subscribe(res => {
            this.errorShift = [];
            if (res.pegawai != null) {
                this.listPeriode = [];
                this.disPeriode = true;
                for (let k = 0; k < res.pegawai.length; k++) {
                    this.errorShift.push({ severity: 'warn', summary: res.pegawai[k].namaLengkap, detail: 'Belum memiliki finger print ID ' });
                }
            } else {
                this.disPeriode = false;
                this.checkAll(false);
            }
        });
    }
    checked(data) {
        if (data.status) {
            this.selectedPeriode.push(data);
            if (this.selectedPeriode.length == 1) {
                let dataEvent = {
                    "data": data
                }
                this.pilihPeriode(dataEvent);
            }
        } else {
            let dataSelected = [...this.selectedPeriode];
            let selectedPeriode = dataSelected.filter(function (obj) {
                return obj.kode.kode !== data.kode.kode;
            });

            this.selectedPeriode = selectedPeriode
        }

    }
    checkAll(event) {
        // for (let i = 0; i < this.listPeriode.length; i++) {
        //     if (event) {
        //         if (this.listPeriode[i].tglHistoriBefore == null) {
        //             if (!this.listPeriode[i].status) {
        //                 this.listPeriode[i].status = true;
        //                 this.selectedPeriode.push(this.listPeriode[i])
        //             }
        //         }
        //     } else {
        //         this.listPeriode[i].status = false;
        //     }
        // }
        // if (!event) {
        //     this.selectedPeriode = [];
        // }

        let dataLocalEvent = JSON.parse(localStorage.getItem(this.authGuard.getUserDto().kdProfile + "pilPeriodejJadwal"));

        if (dataLocalEvent === undefined || dataLocalEvent === null) {
            if (this.selectedPeriode.length == 0) {
                let dataEvent = {
                    "data": this.listPeriode[0]
                }
                this.pilihPeriode(dataEvent)
            } else {
                let dataEvent = {
                    "data": this.selectedPeriode[0]
                }
                this.pilihPeriode(dataEvent)
            }
        } else {
            this.pilihPeriode(dataLocalEvent);
        }
    }
    seleksiPeriode(event) {
        if (event == true) {
            let data = [...this.selectedPeriode];
            let selectedPeriode = data.filter(function (el) {
                return el.tglHistoriBefore == null;
            });
            this.selectedPeriode = selectedPeriode;
        } else {
            this.selectedPeriode = []
        }

    }
    perubahanData(event) {
        this.confirmationService.confirm({
            message: 'Ada perubahan jadwal, apakah data yang sebelumnya ingin disimpan?',
            header: 'Confirmation',
            icon: 'fa fa-question-circle',
            accept: () => {
                this.isChange = false;
                this.simpan();
                // this.pilihPeriode(event);
            },
            reject: () => {
                this.alertService.warn('Peringatan', 'Perubahan Tidak Disimpan');
                this.isChange = false;
                this.tampilkanJadwalManual();
                // this.pilihPeriode(event)
            }
        });
    }
    pilihPeriode(event) {

        localStorage.setItem(this.authGuard.getUserDto().kdProfile + "pilPeriodejJadwal", JSON.stringify(event));

        if (this.isChange == true) {
            this.perubahanData(this.tempEventPeriode);
        } else {
            this.tempEventPeriode = event;
            if (event.data == undefined) {
                this.alertService.warn('Peringatan', 'Periode Belum Dipilih');
            } else {
                this.disableButton = false;
                this.namaBulan = event.data.namaPeriode
                this.kdPeriode = event.data.kode.kode
                this.listTanggal = []; 102
                let date1 = new Date(event.data.tglAwalPeriode * 1000);
                let date2 = new Date(event.data.tglAkhirPeriode * 1000);
                let timeDiff = Math.abs(date2.getTime() - date1.getTime());
                let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                // console.log(diffDays);
                for (let i = 0; i <= diffDays - 1; i++) {
                    if (i == 0) {
                        this.listTanggal.push({ "id": date1.getDate() })
                    } else {
                        date1.setDate(date1.getDate() + 1)
                        this.listTanggal.push({ "id": date1.getDate() })
                    }
                }
                this.listPegawaiView = [];
                this.listPegawai = [];
                this.namaPeriode = event.data.namaPeriode;
                // this.getPegawaiManual(this.kdunitKerja, event.data.kode.kode, event.data.namaPeriode);
                this.tampilkanJadwalManual();
                this.httpService.get(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/findHariLiburByPeriode/' + event.data.kode.kode).subscribe(table => {
                    this.listHariLibur = table.data;
                });
                // if (event.data.noHistoriBefore != null) {
                //     this.disableButton = true;
                //     this.isChange = false;
                //     this.alertService.warn('Peringatan', 'Jadwal Periode ' + event.data.namaPeriode + ' sudah direkap');
                // }
            }
        }
    }
    getJumlahHari(tahun, bulan) {
        let jumlahHari = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let jumlahHariKabisat = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (tahun % 4 == 0) {
            return jumlahHariKabisat[bulan]
        } else {
            return jumlahHari[bulan]
        }
    }
    numberToMonth(number) {
        let monthNames = [
            "Januari", "Februari", "Maret",
            "April", "Mei", "Juni", "Juli",
            "Agustus", "September", "Oktober",
            "November", "Desember"
        ];
        return monthNames[number]
    }
    changeShift3(item, tanggal) {
        // console.log(item);
        // console.log(tanggal);

        let kodeShift = ["", "P", "S", "M", "L"]
        if (tanggal.kdShift == undefined || tanggal.kdShift == 100) {
            tanggal.kdShift = 1
            tanggal.kodeExternal = "-";
        } else {
            let kdShift = tanggal.kdShift;
            kdShift = kdShift + 1;
            if (kdShift == 3) {
                kdShift = 4
            }
            if (kdShift == 5) {
                kdShift = 1
            }
            tanggal.kdShift = kdShift;
            tanggal.kodeExternal = kodeShift[kdShift];
        }
        // this.disableButton = false;
    }
    changeShift2(item, tanggal) {
        // console.log(item.kelompokShift);
        // console.log(tanggal);
        let kodeShift = ["", "P", "S", "M", "L"]
        if (tanggal.kdShift == undefined || tanggal.kdShift == 99) {
            tanggal.kdShift = 1
            tanggal.kodeExternal = "P";
        } else {
            let kdShift = tanggal.kdShift;
            kdShift = kdShift + 1;
            if (kdShift == 5) {
                kdShift = 1
            }
            tanggal.kdShift = kdShift;
            tanggal.kodeExternal = kodeShift[kdShift];
        }
        // this.disableButton = false;
    }


    changeShift1(item, tanggal) {
        // console.log(item, tanggal);
        // "kelompokShift": item.kelompokShift,
        // "kdKelompokShift": this.listPegawai[i].kdKelompokShift,
        let kodeShift;
        let kode;
        if (item.tglClosing != null) {
            this.alertService.warn('Peringatan', 'Periode ' + this.namaBulan +' Untuk Pegawai '+ item.namaLengkap+' Sudah di Closing');
        } else {
            if (tanggal.isCuti == true) {
                kodeShift = ["C"];
                kode = ["C"];
            } else {
                if (tanggal.isCutiSet == true) {
                    kodeShift = ["C"];
                    kode = ["C"];
                } else {
                    kodeShift = ["-"];
                    kode = ["-"];
                }
            }
            for (let j = 0; j < tanggal.kelompokShift.length; j++) {
                kodeShift.push(tanggal.kelompokShift[j].kodeExternal)
            }
            for (let j = 0; j < tanggal.kelompokShift.length; j++) {
                kode.push(tanggal.kelompokShift[j].kdShift)
            }
            // console.log(kodeShift);

            // let kodeShift = ["","P","S","M","L"]
            if (tanggal.kdShift == undefined) {
                tanggal.kdShift = kode[0];
                tanggal.kodeExternal = kodeShift[0];
            } else {
                let kdShift = kode.indexOf(tanggal.kdShift);
                kdShift = kdShift + 1;
                if (kdShift == kodeShift.length) {
                    kdShift = 1;
                }
                tanggal.kdShift = kode[kdShift];
                tanggal.kodeExternal = kodeShift[kdShift];
                if (tanggal.isCuti == true) {
                    if (tanggal.kdShift == this.dataFixed.shiftLibur.id.kode) {
                        tanggal.isCuti = false;
                        tanggal.isLibur = true;
                    }
                }
            }
            if (this.disableButton == true) {
                this.isChange = false;
                localStorage.setItem(this.authGuard.getUserDto().kdProfile + "jadwalKerja", JSON.stringify({ "isChange": false }));
            } else {
                this.isChange = true;
                localStorage.setItem(this.authGuard.getUserDto().kdProfile + "jadwalKerja", JSON.stringify({ "isChange": true }));
            }
        }
        // this.disableButton = false;
    }

    simpanPerPeriode() {
        let pegawai = {
            "kdRuangan": this.kdunitKerja,
            "kdPeriode": this.kdPeriode,
            "pegawai": []
        }
        for (let i = 0; i < this.listPegawaiView.length; i++) {
            for (let j = 0; j < this.listPegawai[i].jadwal.length; j++) {
                if (this.listPegawai[i].jadwal[j].kdkalender == 1331 && this.listPegawaiView[i].kdPegawai == 'P0046') {
                    debugger;
                }
                let setCuti = this.listPegawai[i].jadwal[j].isCuti;
                let setLibur = this.listPegawai[i].jadwal[j].isLibur;
                if (this.listPegawai[i].jadwal[j].kdKelompokShift != this.dataFixed.kdKelompokShiftNonShift) {
                    if (this.listPegawai[i].jadwal[j].isCuti == false && this.listPegawai[i].jadwal[j].isCutiSet == true) {
                        if (this.listPegawai[i].jadwal[j].kdShift == this.dataFixed.shiftLibur.id.kode) {
                            setCuti = true;
                            setLibur = false;
                        }
                    }
                }
                if (this.listPegawai[i].jadwal[j].noHistori == null && this.listPegawai[i].jadwal[j].kdKelompokShift != null) {
                    let dataTemp = {
                        "kdPegawai": this.listPegawaiView[i].kdPegawai,
                        "kdRuangan": this.listPegawaiView[i].kdRuangan,
                        "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                        "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                        "isCuti": setCuti,
                        "isLibur": setLibur,
                    }
                    pegawai.pegawai.push(dataTemp);
                } else if (this.listPegawai[i].jadwal[j].kdKelompokShift != null) {

                    let dataTemp = {
                        "kdPegawai": this.listPegawaiView[i].kdPegawai,
                        "kdRuangan": this.listPegawaiView[i].kdRuangan,
                        "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                        "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                        "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                        "noRec": this.listPegawai[i].jadwal[j].noRec,
                        "isCuti": setCuti,
                        "isLibur": setLibur,
                    }
                    pegawai.pegawai.push(dataTemp);
                } else if (this.listPegawai[i].jadwal[j].kdKelompokShift == null) {
                    let dataTemp = {
                        "kdPegawai": this.listPegawaiView[i].kdPegawai,
                        "kdRuangan": this.listPegawaiView[i].kdRuangan,
                        "kdShift": this.dataFixed.shiftLibur.id.kode,
                        "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                        "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                        "noRec": this.listPegawai[i].jadwal[j].noRec,
                        "isCuti": setCuti,
                        "isLibur": setLibur,
                    }
                    pegawai.pegawai.push(dataTemp);
                }

            }
        }
        this.httpService.post(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/save', pegawai).subscribe(response => {
            this.alertService.success('Simpan', 'Data Disimpan');

            this.httpService.get(Configuration.get().dataHr2Mod3 + '/perhitungan-gaji/findPeriodeByHead?kdPeriode=' + this.kdPeriodeHead).subscribe(res => {
                this.listPeriode = res.data.periodeHead;
            });
        });
    }
    simpan() {
        this.disableButton = true;
        this.tempEventPeriodeV1 = [];
        if (this.selectedPeriode.length == 0) {
            this.alertService.warn('Peringatan', 'Harap Pilih Periode');
        } else if (this.selectedPeriode.length == 1) {
            this.tempEventPeriodeV1 = this.selectedPeriode;
            let errors = [];
            let errorShift = [];
            let pegawai = {
                "kdRuangan": this.kdunitKerja,
                "kdPeriode": this.tempEventPeriode.data.kode.kode,
                "pegawai": []
            }
            for (let i = 0; i < this.listPegawaiView.length; i++) {
                errorShift[i] = {
                    "namaLengkap": this.listPegawaiView[i].namaLengkap,
                    "tanggal": [],
                }
                for (let j = 0; j < this.listPegawai[i].jadwal.length; j++) {
                    let setCuti = this.listPegawai[i].jadwal[j].isCuti;
                    let setLibur = this.listPegawai[i].jadwal[j].isLibur;
                    if (this.listPegawai[i].tglClosing == null) {
                        if (this.listPegawai[i].jadwal[j].kdKelompokShift != this.dataFixed.kdKelompokShiftNonShift) {
                            if (this.listPegawai[i].jadwal[j].isCuti == false && this.listPegawai[i].jadwal[j].isCutiSet == true) {
                                if (this.listPegawai[i].jadwal[j].kdShift !== this.dataFixed.shiftLibur.id.kode) {
                                    setCuti = true;
                                    setLibur = false;
                                }
                            }
                        }
                        if (this.listPegawai[i].jadwal[j].noHistori == null && this.listPegawai[i].jadwal[j].kdKelompokShift != null && this.listPegawai[i].jadwal[j].kdShift != undefined) {
                            let dataTemp = {
                                "kdPegawai": this.listPegawaiView[i].kdPegawai,
                                "kdRuangan": this.listPegawaiView[i].kdRuangan,
                                "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                                "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                                "isCuti": setCuti,
                                "isLibur": setLibur,
                            }
                            pegawai.pegawai.push(dataTemp);
                        } else if (this.listPegawai[i].jadwal[j].kdKelompokShift != null && this.listPegawai[i].jadwal[j].kdShift != undefined) {
                            let dataTemp = {
                                "kdPegawai": this.listPegawaiView[i].kdPegawai,
                                "kdRuangan": this.listPegawaiView[i].kdRuangan,
                                "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                                "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                                "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                                "noRec": this.listPegawai[i].jadwal[j].noRec,
                                "isCuti": setCuti,
                                "isLibur": setLibur,
                            }
                            pegawai.pegawai.push(dataTemp);
                        } else if (this.listPegawai[i].jadwal[j].kdKelompokShift == null) {
                            let dataTemp = {
                                "kdPegawai": this.listPegawaiView[i].kdPegawai,
                                "kdRuangan": this.listPegawaiView[i].kdRuangan,
                                "kdShift": this.dataFixed.shiftLibur.id.kode,
                                "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                                "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                                "noRec": this.listPegawai[i].jadwal[j].noRec,
                                "isCuti": setCuti,
                                "isLibur": setLibur,
                            }
                            pegawai.pegawai.push(dataTemp);
                        } else if (this.listPegawai[i].jadwal[j].kdKelompokShift != null && this.listPegawai[i].jadwal[j].kdShift == undefined) {
                            errorShift[i].tanggal.push(this.listPegawai[i].jadwal[j].tanggal);
                        }
                    }
                }
            }
            this.errorShift = [];
            for (let i = 0; i < errorShift.length; i++) {
                if (errorShift[i].tanggal.length != 0) {
                    errors.push(errorShift[i]);
                }
            }
            if (errors.length != 0) {
                for (let k = 0; k < errors.length; k++) {
                    this.errorShift.push({ severity: 'warn', summary: 'Harap Set Jadwal Pegawai ' + errors[k].namaLengkap + ' Tanggal ', detail: errors[k].tanggal.toString() });
                }
                this.disableButton = false;
            } else {
                if (this.isChange == true) {
                    this.perubahanData(this.tempEventPeriode);
                } else {
                    this.httpService.post(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/save', pegawai).subscribe(response => {
                        this.alertService.success('Simpan', 'Data Disimpan');
                        this.disableButton = false;
                        this.isChange = false;
                        this.listPegawaiView = [];
                        this.listPegawai = [];
                        // this.selectedPeriode = [];
                        this.tampilkanJadwalManual();
                        this.getKode(this.kdPeriodeHeadEvent);
                        //di hilangkan karena issue HRIS-665
                        // this.httpService.get(Configuration.get().dataHr2Mod3 + '/perhitungan-gaji/findPeriodeByHead?kdPeriode=' + this.kdPeriodeHead).subscribe(res => {
                        //     this.listPeriode = res.data.periodeHead;
                        //     this.clearPeriode(this.kdunitKerja);
                        // });
                    });
                }
            }
        } else {
            this.tempEventPeriodeV1 = this.selectedPeriode;
            let pegawai = {
                "kdRuangan": this.kdunitKerja,
                "kdPeriode": this.selectedPeriode[0].kode.kode,
                "pegawai": []
            }
            for (let i = 0; i < this.listPegawaiView.length; i++) {
                for (let j = 0; j < this.listPegawai[i].jadwal.length; j++) {
                    let setCuti = this.listPegawai[i].jadwal[j].isCuti;
                    let setLibur = this.listPegawai[i].jadwal[j].isLibur;
                    if (this.listPegawai[i].jadwal[j].kdKelompokShift != this.dataFixed.kdKelompokShiftNonShift) {
                        if (this.listPegawai[i].jadwal[j].isCuti == false && this.listPegawai[i].jadwal[j].isCutiSet == true) {
                            if (this.listPegawai[i].jadwal[j].kdShift == this.dataFixed.shiftLibur.id.kode) {
                                setCuti = true;
                                setLibur = false;
                            }
                        }
                    }
                    if (this.listPegawai[i].jadwal[j].noHistori == null && this.listPegawai[i].jadwal[j].kdKelompokShift != null) {
                        let dataTemp = {
                            "kdPegawai": this.listPegawaiView[i].kdPegawai,
                            "kdRuangan": this.listPegawaiView[i].kdRuangan,
                            "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                            "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                            "isCuti": setCuti,
                            "isLibur": setLibur,
                        }
                        pegawai.pegawai.push(dataTemp);
                    } else if (this.listPegawai[i].jadwal[j].kdKelompokShift != null) {
                        let dataTemp = {
                            "kdPegawai": this.listPegawaiView[i].kdPegawai,
                            "kdRuangan": this.listPegawaiView[i].kdRuangan,
                            "kdShift": this.listPegawai[i].jadwal[j].kdShift,
                            "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                            "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                            "noRec": this.listPegawai[i].jadwal[j].noRec,
                            "isCuti": setCuti,
                            "isLibur": setLibur,
                        }
                        pegawai.pegawai.push(dataTemp);
                    } else if (this.listPegawai[i].jadwal[j].kdKelompokShift == null) {
                        let dataTemp = {
                            "kdPegawai": this.listPegawaiView[i].kdPegawai,
                            "kdRuangan": this.listPegawaiView[i].kdRuangan,
                            "kdShift": this.dataFixed.shiftLibur.id.kode,
                            "kdkalender": this.listPegawai[i].jadwal[j].kdkalender,
                            "noHistori": this.listPegawai[i].jadwal[j].noHistori,
                            "noRec": this.listPegawai[i].jadwal[j].noRec,
                            "isCuti": setCuti,
                            "isLibur": setLibur,
                        }
                        pegawai.pegawai.push(dataTemp);
                    }

                }
            }
            this.httpService.post(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/save', pegawai, this.simpanBanyakPeriode).subscribe(response => {
                let listKdPeriode = [];
                for (let j = 0; j < this.selectedPeriode.length; j++) {
                    listKdPeriode.push(this.selectedPeriode[j].kode.kode);
                }
                let pegawai = {
                    "kdRuangan": this.kdunitKerja,
                    "kdPeriode": listKdPeriode
                }
                this.httpService.post(Configuration.get().dataHr2Mod3 + '/jadwal-pegawai/saveJadwalKerjaPegawaiBanyakPeriode', pegawai).subscribe(response => {
                    this.alertService.success('Simpan', 'Data Disimpan');
                    this.disableButton = false;
                    this.isChange = false;
                    this.listPegawaiView = [];
                    this.listPegawai = [];
                    this.selectedPeriode = [];
                    this.tampilkanJadwalManual();
                    this.getKode(this.kdPeriodeHeadEvent);
                    //di hilangkan karena issue HRIS-665
                    // this.httpService.get(Configuration.get().dataHr2Mod3 + '/perhitungan-gaji/findPeriodeByHead?kdPeriode=' + this.kdPeriodeHead).subscribe(res => {
                    //     this.listPeriode = res.data.periodeHead;
                    //     this.clearPeriode(this.kdunitKerja);
                    // });
                });
            });
        }

    }
    simpanBanyakPeriode() {

    }
    generateJadwal() {
        let dataListPegawai = [...this.listPegawaiView];
        let AiShift2 = 0;
        let AiShift3 = 0;
        let hariLibur = 7;
        for (let i = 0; i < dataListPegawai.length; i++) {
            if (dataListPegawai[i].kelompokShift.length != 2) {
                if (dataListPegawai[i].kelompokShift.length == 3) {
                    for (let j = 0; j < dataListPegawai[i].jadwal.length; j++) {
                        if (j == 0) {
                            dataListPegawai[i].jadwal[j].kdShift = 1;
                            dataListPegawai[i].jadwal[j].kodeExternal = "P2"
                        } else if (j % hariLibur == 0) {
                            dataListPegawai[i].jadwal[j].kdShift = 3;
                            dataListPegawai[i].jadwal[j].kodeExternal = "L"
                        } else {
                            if (dataListPegawai[i].jadwal[j - 1].kdShift == 1) {
                                dataListPegawai[i].jadwal[j].kdShift = 2;
                                dataListPegawai[i].jadwal[j].kodeExternal = "S2"
                            } else {
                                dataListPegawai[i].jadwal[j].kdShift = 1;
                                dataListPegawai[i].jadwal[j].kodeExternal = "P2"
                            }
                        }
                    }
                } else {
                    for (let j = 0; j < dataListPegawai[i].jadwal.length; j++) {
                        if (j == 0) {
                            dataListPegawai[i].jadwal[j].kdShift = 4;
                            dataListPegawai[i].jadwal[j].kodeExternal = "P3"
                        } else if (j % hariLibur == 0) {
                            dataListPegawai[i].jadwal[j].kdShift = 7;
                            dataListPegawai[i].jadwal[j].kodeExternal = "L"
                        } else {
                            if (dataListPegawai[i].jadwal[j - 1].kdShift == 4) {
                                dataListPegawai[i].jadwal[j].kdShift = 5;
                                dataListPegawai[i].jadwal[j].kodeExternal = "S3"
                            } else if (dataListPegawai[i].jadwal[j - 1].kdShift == 5) {
                                dataListPegawai[i].jadwal[j].kdShift = 6;
                                dataListPegawai[i].jadwal[j].kodeExternal = "M3"
                            } else {
                                dataListPegawai[i].jadwal[j].kdShift = 4;
                                dataListPegawai[i].jadwal[j].kodeExternal = "P3"
                            }
                        }
                    }
                }
            }
        }
        this.listPegawaiView = dataListPegawai;
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


    handleFileSelect(evt) {
        console.log(evt.files);
        var files = evt.files;
        var file = files[0];

        if (files && file) {
            var reader = new FileReader();

            reader.onload = this._handleReaderLoaded.bind(this);

            reader.readAsBinaryString(file);
        }
    }

    _handleReaderLoaded(readerEvt) {
        let shiftData = [];
        this.httpService.get(Configuration.get().dataMasterNew + '/shiftkerja/findAll?page=1&rows=10000&dir=namaShift&sort=desc').subscribe(table => {
            shiftData = table.ShiftKerja;
        });
        let tesData = [];
        let dataJadwal = [];
        dataJadwal = this.listPegawaiView;
        this.namaDokumen = 'Jadwal Kerja Template';
        var binaryString = readerEvt.target.result;
        this.base64textString = btoa(binaryString);
        let formSubmit = {
            "body": this.base64textString,
            "filename": this.namaDokumen
        }
        this.dataEx = [];
        let anakPgw = [];

        let kdEx;

        this.httpService.post(Configuration.get().dataHr2Mod3 + '/import-jadwal-kerja/readExcel', formSubmit).subscribe(response => {
            this.dataEx = response.data.data;
            let dataAnakBaru = [];
            for (let j = 0; j < this.dataEx.length; j++) {
                for(let k=0; k < this.dataEx[j].tanggal.length; k++){
                    dataAnakBaru.push(this.dataEx[j].tanggal[k]); 
                }
                
                let dataBaru = {
                    "kdPegawai": this.dataEx[j].kdPegawai,
                    "namaPegawai": this.dataEx[j].namaPegawai,
                    "child": dataAnakBaru
                }
                anakPgw.push(dataBaru);
                dataAnakBaru = [];
            }

            //console.log(anakPgw);

            //untuk yang jumlah harinya sama

            //yang boleh di proses yang kdShift null atau undefined
            for (let x = 0; x < anakPgw.length; x++) {
                for (let w = 0; w < dataJadwal.length; w++) {
                    if (anakPgw[x].kdPegawai == dataJadwal[w].kdPegawai) {

                        for (let a = 0; a < anakPgw[x].child.length; a++) {
                            //ambil data seusai master nya shift kerja
                            let status = false;
                            for (let b = 0; b < shiftData.length; b++) {
                                if (anakPgw[x].child[a] == shiftData[b].kode.kode) {
                                    kdEx = shiftData[b].kodeExternal;
                                    status =  true;
                                }
                            }


                            if(status == false){
                                this.alertService.warn('Perhatian','Kode Shift Tidak Ada, Periksa Kembali Excelnya');
                                //dataJadwal = [];
                                break;
                            }
                                
                            dataJadwal[w].jadwal[a].kodeExternal = kdEx;
                            dataJadwal[w].jadwal[a].kdShift = anakPgw[x].child[a];
                        }
                    }
                }

            }

            //console.log(dataJadwal);

        });


    }


    downloadExcel() {
        let dataJadwal = [];
        let dataFinal = [];

        // let obj: {[k: string]: any} = {};
       
        // obj.tgl1='';
        // this.listTanggal.forEach(function(dataTgl,index){
        //     obj[index] = dataTgl.id;
        // })

        // obj.forEach(function(dTgl){
        //     let new_obj = Object.assign(
        //         {},
        //         {
        //           dTgl
        //         }
        //     );
        // })


        // obj.map(function(item){
        //     let objekBaru = {};
        //     let keys = Object.keys(item);
        //     keys.map(function(key){

        //     })
        // });

        // Object.keys(obj).forEach(function(key){
        //     let newkey = key+'tgl';
        //     obj[newkey] = obj[key];
        //     delete obj[key];
        // });
        
        // let keys = Object.keys(obj);
        // let tmp;

        // for(let j=0; j<keys.length; j++){
        //     var key = keys[j].replace(/^element_/,'tgl');
        //     tmp[key] = obj[keys[j]];
        // }
    
        
        // console.log(obj);
        // console.log(dataFinal);
        dataJadwal.push({
            "Kode Pegawai": '',
            "tgl1": '',
            "tgl2": '',
            "tgl3": '',
            "tgl4": '',
            "tgl5": '',
            "tgl6": '',
            "tgl7": '',
            "tgl8": '',
            "tgl9": '',
            "tgl10": '',
            "tgl11": '',
            "tgl12": '',
            "tgl13": '',
            "tgl14": '',
            "tgl15": '',
            "tgl16": '',
            "tgl17": '',
            "tgl18": '',
            "tgl19": '',
            "tgl20": '',
            "tgl21": '',
            "tgl22": '',
            "tgl23": '',
            "tgl24": '',
            "tgl25": '',
            "tgl26": '',
            "tgl27": '',
            "tgl28": '',
            "tgl29": '',
            "tgl30": '',
            "tgl31": ''
        })
        this.fileService.exportAsExcelFile(dataJadwal, 'dataJadwal');
    }



}

