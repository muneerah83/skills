const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageNumber, Footer,
} = require("docx");
const fs = require("fs");

// KPKM brand palette (Template_Presentation_2.pptx)
const NAVY_TEXT = "000078";   // headings
const DEEP_NAVY = "00005A";   // structural
const VIVID_GREEN = "00C600"; // accent
const NAT_GREEN = "4EA506";   // rules
const CHARCOAL = "333333";    // body
const RED = "9C2B2B";
const GREY = "595959";
const CW = 9026;
const F = "Calibri";

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 110, line: o.line ?? 268 },
    alignment: o.align, indent: o.indent, keepNext: o.keepNext,
    children: [new TextRun({ text, font: F, size: o.size ?? 21, bold: o.bold, italics: o.italics, color: o.color ?? CHARCOAL })],
  });

const pr = (runs, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 110, line: o.line ?? 268 },
    alignment: o.align, indent: o.indent, keepNext: o.keepNext,
    children: runs.map(([t, x = {}]) => new TextRun({
      text: t, font: F, size: x.size ?? o.size ?? 21, bold: x.bold, italics: x.italics, color: x.color ?? CHARCOAL,
    })),
  });

const H = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 },
  keepNext: true, keepLines: true,
  children: [new TextRun({ text, font: F, size: 25, bold: true, color: NAVY_TEXT })],
});

const bullet = (runs) => new Paragraph({
  numbering: { reference: "dot", level: 0 }, spacing: { after: 85, line: 268 },
  children: runs.map(([t, x = {}]) => new TextRun({ text: t, font: F, size: 21, bold: x.bold, italics: x.italics, color: x.color ?? CHARCOAL })),
});

const cell = (children, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children,
});

const tc = (text, o = {}) => cell([new Paragraph({
  spacing: { after: 0, line: 252 }, alignment: o.align,
  children: [new TextRun({ text, font: F, size: o.size ?? 19, bold: o.bold, color: o.color ?? CHARCOAL })],
})], o);

const B = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
};

// caption BELOW table (S4)
const cap = (n, desc) => new Paragraph({
  spacing: { before: 70, after: 190 },
  children: [
    new TextRun({ text: `Jadual ${n}. `, font: F, size: 18, bold: true, color: CHARCOAL }),
    new TextRun({ text: desc, font: F, size: 18, italics: true, color: GREY }),
  ],
});

const eqBar = (text) => new Table({
  columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY_TEXT },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY_TEXT },
    left: { style: BorderStyle.SINGLE, size: 24, color: VIVID_GREEN },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY_TEXT },
    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({
    cantSplit: true,
    children: [cell([new Paragraph({
      spacing: { after: 0, line: 264 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, font: F, size: 23, bold: true, color: NAVY_TEXT })],
    })], { w: CW, fill: "EFEFF7" })],
  })],
});

const noteBox = (label, text, accent, fill) => new Table({
  columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: accent },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: accent },
    left: { style: BorderStyle.SINGLE, size: 20, color: accent },
    right: { style: BorderStyle.SINGLE, size: 4, color: accent },
    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({
    cantSplit: true,
    children: [cell([
      new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: label, font: F, size: 19, bold: true, color: accent })] }),
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text, font: F, size: 19, color: CHARCOAL })] }),
    ], { w: CW, fill })],
  })],
});

const sp = (after = 150) => new Paragraph({ spacing: { after }, children: [] });

const body = [];

// ── KOP ──
body.push(
  new Paragraph({ spacing: { after: 35 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "JABATAN PERKHIDMATAN VETERINAR MALAYSIA", font: F, size: 24, bold: true, color: NAVY_TEXT })] }),
  new Paragraph({ spacing: { after: 35 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "KEMENTERIAN PERTANIAN DAN KETERJAMINAN MAKANAN", font: F, size: 19, bold: true, color: DEEP_NAVY })] }),
  new Paragraph({ spacing: { after: 150 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Bahagian Pembangunan Industri Ternakan  ·  Wisma Tani, Presint 4, 62630 Putrajaya", font: F, size: 16, color: GREY })] }),
  new Paragraph({ spacing: { before: 40, after: 170 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: VIVID_GREEN, space: 1 } },
    children: [new TextRun({ text: "", font: F, size: 2 })] }),
  new Paragraph({ spacing: { after: 55 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "NOTA MAKLUM BALAS MEDIA", font: F, size: 21, bold: true, color: GREY })] }),
  new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "LATIHAN PENTERNAK DAN DAYA TAHAN IKLIM SEKTOR TERNAKAN NEGARA", font: F, size: 27, bold: true, color: NAVY_TEXT })] }),
);

const mr = (k, v, c) => new TableRow({ cantSplit: true, children: [tc(k, { w: 2300, bold: true, fill: "F4F4F4" }), tc(v, { w: CW - 2300, color: c })] });
body.push(new Table({
  columnWidths: [2300, CW - 2300], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    mr("Tarikh", "28 Julai 2026"),
    mr("Perkara", "Pertanyaan media berhubung latihan penternak menghadapi perubahan iklim"),
    mr("Skop", "Tiga (3) soalan utama dan dua (2) soalan susulan"),
    mr("Disediakan oleh", "Bahagian Pembangunan Industri Ternakan, JPV Malaysia"),
    mr("Status", "DERAF DALAMAN — kelulusan diperlukan sebelum dikeluarkan", RED),
  ],
}), sp());

// ── PERBANDINGAN ──
body.push(H("PERBANDINGAN: MANDAT PERSEKUTUAN (JPV) vs DASAR KERAJAAN NEGERI"));
body.push(p("Premis soalan pertama menyatakan bahawa JPV telah mewajibkan pelaksanaan berperingkat sistem reban tertutup bermula di Perak. Jadual 1 membandingkan kedudukan sebenar kedua-dua pihak berkuasa."));

const vr = (aspek, jpv, negeri) => new TableRow({
  children: [tc(aspek, { w: 2900 }), tc(jpv, { w: 3063, align: AlignmentType.LEFT }), tc(negeri, { w: CW - 5963, align: AlignmentType.LEFT })],
});
body.push(new Table({
  columnWidths: [2900, 3063, CW - 5963], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Aspek", { w: 2900, bold: true, fill: "EAF3EA" }),
      tc("JPV (Persekutuan)", { w: 3063, bold: true, fill: "EAF3EA" }),
      tc("Kerajaan Negeri Perak", { w: CW - 5963, bold: true, fill: "EAF3EA" }),
    ] }),
    vr("Mengeluarkan pewajipan reban tertutup", "✗  Tidak", "✓  Ya"),
    vr("Kuasa ke atas tanah dan perancangan setempat", "✗  Tidak", "✓  Ya"),
    vr("Kuasa pelesenan premis ternakan", "✗  Tidak", "✓  Ya"),
    vr("Menetapkan standard biosekuriti dan kesihatan haiwan", "✓  Ya", "✗  Tidak"),
    vr("Mengawal selia import haiwan dan bahan genetik", "✓  Ya", "✗  Tidak"),
    vr("Pensijilan amalan ladang (myGAP)", "✓  Ya", "✗  Tidak"),
    vr("Input teknikal kepada garis panduan perancangan ladang", "✓  Ya", "✓  Ya"),
  ],
}));
body.push(cap(1, "Pembahagian bidang kuasa antara JPV dan Kerajaan Negeri Perak berhubung sistem reban tertutup."));

body.push(eqBar("PEWAJIPAN REBAN TERTUTUP  ≠  MANDAT JPV"), sp(150));

body.push(pr([
  ["Pewajipan sistem reban tertutup di Perak merupakan ", {}],
  ["dasar Kerajaan Negeri Perak", { bold: true }],
  [", diumumkan menerusi Exco Pembangunan Luar Bandar, Perladangan, Pertanian dan Industri Asas Tani Negeri Perak. Tempoh peralihan diberikan sehingga akhir tahun 2026 dan penguatkuasaan penuh bermula 1 Januari 2027 (Rujukan: Sinar Harian dan MG Perak, 2026).", {}],
]));
body.push(p("Di bawah Jadual Kesembilan Perlembagaan Persekutuan, ternakan binatang, perkhidmatan veterinar dan kuarantin binatang terletak dalam Senarai Bersama (Senarai III), manakala tanah, kerajaan tempatan serta perancangan bandar dan desa adalah bidang kuasa Negeri. Oleh yang demikian, keputusan mewajibkan struktur reban tertutup berada dalam bidang kuasa Kerajaan Negeri (Rujukan: Perlembagaan Persekutuan, Jadual Kesembilan, Senarai III)."));

body.push(noteBox("AYAT PEMBETULAN UNTUK DIGUNAKAN BERSAMA MEDIA",
  "“Untuk makluman, pewajipan sistem reban tertutup di Perak merupakan dasar Kerajaan Negeri Perak dan bukan mandat Jabatan Perkhidmatan Veterinar. JPV menyediakan sokongan teknikal, standard biosekuriti dan khidmat nasihat veterinar bagi menyokong pelaksanaan dasar tersebut, selaras dengan peruntukan Senarai Bersama di bawah Perlembagaan Persekutuan.”",
  NAT_GREEN, "F1F7EC"), sp());

// ── ISU UTAMA ──
body.push(H("ISU UTAMA"));

body.push(p("1.  ISU BIDANG KUASA — KELESTARIAN SISTEM REBAN TERTUTUP", { bold: true, keepNext: true }));
body.push(p("Skala peralihan yang tinggal adalah punca utama kebimbangan industri. Jadual 2 memaparkan taburan ladang ayam di Perak mengikut sistem perkandangan."));
body.push(new Table({
  columnWidths: [4200, 1900, CW - 6100], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Sistem perkandangan", { w: 4200, bold: true, fill: "EAF3EA" }),
      tc("Bilangan ladang", { w: 1900, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Peratusan", { w: CW - 6100, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    new TableRow({ children: [tc("Reban tertutup", { w: 4200 }), tc("169", { w: 1900, align: AlignmentType.CENTER }), tc("24.9%", { w: CW - 6100, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [tc("Reban terbuka", { w: 4200 }), tc("480", { w: 1900, align: AlignmentType.CENTER, bold: true, color: RED }), tc("70.8%", { w: CW - 6100, align: AlignmentType.CENTER, bold: true, color: RED })] }),
    new TableRow({ children: [tc("Gabungan tertutup dan terbuka", { w: 4200 }), tc("29", { w: 1900, align: AlignmentType.CENTER }), tc("4.3%", { w: CW - 6100, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [tc("JUMLAH", { w: 4200, bold: true }), tc("678", { w: 1900, align: AlignmentType.CENTER, bold: true }), tc("100.0%", { w: CW - 6100, align: AlignmentType.CENTER, bold: true })] }),
  ],
}));
body.push(cap(2, "Taburan ladang ayam di Negeri Perak mengikut sistem perkandangan (Rujukan: New Straits Times, 2026)."));

body.push(p("Kelebihan sistem reban tertutup dari sudut kelestarian adalah seperti berikut:"));
body.push(bullet([["Kawalan persekitaran mikro. ", { bold: true }], ["Suhu, kelembapan dan kadar pengudaraan dikawal secara berterusan, mengurangkan tekanan haba yang menjadi punca utama kejatuhan pengambilan makanan, tumbesaran terbantut dan peningkatan kematian semasa gelombang haba.", {}]]));
body.push(bullet([["Biosekuriti. ", { bold: true }], ["Struktur tertutup mengehadkan sentuhan antara ternakan dengan burung liar, rodensia dan vektor penyakit, sekali gus menurunkan risiko kemasukan penyakit bawaan burung liar seperti selesema burung.", {}]]));
body.push(bullet([["Kecekapan makanan ternakan. ", { bold: true }], ["Persekitaran stabil menghasilkan kadar penukaran makanan yang lebih baik. Memandangkan sebahagian besar bahan makanan ternakan negara diimport, setiap peningkatan kecekapan mengurangkan kebergantungan import.", {}]]));
body.push(bullet([["Kawalan pencemaran. ", { bold: true }], ["Sisa najis dikumpul dan diurus secara terkawal, menangani gangguan lalat dan bau busuk yang menjadi asas kepada dasar Kerajaan Negeri Perak.", {}]]));
body.push(bullet([["Pematuhan standard. ", { bold: true }], ["Ladang sistem tertutup lebih mudah memenuhi keperluan pensijilan myGAP Sektor Ternakan, dahulunya Skim Amalan Ladang Ternakan (SALT), yang diperkenalkan pada 2003.", {}]]));
body.push(pr([["Sebaliknya, ", { bold: true }], ["sebanyak 480 ladang atau 70.8 peratus daripada 678 ladang di Perak masih beroperasi secara terbuka dan perlu beralih dalam tempoh peralihan yang tinggal. Kos modal bagi penternak kecil, kebergantungan kepada bekalan elektrik yang stabil, serta risiko kematian mengejut sekiranya sistem pengudaraan gagal berfungsi adalah kekangan sebenar yang memerlukan sokongan pembiayaan berperingkat.", {}]], { after: 190 }));

body.push(p("2.  ISU PERKANDANGAN TERNAKAN RUMINAN", { bold: true, keepNext: true }));
body.push(pr([["Setakat ini ", {}], ["tiada mandat persekutuan", { bold: true }], [" yang dikeluarkan oleh JPV bagi mewajibkan sistem perkandangan tertutup untuk ternakan ruminan. Sebarang keputusan seumpamanya turut melibatkan bidang kuasa Kerajaan Negeri masing-masing.", {}]]));
body.push(p("Dari sudut teknikal, pendekatan yang sama tidak boleh dipindahkan terus kepada ruminan. Pengeluaran ruminan di Malaysia sebahagian besarnya berasaskan padang ragut dan integrasi dengan ladang kelapa sawit, dengan kitaran pengeluaran yang jauh lebih panjang berbanding ayam pedaging. Pengurungan sepenuhnya meningkatkan kos makanan ternakan secara ketara kerana ternakan tidak lagi memperoleh sumber ragutan."));
body.push(p("Dengan kata lain, pendekatan JPV bagi sektor ruminan berasaskan insentif, pensijilan dan khidmat pengembangan — naungan dan penyejukan kandang, pengurusan padang ragut, penambahbaikan bekalan air serta nasihat pengurusan tekanan haba — dan bukan mandat struktur yang seragam.", { after: 190 }));

body.push(p("3.  ISU PENGAWALSELIAAN BAHAN GENETIK BERDAYA TAHAN IKLIM", { bold: true, keepNext: true }));
body.push(p("JPV merupakan pihak berkuasa kompeten yang mengawal selia kemasukan, pergerakan dan penggunaan haiwan serta bahan genetik haiwan. Jadual 3 menyenaraikan instrumen perundangan utama."));
const lr = (a, b) => new TableRow({ children: [tc(a, { w: 3300, bold: true }), tc(b, { w: CW - 3300 })] });
body.push(new Table({
  columnWidths: [3300, CW - 3300], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Instrumen perundangan", { w: 3300, bold: true, fill: "EAF3EA" }),
      tc("Peranan berhubung baka berdaya tahan iklim", { w: CW - 3300, bold: true, fill: "EAF3EA" }),
    ] }),
    lr("Akta Binatang 1953 [Akta 647]", "Kawalan import dan eksport binatang hidup serta bahan genetik seperti semen dan embrio. Permit import diperoleh daripada Ketua Pengarah Perkhidmatan Veterinar Malaysia atau Pengarah Perkhidmatan Veterinar Negeri."),
    lr("Akta Perkhidmatan Kuarantin dan Pemeriksaan Malaysia 2011 [Akta 728]", "Pemeriksaan dan kuarantin di pintu masuk negara oleh MAQIS, termasuk pengesahan sijil kesihatan veterinar bagi konsainan yang diimport."),
    lr("Akta Kebajikan Haiwan 2015 [Akta 772]", "Pengendalian, pengangkutan dan penempatan haiwan pembiak yang diimport mematuhi standard kebajikan haiwan."),
    lr("Akta Makanan Haiwan 2009 [Akta 698]", "Kawalan mutu dan keselamatan bahan makanan ternakan, yang menentukan sama ada potensi genetik sesuatu baka dapat direalisasikan di lapangan."),
    lr("Akta Profesion Veterinar 1974 [Akta 147]", "Pengawalseliaan amalan profesion veterinar, termasuk prosedur pembiakan berbantu."),
  ],
}));
body.push(cap(3, "Instrumen perundangan yang mengawal selia kemasukan dan penggunaan bahan genetik haiwan."));

body.push(p("Kerjasama dengan MARDI. MARDI merupakan agensi penyelidikan persekutuan di bawah KPKM, dan bukan badan penyelidikan negeri. MARDI menerajui pembangunan baka lembu Kedah-Kelantan (KK) yang menunjukkan ketahanan terhadap cuaca panas dan lembap serta penyakit, dengan kadar kelahiran melebihi 90 peratus setahun dan kadar kematian kurang daripada 2 peratus (Rujukan: MARDI, penyelidikan sains ternakan)."));
body.push(p("Kerjasama dengan sektor korporat. Dua contoh mutakhir:"));
body.push(bullet([["F&N AgriValley, Negeri Sembilan. ", { bold: true }], ["Kemasukan kelompok komersial pertama seramai 2,500 ekor lembu tenusu pada April 2025, iaitu pengimportan ternakan pembiak terbesar pernah dilaksanakan negara. JPV bersama MAQIS melaksanakan pensijilan kesihatan, pemeriksaan pintu masuk dan kuarantin pasca-import selama dua minggu (Rujukan: Fraser & Neave dan BERNAMA, 2025).", {}]]));
body.push(bullet([["Farm Fresh. ", { bold: true }], ["Memelihara baka Australian Friesian Sahiwal yang sesuai dengan iklim panas dan lembap, serta membangunkan genetik tenusu proprietari bertumpu kepada toleransi haba dan ketahanan penyakit. Sasaran import dinaikkan kepada 3,000 ekor menjelang November 2026 (Rujukan: Business Today dan Forbes, 2026).", {}]]));
body.push(p("Peranan JPV dalam kedua-dua kes adalah memastikan bahan genetik yang diimport memenuhi standard biosekuriti negara tanpa melambatkan pelaburan industri.", { after: 190 }));

body.push(p("4.  ISU PEMINDAHAN TEKNOLOGI DI PERINGKAT LADANG", { bold: true, keepNext: true }));
body.push(p("Penemuan saintifik memberi impak hanya apabila diterjemahkan di peringkat ladang. Jadual 4 memaparkan prestasi rangkaian Pusat Pengembangan Veterinar (VetEC) di seluruh Semenanjung Malaysia bagi tempoh 2021 hingga 2025."));
const vv = (a, b, bold) => new TableRow({ children: [tc(a, { w: 5500 }), tc(b, { w: CW - 5500, align: AlignmentType.CENTER, bold })] });
body.push(new Table({
  columnWidths: [5500, CW - 5500], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Petunjuk prestasi VetEC", { w: 5500, bold: true, fill: "EAF3EA" }),
      tc("2021 → 2025", { w: CW - 5500, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    vv("Bilangan kakitangan", "95 → 96  (+1.05%)"),
    vv("Intervensi bagi setiap lawatan ladang", "3.71 → 5.99  (+61.46%)", true),
    vv("Rawatan klinikal", "+113.5%"),
    vv("Audit pengawalseliaan", "+639.6%"),
    vv("Ternakan dikendalikan bagi tujuan rawatan", "+102.8%"),
    vv("Ternakan dikendalikan bagi tujuan pembiakan", "+47.6%"),
    vv("Dos vaksinasi disampaikan (2025)", "107,581 dos", true),
  ],
}));
body.push(cap(4, "Petunjuk prestasi rangkaian VetEC, Semenanjung Malaysia, 2021–2025 (Rujukan: Poster GAVIS 2026, JPV)."));
body.push(p("Dengan kata lain, bilangan kakitangan kekal hampir tidak berubah pada +1.05 peratus manakala intensiti perkhidmatan setiap lawatan ladang meningkat 61.46 peratus. Pertumbuhan tertumpu kepada enterpris lembu pedaging, kambing pedaging dan bebiri, selaras dengan keutamaan sara diri ruminan negara.", { after: 190 }));

body.push(p("5.  ISU SSR DAN SASARAN 2030", { bold: true, keepNext: true }));
body.push(p("Jadual 5 memaparkan kedudukan tahap sara diri (SSR) subsektor ternakan berbanding sasaran Dasar Agromakanan Negara 2021–2030."));
const sr = (k, ssr, sas, jur, c) => new TableRow({
  children: [tc(k, { w: 3300 }), tc(ssr, { w: 1750, align: AlignmentType.CENTER, bold: !!c, color: c }),
             tc(sas, { w: 1750, align: AlignmentType.CENTER }), tc(jur, { w: CW - 6800, align: AlignmentType.CENTER })],
});
body.push(new Table({
  columnWidths: [3300, 1750, 1750, CW - 6800], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Komoditi", { w: 3300, bold: true, fill: "EAF3EA" }),
      tc("SSR semasa", { w: 1750, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Sasaran 2030", { w: 1750, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Jurang", { w: CW - 6800, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    sr("Daging lembu dan kerbau", "15.9%", "50%", "34.1 mata", RED),
    sr("Daging kambing dan bebiri", "10.6%", "30%", "19.4 mata", RED),
    sr("Daging ayam", "92.9%", "Kekal", "—"),
    sr("Daging itik", "129.9%", "Kekal", "—"),
    sr("Telur ayam dan itik", "107.0%", "Kekal", "—"),
    sr("Susu segar", "66.8%", "Kekal meningkat", "—"),
  ],
}));
body.push(cap(5, "SSR subsektor ternakan (asas 2023) berbanding sasaran Dasar Agromakanan Negara 2021–2030 (Rujukan: Penyata Rasmi Parlimen, 1 Disember 2025; DOSM, 2020–2024)."));

body.push(pr([
  ["Jurang bagi daging lembu dan kerbau ialah 34.1 mata peratusan, iaitu SSR perlu ditingkatkan ", {}],
  ["3.14 kali ganda", { bold: true }],
  [" daripada 15.9 peratus kepada 50 peratus menjelang 2030. Bagi daging kambing dan bebiri, jurang ialah 19.4 mata peratusan atau peningkatan 2.83 kali ganda. Sebaliknya, daging itik pada 129.9 peratus dan telur pada 107.0 peratus kekal melebihi sara diri penuh sejak 2020.", {}],
]));
body.push(p("Genetik berdaya tahan iklim menyumbang kepada tiga perkara: mengurangkan kerugian produktiviti akibat tekanan haba, menurunkan kadar kematian dan kos rawatan, serta memendekkan selang pembiakan sekali gus mempercepat pertumbuhan populasi asas ternakan. Namun demikian, potensi genetik hanya direalisasikan apabila digandingkan dengan bekalan makanan ternakan yang terjamin, biosekuriti berkesan, sistem amaran awal cuaca melampau, serta latihan penternak yang berterusan.", { after: 190 }));

// ── RISIKO ──
body.push(H("RISIKO"));
body.push(bullet([["Risiko salah lapor bidang kuasa. ", { bold: true }], ["Sekiranya premis soalan pertama tidak dibetulkan, JPV berkemungkinan dilaporkan sebagai pihak yang mengeluarkan mandat yang sebenarnya dikeluarkan oleh Kerajaan Negeri. Pembetulan hendaklah dibuat pada awal maklum balas.", {}]]));
body.push(bullet([["Risiko angka tidak disahkan. ", { bold: true }], ["Angka SSR dalam Jadual 5 berasaskan Penyata Rasmi Parlimen dan penerbitan DOSM dengan tahun rujukan 2023. Angka ini hendaklah disahkan sebelum dipetik kepada media.", {}]]));
body.push(bullet([["Risiko ketidakselarasan mesej. ", { bold: true }], ["Kenyataan rasmi JPV di media sosial berhubung isu reban tertutup tidak dapat disemak semasa penyediaan nota ini. Semakan hendaklah dibuat bagi memastikan keselarasan.", {}]]));
body.push(bullet([["Output bukan outcome. ", { bold: true }], ["Angka VetEC dalam Jadual 4 merekodkan aktiviti yang dilaksanakan, bukan perubahan di peringkat ladang. Angka ini tidak boleh dipetik sebagai bukti peningkatan produktiviti ladang.", {}]]));

// ── KESIMPULAN ──
body.push(H("KESIMPULAN (SUDUT INDUSTRI)"));
body.push(eqBar("GENETIK BERDAYA TAHAN IKLIM  =  PELENGKAP,  BUKAN PENGGANTI"), sp(150));
body.push(new Table({
  columnWidths: [CW / 2, CW / 2], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [new TableRow({ children: [
    cell([
      new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: "✓  MENYUMBANG KEPADA", font: F, size: 19, bold: true, color: NAT_GREEN })] }),
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: "Pengurangan kerugian produktiviti akibat tekanan haba · penurunan kadar kematian dan kos rawatan · pemendekan selang pembiakan · pertumbuhan populasi asas ternakan ruminan", font: F, size: 19, color: CHARCOAL })] }),
    ], { w: CW / 2, fill: "F1F7EC" }),
    cell([
      new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: "✗  TIDAK MENGGANTIKAN", font: F, size: 19, bold: true, color: RED })] }),
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: "Keperluan bekalan makanan ternakan yang terjamin · biosekuriti dan pengawasan penyakit · sistem amaran awal cuaca melampau · khidmat pengembangan dan latihan penternak", font: F, size: 19, color: CHARCOAL })] }),
    ], { w: CW / 2, fill: "FAF2F2" }),
  ] })],
}), sp(150));
body.push(p("JPV berpandangan bahawa daya tahan biologi merupakan tunjang penting kepada agenda keterjaminan makanan negara menjelang 2030, dan hendaklah dilaksanakan sebagai sebahagian daripada pendekatan bersepadu di bawah Program Pengganda 30 dan hala tuju Rancangan Malaysia Ketiga Belas 2026–2030."));

// ── TINDAKAN ──
body.push(H("TINDAKAN"));
const ar = (n, t, o, d) => new TableRow({
  children: [tc(n, { w: 620, align: AlignmentType.CENTER, bold: true }), tc(t, { w: 4500 }), tc(o, { w: 2300 }), tc(d, { w: CW - 7420, align: AlignmentType.CENTER })],
});
body.push(new Table({
  columnWidths: [620, 4500, 2300, CW - 7420], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Bil.", { w: 620, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Tindakan", { w: 4500, bold: true, fill: "EAF3EA" }),
      tc("Tanggungjawab", { w: 2300, bold: true, fill: "EAF3EA" }),
      tc("Tarikh siap", { w: CW - 7420, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    ar("1", "Mengesahkan angka SSR bagi keenam-enam komoditi dalam Jadual 5 terhadap siri DOSM terkini, dan mengesahkan tahun rujukan setiap angka", "Bahagian Perancangan Strategik dan Pengurusan Maklumat, JPV", "4 Ogos 2026"),
    ar("2", "Menyemak kenyataan rasmi JPV di laman web dan media sosial berhubung sistem reban tertutup dan baka berdaya tahan iklim, dan melaporkan sebarang ketidakselarasan mesej", "Unit Komunikasi Korporat, JPV", "4 Ogos 2026"),
    ar("3", "Mengesahkan butiran pelaksanaan dasar Negeri Perak, meliputi bilangan ladang yang telah beralih dan pakej sokongan kewangan Negeri", "JPV Negeri Perak", "11 Ogos 2026"),
    ar("4", "Memperoleh kelulusan bagi maklum balas media ini sebelum dikeluarkan", "Ketua Pengarah Perkhidmatan Veterinar", "Sebelum pengeluaran"),
  ],
}));
body.push(cap(6, "Senarai tindakan berserta tanggungjawab dan tarikh siap."));

// ── NOTA ──
body.push(H("NOTA"));
body.push(p("Nota Pembetulan Data", { bold: true, keepNext: true }));
body.push(p("Semasa penyediaan nota ini, satu (1) ketidakselarasan dikesan antara sumber yang dihimpunkan. Bagi SSR susu segar, dua asas dilaporkan iaitu 62.0 peratus dan 66.8 peratus, dengan beza 4.8 mata peratusan. Asas 66.8 peratus digunakan sepanjang nota ini kerana ia dilaporkan bersama-sama angka daging lembu dan kerbau 15.9 peratus dalam siri rujukan yang sama bagi tahun 2023, manakala asas 62.0 peratus dilaporkan tanpa tahun rujukan. Angka terbitan yang berkaitan telah diselaraskan mengikut asas ini."));
body.push(p("Nota Sumber", { bold: true, keepNext: true }));
body.push(p("Nota ini disediakan berdasarkan dokumen dalaman JPV, Perlembagaan Persekutuan, Penyata Rasmi Parlimen, penerbitan Jabatan Perangkaan Malaysia, penerbitan agensi dan laporan media arus perdana."));
body.push(bullet([["Sumber tidak dicapai. ", { bold: true }], ["Fail OneDrive dan SharePoint jabatan tidak dapat dicapai kerana penyambung Microsoft 365 tidak diaktifkan bagi sesi penyediaan. Laman Facebook rasmi JPV dan laman web dvs.gov.my turut tidak dapat dicapai. Tindakan 2 dalam senarai tindakan menangani jurang liputan ini.", {}]]));
body.push(bullet([["Tahun rujukan. ", { bold: true }], ["Angka SSR dalam Jadual 5 menggunakan asas 2023. Angka Jadual 2 merujuk kedudukan yang dilaporkan bagi 2025.", {}]]));
body.push(bullet([["Taraf sumber. ", { bold: true }], ["Kedudukan perundangan dalam Jadual 1 dan Jadual 3 berasaskan instrumen utama. Laporan media digunakan hanya bagi mengesahkan bahawa pengumuman dasar Negeri telah dibuat, dan bukan bagi menentukan kandungan kuasa perundangan.", {}]]));

// ── SUMBER RUJUKAN ──
body.push(H("SUMBER RUJUKAN"));
[
  "Perlembagaan Persekutuan, Jadual Kesembilan, Senarai Bersama (Senarai III).",
  "Akta Binatang 1953 [Akta 647]; Akta Perkhidmatan Kuarantin dan Pemeriksaan Malaysia 2011 [Akta 728]; Akta Kebajikan Haiwan 2015 [Akta 772]; Akta Makanan Haiwan 2009 [Akta 698]; Akta Profesion Veterinar 1974 [Akta 147].",
  "Parlimen Malaysia (2025). Penyata Rasmi Parlimen, Mesyuarat Ketiga, Penggal Keempat, Parlimen Kelima Belas, 1 Disember 2025. Jawapan bertulis.",
  "Jabatan Perangkaan Malaysia (2026). Akaun Pembekalan dan Penggunaan Komoditi Pertanian Terpilih, 2020–2024.",
  "Jabatan Perkhidmatan Veterinar (2026). Poster GAVIS 2026: Veterinary Extension as a Pillar of Livestock Industry Development — DVS VetEC 2021–2025. Dokumen dalaman.",
  "Jabatan Perkhidmatan Veterinar (2026). Abstrak GAVIS 2026: Climate Resilience in Malaysia's Livestock Sector. Dokumen dalaman.",
  "Sinar Harian dan MG Perak (2026). Pengumuman Exco Kerajaan Negeri Perak berhubung pewajipan sistem reban tertutup.",
  "New Straits Times (2026). All poultry farms in Perak to adopt closed-house system by 2027.",
  "MARDI. Penyelidikan sains ternakan; laporan baka lembu Kedah-Kelantan (KK).",
  "Fraser & Neave dan BERNAMA (2025). F&N AgriValley, Negeri Sembilan.",
  "Business Today dan Forbes (2026). Farm Fresh — baka Australian Friesian Sahiwal.",
  "PLANMalaysia (2023). Garis Panduan Perancangan Ladang Penternakan Ayam, Edisi Ogos 2023.",
  "KPKM (2025). Kenyataan media: Pengukuhan Keterjaminan Makanan menerusi RMK13 2026–2030.",
  "KPKM dan Jabatan Pertanian. Skim Pensijilan myGAP Sektor Ternakan, dahulunya SALT (2003).",
].forEach((s, i) => body.push(new Paragraph({
  spacing: { after: 75, line: 252 }, indent: { left: 420, hanging: 420 },
  children: [new TextRun({ text: `${i + 1}.  ${s}`, font: F, size: 18, color: CHARCOAL })],
})));

body.push(sp(220));
body.push(new Paragraph({ spacing: { after: 25 }, children: [new TextRun({ text: "Bahagian Pembangunan Industri Ternakan", font: F, size: 20, bold: true, color: NAVY_TEXT })] }));
body.push(new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "Jabatan Perkhidmatan Veterinar Malaysia", font: F, size: 20, color: CHARCOAL })] }));

const doc = new Document({
  creator: "Jabatan Perkhidmatan Veterinar Malaysia",
  title: "Nota Maklum Balas Media — Latihan Penternak dan Daya Tahan Iklim",
  description: "Mode B (Nota) — pertanyaan media berhubung latihan penternak menghadapi perubahan iklim",
  numbering: { config: [{ reference: "dot", levels: [{
    level: 0, format: LevelFormat.BULLET, text: "●", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 420, hanging: 220 } }, run: { font: F, size: 16, color: NAT_GREEN } },
  }] }] },
  styles: { default: { document: { run: { font: F, size: 21, color: CHARCOAL }, paragraph: { spacing: { line: 268 } } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1250, right: 1440, bottom: 1250, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: DEEP_NAVY, space: 8 } },
      spacing: { before: 90 },
      children: [
        new TextRun({ text: "Nota Maklum Balas Media — BPIT, JPV Malaysia  ·  Deraf Dalaman  ·  Halaman ", font: F, size: 15, color: GREY }),
        new TextRun({ children: [PageNumber.CURRENT], font: F, size: 15, color: GREY }),
        new TextRun({ text: " daripada ", font: F, size: 15, color: GREY }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: F, size: 15, color: GREY }),
      ],
    })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[2], b); console.log("written:", process.argv[2]); });
