// Kandungan game, dibina daripada struktur SDS (192 item, jawapan Y/T):
//   Peringkat 1 = Bahagian A Kesukaan (item 1-60), 10 item setiap jenis
//   Peringkat 2 = Bahagian B Kecekapan (item 61-120), 10 item setiap jenis
//   Peringkat 3 = Bahagian C Nama Pekerjaan (item 121-192), 12 item setiap jenis
// Dalam setiap bahagian, item disusun ikut jenis R, I, A, S, E, C, jadi jenis dikira daripada nombor item.
//
// Ayat setiap item diisi dalam js/ayat.js. Item hanya dipaparkan bila ada ayat (AYAT) atau label demo (LABEL),
// jadi game boleh dimain semasa ayat sedang diisi, dan skor maksimum menyesuaikan diri.
// Versi penuh hanya selepas mendapat izin bertulis pemilik hak cipta SDS.

const SECTIONS = [
  { from: 1, to: 60, perType: 10, eyebrow: "Peringkat 1 · Kesukaan", title: "Apa kamu suka buat?",
    say: "Tekan semua gambar aktiviti yang kamu suka buat. Kalau tak suka, biarkan sahaja." },
  { from: 61, to: 120, perType: 10, eyebrow: "Peringkat 2 · Kecekapan", title: "Apa kamu boleh buat?",
    say: "Tekan gambar yang kamu tahu buat, atau rasa boleh belajar." },
  { from: 121, to: 192, perType: 12, eyebrow: "Peringkat 3 · Kerjaya", title: "Kerjaya mana kamu minat?",
    say: "Tekan kerjaya yang kamu minat. Kalau tak minat, biarkan sahaja." }
];

// Label pendek untuk 18 kad demo (dipapar hanya kalau ayat item masih kosong)
const LABEL = {
  1: "Baiki alat elektrik", 13: "Buat projek sains", 21: "Melukis dan mewarna",
  35: "Mengajar kanak-kanak", 46: "Jadi ketua kumpulan", 59: "Susun fail dan rekod",
  63: "Guna gerudi elektrik", 76: "Guna mikroskop", 83: "Berlakon dalam drama",
  91: "Terangkan dengan jelas", 104: "Jual barang dengan hebat", 118: "Guna mesin kira",
  132: "Juru Elektrik", 137: "Ahli Kimia", 147: "Ahli Muzik",
  166: "Kaunselor Pelajar", 173: "Pengurus Hotel", 186: "Kerani Bank"
};

// Gambar setiap item (emoji sementara, ganti dengan ilustrasi). Item tanpa gambar guna PIC_DEFAULT jenisnya.
const PIC = {
  1: "🔌🔧", 13: "🧪", 21: "🎨", 35: "🧒📖", 46: "📣", 59: "🗂️",
  63: "🪛", 76: "🔬", 83: "🎭", 91: "💬", 104: "🛍️", 118: "🧮",
  132: "👷⚡", 137: "👩‍🔬", 147: "🎸", 166: "🤝", 173: "🏨", 186: "🏦"
};
const PIC_DEFAULT = { R: "🛠️", I: "🔍", A: "🎨", S: "🤝", E: "📈", C: "📋" };

const TYPE_ORDER = ["R", "I", "A", "S", "E", "C"];

const STAGES = SECTIONS.map(sec => {
  const items = [];
  for (let no = sec.from; no <= sec.to; no++) {
    const k = TYPE_ORDER[Math.floor((no - sec.from) / sec.perType)];
    const s = (typeof AYAT !== "undefined" && AYAT[no]) || "";
    const t = LABEL[no] || "";
    if (s || t) items.push({ no, k, s, t, e: PIC[no] || PIC_DEFAULT[k] });
  }
  return { eyebrow: sec.eyebrow, title: sec.title, say: sec.say, items };
});

const TYPES = {
  R: { n: "Realistik", d: "Suka kerja guna tangan, alatan dan mesin.", jobs: ["Juruteknik", "Mekanik", "Jurutera Awam", "Chef", "Juruterbang"] },
  I: { n: "Investigatif", d: "Suka mengkaji, bertanya kenapa, dan selesaikan masalah.", jobs: ["Saintis", "Doktor", "Ahli Farmasi", "Penganalisis Data", "Ahli Kajicuaca"] },
  A: { n: "Artistik", d: "Suka mencipta, melukis, muzik dan idea baharu.", jobs: ["Pereka Grafik", "Arkitek", "Animator", "Penulis", "Ahli Muzik"] },
  S: { n: "Sosial", d: "Suka menolong, mengajar dan bekerja dengan orang.", jobs: ["Guru", "Jururawat", "Kaunselor", "Ahli Fisioterapi", "Pegawai Kebajikan"] },
  E: { n: "Enterprising", d: "Suka memimpin, memujuk dan berniaga.", jobs: ["Usahawan", "Peguam", "Pengurus", "Jurujual", "Juruacara"] },
  C: { n: "Konvensional", d: "Suka kerja teratur, teliti dengan nombor dan data.", jobs: ["Akauntan", "Kerani Bank", "Juruaudit", "Setiausaha", "Pegawai Tadbir"] }
};
