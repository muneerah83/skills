const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageNumber, Footer,
} = require("docx");
const fs = require("fs");

const GREEN = "1F5C3D";
const GREY = "595959";
const RED = "9C2B2B";
const CW = 9026; // lebar kandungan dalam DXA (A4, margin 1440)
const FONT = "Arial";

// ---------- pembantu ----------
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, line: opts.line ?? 276 },
    alignment: opts.align,
    indent: opts.indent,
    children: [
      new TextRun({
        text, font: FONT, size: opts.size ?? 21,
        bold: opts.bold, italics: opts.italics, color: opts.color ?? "000000",
      }),
    ],
  });

const pr = (runs, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, line: opts.line ?? 276 },
    alignment: opts.align,
    indent: opts.indent,
    children: runs.map(
      ([text, o = {}]) =>
        new TextRun({
          text, font: FONT, size: o.size ?? opts.size ?? 21,
          bold: o.bold, italics: o.italics, color: o.color ?? "000000",
        })
    ),
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    keepNext: true, keepLines: true,
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: GREEN })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 130 },
    keepNext: true, keepLines: true,
    children: [new TextRun({ text, font: FONT, size: 23, bold: true, color: "000000" })],
  });

const bullet = (text, opts = {}) =>
  new Paragraph({
    numbering: { reference: "dash-list", level: 0 },
    spacing: { after: 90, line: 276 },
    children: [new TextRun({ text, font: FONT, size: 21, color: opts.color ?? "000000" })],
  });

const rule = () =>
  new Paragraph({
    spacing: { before: 60, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN, space: 1 } },
    children: [new TextRun({ text: "", font: FONT, size: 2 })],
  });

const cell = (children, opts = {}) =>
  new TableCell({
    width: { size: opts.w, type: WidthType.DXA },
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    verticalAlign: opts.valign,
    children,
  });

const tcell = (text, opts = {}) =>
  cell(
    [
      new Paragraph({
        spacing: { after: 0, line: 260 },
        alignment: opts.align,
        children: [
          new TextRun({
            text, font: FONT, size: opts.size ?? 19,
            bold: opts.bold, color: opts.color ?? "000000",
          }),
        ],
      }),
    ],
    opts
  );

const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
};

// Kotak notis dengan jalur aksen di kiri
const calloutBox = (label, text, accent, fill) =>
  new Table({
    columnWidths: [CW],
    width: { size: CW, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: accent },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: accent },
      left: { style: BorderStyle.SINGLE, size: 18, color: accent },
      right: { style: BorderStyle.SINGLE, size: 4, color: accent },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: label, font: FONT, size: 20, bold: true, color: accent })],
              }),
              new Paragraph({
                spacing: { after: 0, line: 260 },
                children: [
                  new TextRun({
                    text, font: FONT, size: 20,
                    italics: accent === GREEN, color: "1A1A1A",
                  }),
                ],
              }),
            ],
            { w: CW, fill }
          ),
        ],
      }),
    ],
  });

const qBlock = (qtext) => calloutBox("PERTANYAAN MEDIA", qtext, GREEN, "F2F7F4");

const spacer = (after = 160) => new Paragraph({ spacing: { after }, children: [] });

// ---------- kandungan dokumen ----------
const body = [];

// Kepala surat
body.push(
  new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "JABATAN PERKHIDMATAN VETERINAR MALAYSIA", font: FONT, size: 24, bold: true, color: GREEN })],
  }),
  new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "KEMENTERIAN PERTANIAN DAN KETERJAMINAN MAKANAN", font: FONT, size: 20, bold: true, color: GREY })],
  }),
  new Paragraph({
    spacing: { after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Wisma Tani, Blok Podium, Lot 4G1, Presint 4, 62630 Putrajaya", font: FONT, size: 17, color: GREY })],
  }),
  rule()
);

body.push(
  new Paragraph({
    spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "KERTAS JAWAPAN MEDIA", font: FONT, size: 22, bold: true, color: GREY })],
  }),
  new Paragraph({
    spacing: { after: 240 }, alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "LATIHAN PENTERNAK DAN PEMBINAAN DAYA TAHAN IKLIM DALAM SEKTOR TERNAKAN NEGARA",
        font: FONT, size: 28, bold: true, color: "000000",
      }),
    ],
  })
);

// Jadual maklumat
const metaRow = (k, v, vColor) =>
  new TableRow({
    cantSplit: true,
    children: [tcell(k, { w: 2400, bold: true, fill: "F5F5F5" }), tcell(v, { w: CW - 2400, color: vColor })],
  });

body.push(
  new Table({
    columnWidths: [2400, CW - 2400],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      metaRow("Perkara", "Pertanyaan media berhubung latihan penternak menghadapi perubahan iklim"),
      metaRow("Tarikh", "28 Julai 2026"),
      metaRow("Disediakan oleh", "Ernie Muneerah Mohd Adhan, Jabatan Perkhidmatan Veterinar Malaysia"),
      metaRow("Bilangan soalan", "Tiga (3) soalan utama dan dua (2) soalan susulan"),
      metaRow("Status", "DERAF DALAMAN — untuk semakan dan kelulusan sebelum dikeluarkan", RED),
    ],
  }),
  spacer()
);

// 1.0 TUJUAN
body.push(h1("1.0  TUJUAN"));
body.push(p("1.1  Kertas ini disediakan bagi membantu pegawai Jabatan Perkhidmatan Veterinar (JPV) menjawab pertanyaan yang dikemukakan oleh pihak media berhubung latihan penternak, penyesuaian iklim serta pembangunan dan penggunaan baka ternakan berdaya tahan iklim di Malaysia."));
body.push(p("1.2  Jawapan disusun mengikut urutan soalan asal yang diterima. Setiap jawapan disokong oleh rujukan sumber sebagaimana disenaraikan dalam Seksyen 6.0. Nota mengenai jurang maklumat dan perkara yang memerlukan pengesahan lanjut dinyatakan dalam Seksyen 7.0."));

// 2.0 LATAR BELAKANG
body.push(h1("2.0  LATAR BELAKANG"));
body.push(p("2.1  Sektor ternakan negara semakin terdedah kepada risiko berkaitan iklim yang boleh menjejaskan kesihatan haiwan, produktiviti, ketersediaan bahan makanan ternakan dan keterjaminan makanan negara. Kenaikan suhu dan kejadian cuaca melampau yang lebih kerap berupaya mengurangkan pengambilan makanan, kadar tumbesaran, prestasi pembiakan serta pengeluaran daging, susu dan telur, di samping meningkatkan risiko penyakit dan kematian ternakan."));
body.push(p("2.2  Tekanan ini digandakan lagi oleh kebergantungan negara terhadap bahan makanan ternakan import, kenaikan kos makanan ternakan, serta tahap sara diri yang masih rendah bagi daging lembu dan kerbau."));
body.push(p("2.3  Sebagai respons, JPV telah memperkukuh penyelarasan bencana, mengeluarkan nasihat pengurusan tekanan haba, mempertingkat pengawasan penyakit dan biosekuriti ladang, serta menyediakan bimbingan teknikal menerusi rangkaian pengembangan veterinar di seluruh negara."));

// 3.0 PEMBETULAN PREMIS
body.push(h1("3.0  NOTA PEMBETULAN PREMIS SOALAN"));
body.push(
  calloutBox(
    "PERHATIAN PEGAWAI",
    "Premis Soalan 1 mengandungi kesilapan fakta mengenai bidang kuasa. Pembetulan hendaklah dibuat secara sopan sebelum jawapan diberikan, bagi mengelakkan JPV dilaporkan sebagai pihak yang mengeluarkan mandat yang sebenarnya dikeluarkan oleh Kerajaan Negeri.",
    RED,
    "FBF3F3"
  ),
  spacer()
);

body.push(
  pr([
    ["3.1  Soalan 1 menyatakan bahawa ", {}],
    ['"DVS has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak."', { italics: true }],
    [" Pernyataan ini ", {}],
    ["tidak tepat", { bold: true }],
    [" dari sudut fakta dan bidang kuasa.", {}],
  ])
);
body.push(
  pr([
    ["3.2  Pewajipan sistem reban tertutup di Perak merupakan ", {}],
    ["dasar Kerajaan Negeri Perak", { bold: true }],
    [", dan bukan arahan atau mandat JPV di peringkat persekutuan. Dasar tersebut diumumkan oleh Pihak Berkuasa Negeri melalui Exco Pembangunan Luar Bandar, Perladangan, Pertanian dan Industri Asas Tani Negeri Perak, iaitu YB Datuk Mohd Zolkafly Harun. Tempoh peralihan diberikan sehingga akhir tahun 2026, manakala penguatkuasaan penuh akan bermula pada 1 Januari 2027.", {}],
  ])
);
body.push(p("3.3  Kedudukan perundangan. Di bawah Jadual Kesembilan Perlembagaan Persekutuan, ternakan binatang, mencegah kekejaman terhadap binatang, perkhidmatan veterinar dan kuarantin binatang terletak dalam Senarai Bersama (Senarai III), iaitu bidang kuasa yang dikongsi antara Kerajaan Persekutuan dan Kerajaan Negeri. Manakala tanah, kerajaan tempatan serta perancangan bandar dan desa melibatkan bidang kuasa Negeri. Oleh yang demikian, keputusan mewajibkan struktur reban tertutup — yang melibatkan kelulusan perancangan, pelesenan premis dan kawalan pencemaran setempat — berada dalam lingkungan kuasa Kerajaan Negeri."));
body.push(p("3.4  Peranan JPV dalam perkara ini bersifat teknikal, pengawalseliaan kesihatan haiwan dan khidmat nasihat. Ini termasuk penyediaan input teknikal kepada garis panduan perancangan ladang penternakan ayam yang diterbitkan oleh PLANMalaysia, penetapan standard biosekuriti, serta pensijilan amalan ladang ternakan."));
body.push(p("3.5  Cadangan ayat pembetulan untuk digunakan bersama media:", { bold: true }));
body.push(
  new Table({
    columnWidths: [CW],
    width: { size: CW, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 12, color: "BFBFBF" }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            [
              new Paragraph({
                spacing: { after: 0, line: 276 },
                children: [
                  new TextRun({
                    text: "“Untuk makluman, pewajipan sistem reban tertutup di Perak merupakan dasar Kerajaan Negeri Perak dan bukan mandat Jabatan Perkhidmatan Veterinar. JPV berperanan menyediakan sokongan teknikal, standard biosekuriti dan khidmat nasihat veterinar bagi menyokong pelaksanaan dasar tersebut, selaras dengan peruntukan Senarai Bersama di bawah Perlembagaan Persekutuan.”",
                    font: FONT, size: 21, italics: true, color: "1A1A1A",
                  }),
                ],
              }),
            ],
            { w: CW }
          ),
        ],
      }),
    ],
  }),
  spacer()
);

// 4.0 JAWAPAN
body.push(h1("4.0  JAWAPAN KEPADA PERTANYAAN MEDIA"));

// --- S1
body.push(h2("Soalan 1"));
body.push(
  qBlock(
    "In an interview with MARDI, it was mentioned that DVS has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak. How will the closed-house system be more sustainable than free-range, open farms?"
  )
);
body.push(spacer(140));

body.push(p("4.1  Sebelum menjawab, pembetulan sebagaimana Seksyen 3.0 hendaklah dinyatakan terlebih dahulu. Setelah pembetulan dibuat, jawapan teknikal berikut boleh diberikan."));
body.push(p("4.2  Dari sudut kelestarian, sistem reban tertutup menawarkan kelebihan berikut berbanding sistem reban terbuka:"));
body.push(bullet("Kawalan persekitaran mikro dan pengurangan tekanan haba. Sistem tertutup membolehkan suhu, kelembapan dan kadar pengudaraan dikawal secara berterusan. Ini mengurangkan tekanan haba yang menjadi punca utama kejatuhan pengambilan makanan, tumbesaran terbantut dan peningkatan kematian semasa gelombang haba — iaitu risiko yang dijangka meningkat kekerapannya akibat perubahan iklim."));
body.push(bullet("Biosekuriti dan pencegahan penyakit. Struktur tertutup mengehadkan sentuhan antara ternakan dengan burung liar, rodensia dan vektor penyakit. Ini menurunkan risiko kemasukan penyakit bawaan burung liar seperti selesema burung, sekali gus mengurangkan kebergantungan kepada rawatan dan kerugian akibat wabak."));
body.push(bullet("Kecekapan penukaran makanan. Persekitaran yang stabil menghasilkan kadar penukaran makanan (FCR) yang lebih baik. Memandangkan sebahagian besar bahan makanan ternakan negara diimport, setiap peningkatan kecekapan FCR mengurangkan kebergantungan import dan jejak karbon per kilogram daging yang dikeluarkan."));
body.push(bullet("Kawalan pencemaran dan sisa. Sistem tertutup membolehkan sisa najis dikumpul, dikeringkan dan diurus secara terkawal. Ini menangani isu gangguan lalat dan bau busuk yang menjadi punca utama aduan orang awam terhadap ladang ayam sistem terbuka — dan yang menjadi asas kepada dasar Kerajaan Negeri Perak."));
body.push(bullet("Kebolehjejakan dan pematuhan standard. Ladang sistem tertutup lebih mudah memenuhi keperluan pensijilan myGAP Sektor Ternakan (dahulunya Skim Amalan Ladang Ternakan, SALT), yang merangkumi program kesihatan ternakan, biosekuriti, sanitari dan pengurusan sisa ladang."));
body.push(p("4.3  Bagi mengekalkan ketelusan, JPV turut mengakui kekangan pelaksanaan yang dibangkitkan oleh industri, iaitu kos modal yang tinggi bagi penternak kecil, kebergantungan kepada bekalan tenaga elektrik yang stabil, serta risiko kematian mengejut sekiranya sistem pengudaraan gagal berfungsi. Perkara ini memerlukan sokongan pembiayaan dan peralihan berperingkat, dan bukan sekadar penguatkuasaan.", { after: 200 }));

// --- S1(a)
body.push(h2("Soalan 1(a)"));
body.push(qBlock("Will a similar approach be mandated for livestock?"));
body.push(spacer(140));

body.push(
  pr([
    ["4.4  Setakat ini, ", {}],
    ["tiada mandat persekutuan", { bold: true }],
    [" yang dikeluarkan oleh JPV bagi mewajibkan sistem perkandangan tertutup untuk ternakan ruminan. Sebarang keputusan seumpamanya juga akan melibatkan bidang kuasa Kerajaan Negeri masing-masing, sebagaimana dijelaskan dalam Seksyen 3.3.", {}],
  ])
);
body.push(p("4.5  Dari sudut teknikal, pendekatan yang sama tidak boleh dipindahkan terus kepada ruminan. Sistem pengeluaran ruminan di Malaysia sebahagian besarnya berasaskan padang ragut dan integrasi dengan ladang kelapa sawit, dengan kitaran pengeluaran yang jauh lebih panjang berbanding ayam pedaging. Pengurungan sepenuhnya bagi ruminan akan meningkatkan kos makanan ternakan secara ketara kerana ternakan tidak lagi memperoleh sumber ragutan, dan berpotensi menjejaskan kebajikan haiwan sekiranya tidak dirancang dengan teliti."));
body.push(p("4.6  Pendekatan JPV bagi sektor ruminan lebih menjurus kepada galakan berasaskan insentif, pensijilan dan khidmat pengembangan — antaranya pensijilan myGAP, naungan (shade) dan penyejukan di kawasan kandang, pengurusan padang ragut, penambahbaikan bekalan air, serta nasihat pengurusan tekanan haba — dan bukan melalui mandat struktur yang seragam.", { after: 200 }));

// --- S2
body.push(h2("Soalan 2"));
body.push(
  qBlock(
    "MARDI highlighted that while they lead the scientific research on climate-resilient livestock genetics, widespread field adoption relies heavily on coordination. How does DVS enable this and could you elaborate on the department's regulatory role in facilitating the deployment of climate-smart livestock breeds in Malaysia?"
  )
);
body.push(spacer(140));

body.push(p("4.7  Peranan JPV boleh dibahagikan kepada dua fungsi utama, iaitu fungsi pengawalseliaan dan fungsi pemindahan teknologi di lapangan."));

body.push(p("(a)  Fungsi pengawalseliaan", { bold: true }));
body.push(p("4.8  JPV merupakan pihak berkuasa kompeten yang mengawal selia kemasukan, pergerakan dan penggunaan haiwan serta bahan genetik haiwan di Malaysia. Instrumen perundangan utama adalah seperti berikut:"));

body.push(
  new Table({
    columnWidths: [3200, CW - 3200],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Instrumen perundangan", { w: 3200, bold: true, fill: "EDF3EF" }),
          tcell("Kaitan dengan penggunaan baka berdaya tahan iklim", { w: CW - 3200, bold: true, fill: "EDF3EF" }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Akta Binatang 1953 [Akta 647]", { w: 3200, bold: true }),
          tcell("Kawalan import dan eksport binatang hidup serta bahan genetik seperti semen dan embrio. Permit import perlu diperoleh daripada Ketua Pengarah Perkhidmatan Veterinar Malaysia atau Pengarah Perkhidmatan Veterinar Negeri. Akta ini juga mengawal pergerakan ternakan dan kawalan penyakit.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Akta Perkhidmatan Kuarantin dan Pemeriksaan Malaysia 2011 [Akta 728]", { w: 3200, bold: true }),
          tcell("Pemeriksaan dan kuarantin di pintu masuk negara oleh MAQIS, termasuk pengesahan sijil kesihatan veterinar bagi konsainan haiwan pembiak dan bahan genetik yang diimport.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Protokol import dan sijil kesihatan veterinar", { w: 3200, bold: true }),
          tcell("Penetapan syarat kesihatan khusus mengikut negara pengeksport dan spesies, termasuk ujian penyakit, tempoh kuarantin pra-import dan pasca-import.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Akta Kebajikan Haiwan 2015 [Akta 772]", { w: 3200, bold: true }),
          tcell("Memastikan pengendalian, pengangkutan dan penempatan haiwan pembiak yang diimport memenuhi standard kebajikan haiwan.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Akta Makanan Haiwan 2009 [Akta 698]", { w: 3200, bold: true }),
          tcell("Kawalan mutu dan keselamatan bahan makanan ternakan, yang menentukan sama ada potensi genetik sesuatu baka dapat direalisasikan di lapangan.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Akta Profesion Veterinar 1974 [Akta 147]", { w: 3200, bold: true }),
          tcell("Mengawal selia amalan profesion veterinar, termasuk prosedur pembiakan berbantu yang memerlukan kepakaran veterinar berdaftar.", { w: CW - 3200 }),
        ],
      }),
    ],
  }),
  spacer(200)
);

body.push(p("(b)  Fungsi pemindahan teknologi dan pengembangan", { bold: true }));
body.push(p("4.9  Penemuan saintifik hanya memberi impak apabila diterjemahkan di peringkat ladang. Fungsi ini dilaksanakan menerusi rangkaian Pusat Pengembangan Veterinar (VetEC) JPV di seluruh Semenanjung Malaysia. Prestasi rangkaian ini bagi tempoh 2021 hingga 2025 adalah seperti berikut:"));

body.push(
  new Table({
    columnWidths: [5600, CW - 5600],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Petunjuk prestasi VetEC (2021–2025)", { w: 5600, bold: true, fill: "EDF3EF" }),
          tcell("Pencapaian", { w: CW - 5600, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({ children: [tcell("Bilangan kakitangan", { w: 5600 }), tcell("95 → 96 (+1.05%)", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Intervensi bagi setiap lawatan ladang", { w: 5600 }), tcell("3.71 → 5.99", { w: CW - 5600, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [tcell("Rawatan klinikal", { w: 5600 }), tcell("+113.5%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Audit pengawalseliaan", { w: 5600 }), tcell("+639.6%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Ternakan dikendalikan bagi tujuan rawatan", { w: 5600 }), tcell("+102.8%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Ternakan dikendalikan bagi tujuan pembiakan", { w: 5600 }), tcell("+47.6%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Dos vaksinasi disampaikan (2025)", { w: 5600 }), tcell("107,581 dos", { w: CW - 5600, align: AlignmentType.CENTER, bold: true })] }),
    ],
  }),
  spacer()
);

body.push(p("4.10  Data ini menunjukkan pemisahan yang ketara antara saiz tenaga kerja dengan hasil perkhidmatan: bilangan kakitangan kekal hampir tidak berubah, namun intensiti perkhidmatan setiap lawatan ladang meningkat dengan mendadak. Pertumbuhan tertumpu kepada enterpris lembu pedaging, kambing pedaging dan bebiri, iaitu selaras dengan keutamaan sara diri ruminan negara. Inilah mekanisme sebenar yang membolehkan hasil penyelidikan diterima pakai secara meluas di lapangan.", { after: 200 }));

// --- S2(a)
body.push(h2("Soalan 2(a)"));
body.push(
  qBlock(
    "What are the other ways DVS collaborates with state research bodies (like MARDI) and corporate pioneers (like Farm Fresh and F&N) to streamline the import and distribution of climate-resilient genetic materials?"
  )
);
body.push(spacer(140));

body.push(p("4.11  Nota pembetulan kecil: MARDI merupakan agensi penyelidikan di bawah Kementerian Pertanian dan Keterjaminan Makanan iaitu agensi persekutuan, dan bukan badan penyelidikan negeri (state research body). Pembetulan ini wajar dibuat secara ringkas bagi mengelakkan salah lapor."));
body.push(p("4.12  Kerjasama dengan MARDI. MARDI menerajui penyelidikan saintifik termasuk pembangunan baka lembu Kedah-Kelantan (KK) yang menunjukkan ketahanan terhadap cuaca panas dan lembap serta penyakit, dengan kadar kelahiran melebihi 90 peratus setahun dan kadar kematian kurang daripada dua peratus, di samping keupayaan mengekalkan produktiviti dengan makanan bermutu sederhana. JPV menyokong menerusi pengesahan status kesihatan haiwan, khidmat veterinar bagi program pembiakan, serta penyebaran hasil penyelidikan kepada penternak melalui rangkaian VetEC."));
body.push(p("4.13  Kerjasama dengan sektor korporat. Dua contoh mutakhir menunjukkan peranan JPV dalam memudah cara kemasukan bahan genetik berdaya tahan iklim:"));
body.push(bullet("F&N AgriValley, Negeri Sembilan. Kemasukan kelompok komersial pertama seramai 2,500 ekor lembu tenusu pada April 2025 merupakan pengimportan ternakan pembiak terbesar pernah dilaksanakan oleh negara. JPV bersama MAQIS melaksanakan pensijilan kesihatan, pemeriksaan pintu masuk dan kuarantin pasca-import selama dua minggu di ladang berkenaan."));
body.push(bullet("Farm Fresh. Syarikat ini memelihara baka Australian Friesian Sahiwal, iaitu baka yang dibangunkan di Australia dan sesuai dengan iklim panas dan lembap. Syarikat turut membangunkan keupayaan pembiakan dalaman dengan genetik tenusu proprietari yang menumpukan kepada toleransi haba, ketahanan penyakit dan produktiviti. Sasaran import dinaikkan kepada 3,000 ekor lembu menjelang November 2026."));
body.push(p("4.14  Dalam kedua-dua kes, sumbangan JPV adalah memastikan bahan genetik yang diimport memenuhi standard biosekuriti negara tanpa melambatkan pelaburan industri — iaitu mengimbangi peranan pengawalseliaan dengan peranan memudah cara.", { after: 200 }));

// --- S3
body.push(h2("Soalan 3"));
body.push(
  qBlock(
    "Looking toward 2030, how critical is this shift toward biological resilience and genetic climate adaptation to safeguarding Malaysia's self-sufficiency levels for livestock and poultry?"
  )
);
body.push(spacer(140));

body.push(p("4.15  Kedudukan semasa tahap sara diri (SSR) bagi subsektor ternakan adalah seperti berikut:"));

body.push(
  new Table({
    columnWidths: [4000, 2300, CW - 6300],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Komoditi", { w: 4000, bold: true, fill: "EDF3EF" }),
          tcell("SSR semasa", { w: 2300, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
          tcell("Sasaran DAN 2021–2030", { w: CW - 6300, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Daging lembu dan kerbau", { w: 4000 }),
          tcell("15.9% (2023)", { w: 2300, align: AlignmentType.CENTER, bold: true, color: RED }),
          tcell("50%", { w: CW - 6300, align: AlignmentType.CENTER, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Daging kambing dan bebiri", { w: 4000 }),
          tcell("10.6%", { w: 2300, align: AlignmentType.CENTER, bold: true, color: RED }),
          tcell("30%", { w: CW - 6300, align: AlignmentType.CENTER, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Daging ayam", { w: 4000 }),
          tcell("92.9%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Kekal berhampiran sara diri penuh", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Daging itik", { w: 4000 }),
          tcell("129.9%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Melebihi sara diri penuh sejak 2020", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Telur ayam dan itik", { w: 4000 }),
          tcell("107.0%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Melebihi sara diri penuh sejak 2020", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Susu segar", { w: 4000 }),
          tcell("62% – 66.8%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Peningkatan menerusi lembah tenusu", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
    ],
  }),
  spacer()
);

body.push(
  pr([
    ["4.16  Jurang antara kedudukan semasa dengan sasaran adalah luas, khususnya bagi daging lembu dan kerbau, iaitu daripada 15.9 peratus kepada sasaran 50 peratus menjelang 2030. Justeru, peralihan ke arah daya tahan biologi dan penyesuaian genetik terhadap iklim adalah ", {}],
    ["kritikal", { bold: true }],
    [", tetapi ia bukan faktor tunggal yang memadai.", {}],
  ])
);
body.push(p("4.17  Genetik yang berdaya tahan iklim menyumbang kepada tiga perkara: mengurangkan kerugian produktiviti akibat tekanan haba, menurunkan kadar kematian dan kos rawatan, serta memendekkan selang pembiakan sekali gus mempercepat pertumbuhan populasi asas ternakan. Ketiga-tiganya menyokong secara langsung usaha meningkatkan SSR."));
body.push(p("4.18  Namun potensi genetik hanya dapat direalisasikan apabila digandingkan dengan bekalan makanan ternakan yang terjamin, biosekuriti dan pengawasan penyakit yang berkesan, sistem amaran awal cuaca melampau, serta khidmat pengembangan dan latihan penternak yang berterusan. Baka terbaik sekalipun tidak akan mencapai potensinya sekiranya bekalan makanan ternakan terganggu atau wabak penyakit tidak terkawal."));
body.push(p("4.19  Usaha ini disokong oleh Program Pengganda 30, iaitu intervensi bersepadu antara syarikat, penternak dan agensi bagi meningkatkan populasi asas ternakan ruminan pedaging, serta hala tuju keterjaminan makanan di bawah Rancangan Malaysia Ketiga Belas (RMK13) 2026–2030 yang memberi penekanan kepada pemindahan teknologi, adaptasi pertanian pintar dan pengukuhan rantaian nilai agromakanan."));
body.push(p("4.20  Kesimpulannya, JPV berpandangan bahawa daya tahan biologi merupakan tunjang penting kepada agenda keterjaminan makanan negara menjelang 2030, dan perlu dilaksanakan sebagai sebahagian daripada pendekatan bersepadu yang merangkumi amalan penternakan pintar iklim, sistem pengawasan yang diperkukuh, bekalan makanan ternakan yang lebih terjamin, serta kerjasama berterusan antara agensi kerajaan, pihak industri dan penternak.", { after: 200 }));

// 5.0 RINGKASAN
body.push(h1("5.0  RINGKASAN POIN UTAMA"));
body.push(p("5.1  Poin berikut boleh digunakan sebagai rujukan pantas semasa sesi bersama media:"));
body.push(bullet("Pewajipan reban tertutup di Perak adalah dasar Kerajaan Negeri Perak, bukan mandat JPV. Penguatkuasaan penuh bermula 1 Januari 2027."));
body.push(bullet("Ternakan binatang dan perkhidmatan veterinar berada dalam Senarai Bersama Perlembagaan Persekutuan; tanah dan perancangan setempat adalah bidang kuasa Negeri."));
body.push(bullet("Sistem reban tertutup lebih lestari kerana kawalan tekanan haba, biosekuriti, kecekapan makanan ternakan dan pengurusan sisa — namun kos modal kekal sebagai cabaran sebenar penternak kecil."));
body.push(bullet("Tiada mandat persekutuan bagi perkandangan tertutup ternakan ruminan. Pendekatan adalah berasaskan insentif, pensijilan dan khidmat pengembangan."));
body.push(bullet("Peranan pengawalseliaan JPV berteraskan Akta Binatang 1953 [Akta 647] bagi permit import haiwan dan bahan genetik, disokong Akta 728, Akta 772, Akta 698 dan Akta 147."));
body.push(bullet("Rangkaian VetEC merupakan mekanisme pemindahan teknologi: intervensi setiap lawatan ladang meningkat daripada 3.71 kepada 5.99 antara 2021 hingga 2025, dengan 107,581 dos vaksinasi pada 2025."));
body.push(bullet("SSR daging lembu dan kerbau kekal pada 15.9 peratus berbanding sasaran 50 peratus menjelang 2030. Genetik berdaya tahan iklim adalah kritikal, tetapi perlu digandingkan dengan bekalan makanan ternakan, biosekuriti dan latihan penternak."));

// 6.0 SUMBER
body.push(h1("6.0  SUMBER RUJUKAN"));

const srcRow = (no, src, note) =>
  new TableRow({
    children: [
      tcell(no, { w: 700, align: AlignmentType.CENTER }),
      tcell(src, { w: 3600 }),
      tcell(note, { w: CW - 4300 }),
    ],
  });

body.push(
  new Table({
    columnWidths: [700, 3600, CW - 4300],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Bil.", { w: 700, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
          tcell("Sumber", { w: 3600, bold: true, fill: "EDF3EF" }),
          tcell("Maklumat yang diambil", { w: CW - 4300, bold: true, fill: "EDF3EF" }),
        ],
      }),
      srcRow("1", "Dokumen dalaman JPV — abstrak GAVIS 2026, “Climate Resilience in Malaysia's Livestock Sector” (Mohd Noor Hisham Mohd Haron, Zulkifli Ishak, Ernie Muneerah Mohd Adhan, Salleh Sheikh Ibrahim)", "Latar belakang kerentanan iklim sektor ternakan dan respons strategik JPV (Seksyen 2.0)"),
      srcRow("2", "Dokumen dalaman JPV — poster GAVIS 2026, “Veterinary Extension as a Pillar of Livestock Industry Development: DVS VetEC 2021–2025”", "Semua angka prestasi VetEC dalam Jawapan 2"),
      srcRow("3", "Sinar Harian dan MG Perak — pengumuman Exco Negeri Perak, YB Datuk Mohd Zolkafly Harun", "Pengesahan bahawa mandat reban tertutup adalah dasar Kerajaan Negeri Perak; tarikh penguatkuasaan 1 Januari 2027"),
      srcRow("4", "New Straits Times — “All poultry farms in Perak to adopt closed-house system by 2027”", "Statistik ladang dan garis masa peralihan"),
      srcRow("5", "Perlembagaan Persekutuan, Jadual Kesembilan", "Kedudukan ternakan binatang, perkhidmatan veterinar dan kuarantin binatang dalam Senarai Bersama"),
      srcRow("6", "Akta Binatang 1953 [Akta 647]; Akta Perkhidmatan Kuarantin dan Pemeriksaan Malaysia 2011 [Akta 728]; Akta Kebajikan Haiwan 2015 [Akta 772]; Akta Makanan Haiwan 2009 [Akta 698]; Akta Profesion Veterinar 1974 [Akta 147]", "Rangka kerja pengawalseliaan dalam Jawapan 2"),
      srcRow("7", "Penyata Rasmi Parlimen (Hansard), Mesyuarat Ketiga, Penggal Keempat, Parlimen Kelima Belas, 1 Disember 2025", "SSR daging lembu dan kerbau 15.9%; kambing dan bebiri 10.6%; sasaran 50% dan 30% di bawah DAN 2021–2030; Program Pengganda 30"),
      srcRow("8", "Jabatan Perangkaan Malaysia (DOSM) — Akaun Pembekalan dan Penggunaan Komoditi Pertanian Terpilih, 2020–2024", "SSR daging ayam, daging itik, telur dan susu segar"),
      srcRow("9", "Fraser & Neave dan BERNAMA — F&N AgriValley", "Kemasukan 2,500 ekor lembu tenusu, April 2025; peranan JPV dan MAQIS dalam kuarantin pasca-import"),
      srcRow("10", "Business Today dan Forbes — Farm Fresh", "Baka Australian Friesian Sahiwal; genetik proprietari toleransi haba; sasaran 3,000 ekor menjelang November 2026"),
      srcRow("11", "MARDI — penyelidikan sains ternakan; laporan baka lembu Kedah-Kelantan (KK)", "Ciri ketahanan baka KK terhadap cuaca panas dan lembap serta penyakit"),
      srcRow("12", "PLANMalaysia — Garis Panduan Perancangan Ladang Penternakan Ayam (Edisi Ogos 2023)", "Peranan teknikal JPV dalam garis panduan perancangan ladang"),
      srcRow("13", "KPKM — kenyataan media Keterjaminan Makanan menerusi RMK13 2026–2030; portal RMK13", "Hala tuju keterjaminan makanan dan adaptasi pertanian pintar menjelang 2030"),
      srcRow("14", "KPKM dan Jabatan Pertanian — Skim Pensijilan myGAP Sektor Ternakan (dahulunya SALT, diperkenalkan 2003)", "Skop pensijilan amalan ladang ternakan"),
    ],
  }),
  spacer(200)
);

// 7.0 JURANG
body.push(h1("7.0  NOTA JURANG MAKLUMAT DAN PENGESAHAN DIPERLUKAN"));
body.push(p("7.1  Kertas ini disediakan berdasarkan dokumen dalaman JPV yang boleh dicapai, sumber perundangan, Penyata Rasmi Parlimen, perangkaan rasmi dan laporan media arus perdana. Perkara berikut hendaklah diberi perhatian sebelum jawapan dikeluarkan secara rasmi:"));
body.push(bullet("Sumber yang tidak dapat dicapai. Fail OneDrive jabatan dan laman Facebook rasmi Jabatan Perkhidmatan Veterinar tidak dapat dicapai semasa penyediaan kertas ini. Sekiranya terdapat kenyataan rasmi JPV di media sosial berhubung isu reban tertutup atau baka berdaya tahan iklim, kandungannya perlu disemak bagi memastikan keselarasan mesej."));
body.push(bullet("Angka SSR. Angka dalam jadual di perenggan 4.15 diambil daripada Penyata Rasmi Parlimen dan penerbitan DOSM. Angka SSR daging lembu dan kerbau merujuk tahun 2023, manakala angka susu segar dilaporkan dalam julat 62 hingga 66.8 peratus mengikut sumber dan tahun rujukan yang berbeza. Angka terkini hendaklah disahkan dengan Bahagian Perancangan Strategik dan Pengurusan Maklumat JPV sebelum dikeluarkan kepada media."));
body.push(bullet("Butiran dasar Negeri Perak. Butiran pelaksanaan terkini, termasuk bilangan ladang yang telah beralih kepada sistem tertutup dan pakej sokongan kewangan Negeri, hendaklah disahkan dengan Jabatan Perkhidmatan Veterinar Negeri Perak."));
body.push(bullet("Kelulusan. Kertas ini berstatus deraf dalaman. Kelulusan Ketua Pengarah Perkhidmatan Veterinar atau pegawai yang diberi kuasa hendaklah diperoleh sebelum sebarang jawapan dikeluarkan kepada pihak media."));

// ---------- himpun ----------
const doc = new Document({
  creator: "Jabatan Perkhidmatan Veterinar Malaysia",
  title: "Kertas Jawapan Media - Latihan Penternak dan Daya Tahan Iklim",
  description: "Jawapan kepada pertanyaan media berhubung latihan penternak menghadapi perubahan iklim",
  numbering: {
    config: [
      {
        reference: "dash-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "–",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 460, hanging: 240 } },
              run: { font: FONT, size: 21 },
            },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { line: 276 } } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1300, right: 1440, bottom: 1300, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 8 } },
              spacing: { before: 100 },
              children: [
                new TextRun({ text: "Kertas Jawapan Media — JPV Malaysia  |  Deraf Dalaman  |  Halaman ", font: FONT, size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
                new TextRun({ text: " daripada ", font: FONT, size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GREY }),
              ],
            }),
          ],
        }),
      },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2] || "output.docx", buf);
  console.log("written:", process.argv[2]);
});
