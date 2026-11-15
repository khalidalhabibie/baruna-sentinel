/**
 * Single-purpose story: explain the coastal-infrastructure decision problem
 * before exposing advanced GIS/GNSS screens. Historical records stay labelled.
 */
export const STORY_STEPS=Object.freeze([
  Object.freeze({id:"problem",number:"01",nav:"Masalah",eyebrow:"MASALAH DI LAPANGAN",
    title:"Tanah bisa turun dengan kecepatan berbeda di setiap lokasi.",
    lead:"Di kawasan pesisir, dermaga, jalan akses, dan fasilitas industri sama-sama perlu dijaga. Tetapi data penurunan tanah tingkat wilayah belum menunjukkan aset mana yang harus diperiksa lebih dulu.",
    takeaway:"Temuan 100–120 mm/tahun adalah laju maksimum pada lokasi tertentu di studi Semarang–Demak 2015–2022, bukan ukuran pergerakan setiap aset.",
    action:"Buka catatan Tanjung Emas",page:"detail",
    sourceLabel:"Aditiya & Ito (2023), InSAR 2015–2022",sourceUrl:"https://doi.org/10.1016/j.jag.2023.103579"}),
  Object.freeze({id:"economy",number:"02",nav:"Dampak",eyebrow:"KENAPA PENTING",
    title:"Jika infrastruktur terganggu, biaya operasi bisa ikut naik.",
    lead:"Akses pelabuhan yang terganggu berpotensi menyebabkan keterlambatan angkutan, pengalihan rute, pemeriksaan mendadak, dan perbaikan. Tim perlu memfokuskan inspeksi sebelum gangguan menjadi lebih mahal.",
    takeaway:"BARUNA belum menghitung kerugian aktual, kemungkinan kejadian, penghematan, atau ROI operator. Kalkulator di samping hanya perkalian asumsi yang Anda masukkan.",
    action:"Coba kalkulator asumsi",page:null,
    sourceLabel:"Wetlands International / Deltares — economic assessment of subsidence",sourceUrl:"https://indonesia.wetlands.org/id/download/1496/"}),
  Object.freeze({id:"evidence",number:"03",nav:"Data",eyebrow:"APA YANG DIANALISIS",
    title:"Kita mulai dari data yang benar-benar tersedia.",
    lead:"BARUNA membedakan catatan penurunan tanah historis, riwayat posisi stasiun GPS, dan pemeriksaan kualitas data Multi-GNSS. Setiap sumber punya tempat, tahun, dan arti yang berbeda.",
    takeaway:"Data CSEM 2010–2021 bukan pengukuran pada dermaga. QC BAKO tahun 2025 berasal dari stasiun lain; tidak dapat membuktikan penurunan tanah di Tanjung Emas.",
    action:"Lihat data GNSS",page:"analyst",
    sourceLabel:"Susilo et al. (2023), arsip posisi GPS historis",sourceUrl:"https://doi.org/10.5281/zenodo.7775016"}),
  Object.freeze({id:"process",number:"04",nav:"Cara kerja",eyebrow:"CARA BARUNA MEMBANTU",
    title:"Periksa data, hubungkan dengan aset, baru tentukan tindakan.",
    lead:"Sistem mengecek asal dan kualitas pengukuran, apakah stasiun mewakili aset, lalu mempertimbangkan lokasi, paparan pesisir, dan pentingnya aset. Keputusan harus mempunyai alasan yang dapat ditelusuri.",
    takeaway:"Jika peta aset atau pengukuran saat ini belum tersedia, hasilnya Data Insufficient (bukti belum cukup), bukan klaim bahwa aset aman ataupun berisiko tinggi.",
    action:"Lihat proses penilaian",page:"assessment",
    sourceLabel:"Metodologi BARUNA Sentinel dalam proposal RGPD 2026",sourceUrl:null}),
  Object.freeze({id:"action",number:"05",nav:"Hasil",eyebrow:"CONTOH HASIL",
    title:"Contoh: Tanjung Emas masih memerlukan pengukuran baru.",
    lead:"Studi tahun 2005 mencatat penurunan kumulatif 74–140 cm pada sektor West breakwater. Karena geometri sektor dan kondisi terbaru belum tervalidasi, BARUNA meminta bukti tambahan sebelum memberi peringkat inspeksi.",
    takeaway:"Prototype ini menghasilkan pemeriksaan kelengkapan bukti, kebutuhan survei, dan laporan. Ranking Tinggi/Sedang/Pantau hanya didemokan pada data sintetis terpisah; bukan hasil risiko aset riil.",
    action:"Buka hasil dan laporan",page:"assessment",
    sourceLabel:"Catatan lapangan historis Tanjung Emas, penelitian 2005",sourceUrl:"https://doi.org/10.32693/bomg.32.1.2017.351"})
]);
export const STORY_HIGHLIGHTS=Object.freeze([
  Object.freeze({label:"Masalah",detail:"Data penurunan tanah tersebar dan tidak otomatis menunjukkan aset mana yang perlu diperiksa.",source:null}),
  Object.freeze({label:"Cara kerja",detail:"Periksa GNSS → cek mutu dan kaitannya dengan aset → tentukan apakah bukti cukup.",source:null}),
  Object.freeze({label:"Keluaran",detail:"Alasan prioritas atau permintaan data tambahan, disertai laporan untuk tim teknik.",source:null})
]);
export function selectStoryStep(input){
  const step=typeof input==="number"?STORY_STEPS[input]:STORY_STEPS.find(x=>x.id===input);
  return step||STORY_STEPS[0];
}
export function estimatedInterruptionExposure(hours,lossPerHour){
  const h=Number(hours),cost=Number(lossPerHour);
  if(hours===""||lossPerHour===""||!Number.isFinite(h)||!Number.isFinite(cost)||
    h<0||cost<0||h>720||cost>1_000_000_000_000)return null;
  const amount=h*cost;
  return Number.isSafeInteger(amount)?amount:null;
}
export function rupiah(value){
  if(!Number.isFinite(value)||value<0)return "—";
  return "Rp"+new Intl.NumberFormat("id-ID",{maximumFractionDigits:0}).format(value);
}
