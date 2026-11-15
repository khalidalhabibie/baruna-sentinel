/**
 * Introductory editorial walkthrough for Bhumireka / commercial conversations.
 *
 * Content is source-grounded, never an operational loss estimate or a claim
 * that published regional rates measure an individual port asset.
 */
export const STORY_STEPS=Object.freeze([
  Object.freeze({id:"problem",number:"01",nav:"Masalah",eyebrow:"THE PROBLEM",
    title:"Tanah bergerak. Prioritas inspeksi belum otomatis jelas.",
    lead:"Pesisir Semarang tidak mengalami penurunan tanah yang seragam. Data ada, tetapi tidak langsung menjawab aset mana yang perlu diperiksa dahulu.",
    takeaway:"Pergerakan stasiun regional bukan bukti bahwa satu dermaga, jalan, atau gudang bergerak dengan laju yang sama.",
    action:"Buka studi Tanjung Emas",page:"detail",
    sourceLabel:"Aditiya & Ito, 2023",sourceUrl:"https://doi.org/10.1016/j.jag.2023.103579"}),
  Object.freeze({id:"economy",number:"02",nav:"Dampak",eyebrow:"WHY IT MATTERS",
    title:"Keterlambatan keputusan bisa menjadi biaya operasional.",
    lead:"Ketika perubahan tanah memengaruhi akses atau fasilitas, konsekuensinya dapat berupa pemeriksaan tambahan, pengalihan operasi, keterlambatan logistik, dan pekerjaan perbaikan.",
    takeaway:"BARUNA belum menghitung kerugian aktual, penghematan, maupun ROI. Besarnya tergantung kondisi aset, lama gangguan, dan biaya operasional operator.",
    action:"Lihat asumsi ekonomi",page:null,
    sourceLabel:"Azeriansyah et al., 2025",sourceUrl:"https://doi.org/10.31284/j.jemt.2025.v5i2.6841"}),
  Object.freeze({id:"evidence",number:"03",nav:"Bukti GNSS",eyebrow:"WHAT WE HAVE",
    title:"Dari laporan historis dan GNSS menjadi bukti yang terlacak.",
    lead:"BARUNA menampilkan sumber, stasiun, periode, kualitas observasi, dan keterbatasannya. Dataset dari lokasi atau waktu yang berbeda tidak digabung menjadi satu kesimpulan palsu.",
    takeaway:"Data CSEM menunjukkan konteks pergerakan stasiun; QC BAKO membuktikan ketersediaan observasi Multi-GNSS yang terpisah, bukan gerak aset Semarang.",
    action:"Buka GNSS Lab",page:"analyst",
    sourceLabel:"Susilo et al., 2023 / Zenodo",sourceUrl:"https://doi.org/10.5281/zenodo.7775016"}),
  Object.freeze({id:"process",number:"04",nav:"Analisis",eyebrow:"HOW IT WORKS",
    title:"Setiap klaim melewati pemeriksaan bukti terlebih dahulu.",
    lead:"Rantai analisis: sumber GNSS dan observasi → quality control → relasi stasiun-ke-aset → konteks paparan dan kekritisan → keputusan yang disertai alasan.",
    takeaway:"Jika geometri, pengukuran representatif, atau kriteria aset belum tersedia, hasilnya Data Insufficient, bukan aman atau berisiko tinggi.",
    action:"Lihat assessment",page:"assessment",
    sourceLabel:"Metodologi BARUNA Sentinel / Proposal RGPD 2026",sourceUrl:null}),
  Object.freeze({id:"action",number:"05",nav:"Keputusan",eyebrow:"THE OUTCOME",
    title:"Hasilnya: tahu apa yang harus diverifikasi berikutnya.",
    lead:"Tim mendapat ringkasan evidence readiness, sektor yang dipilih, kekurangan data, dan verification brief yang dapat diserahkan kepada tim survei atau teknik.",
    takeaway:"Prototype ini mendukung screening dan perencanaan inspeksi. Belum merupakan pemantauan langsung, prediksi kegagalan, atau sertifikasi keselamatan.",
    action:"Coba Inspection Assessment",page:"assessment",
    sourceLabel:"BARUNA Sentinel · source-backed research prototype",sourceUrl:null})
]);
export const STORY_HIGHLIGHTS=Object.freeze([
  Object.freeze({label:"100–120 mm/tahun",detail:"Laju maksimum area tertentu pada riset InSAR 2015–2022; bukan laju seluruh aset.",source:"https://doi.org/10.1016/j.jag.2023.103579"}),
  Object.freeze({label:"6 sektor",detail:"Catatan penelitian kumulatif Tanjung Emas tahun 2005; bukan kondisi aset saat ini.",source:"https://doi.org/10.32693/bomg.32.1.2017.351"}),
  Object.freeze({label:"3 aliran bukti",detail:"Studi sektor, posisi GPS CSEM, dan QC Multi-GNSS BAKO; ketiganya independen.",source:null})
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
