const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageNumber, Footer,
} = require("docx");
const fs = require("fs");

const GREEN = "1F5C3D";
const GREY = "595959";
const RED = "9C2B2B";
const CW = 9026; // content width in DXA (A4, 1440 margins)
const FONT = "Arial";

// ---------- helpers ----------
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

// Boxed callout: accent bar on the left
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

const qBlock = (qtext) => calloutBox("MEDIA QUESTION", qtext, GREEN, "F2F7F4");

const spacer = (after = 160) => new Paragraph({ spacing: { after }, children: [] });

// ---------- document body ----------
const body = [];

// Masthead
body.push(
  new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "DEPARTMENT OF VETERINARY SERVICES MALAYSIA", font: FONT, size: 24, bold: true, color: GREEN })],
  }),
  new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MINISTRY OF AGRICULTURE AND FOOD SECURITY", font: FONT, size: 20, bold: true, color: GREY })],
  }),
  new Paragraph({
    spacing: { after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Wisma Tani, Podium Block, Lot 4G1, Precinct 4, 62630 Putrajaya", font: FONT, size: 17, color: GREY })],
  }),
  rule()
);

body.push(
  new Paragraph({
    spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MEDIA RESPONSE PAPER", font: FONT, size: 22, bold: true, color: GREY })],
  }),
  new Paragraph({
    spacing: { after: 240 }, alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "FARMER TRAINING AND CLIMATE RESILIENCE IN MALAYSIA'S LIVESTOCK SECTOR",
        font: FONT, size: 28, bold: true, color: "000000",
      }),
    ],
  })
);

// Metadata table
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
      metaRow("Subject", "Media enquiry on farmer training for climate change adaptation"),
      metaRow("Date", "28 July 2026"),
      metaRow("Prepared by", "Ernie Muneerah Mohd Adhan, Department of Veterinary Services Malaysia"),
      metaRow("Scope", "Three (3) principal questions and two (2) supplementary questions"),
      metaRow("Status", "INTERNAL DRAFT — for review and clearance prior to release", RED),
    ],
  }),
  spacer()
);

// 1.0 PURPOSE
body.push(h1("1.0  PURPOSE"));
body.push(p("1.1  This paper is prepared to assist officers of the Department of Veterinary Services (DVS) in responding to media enquiries concerning farmer training, climate adaptation, and the development and deployment of climate-resilient livestock breeds in Malaysia."));
body.push(p("1.2  Responses are arranged in the sequence of the questions as received. Each response is supported by the sources listed in Section 6.0. Information gaps and matters requiring further verification are set out in Section 7.0."));

// 2.0 BACKGROUND
body.push(h1("2.0  BACKGROUND"));
body.push(p("2.1  Malaysia's livestock sector is increasingly exposed to climate-related risks that may affect animal health, productivity, feed availability and national food security. Rising temperatures and more frequent extreme-weather events can reduce feed intake, growth, reproductive performance, and meat, milk and egg production, while increasing disease and mortality risks."));
body.push(p("2.2  These pressures are compounded by Malaysia's dependence on imported feed ingredients, rising feed costs, and the relatively low self-sufficiency level for beef and buffalo meat."));
body.push(p("2.3  In response, DVS has strengthened disaster coordination, issued heat-stress management advisories, enhanced disease surveillance and farm biosecurity, and provided technical guidance through its nationwide extension network."));

// 3.0 CORRECTION
body.push(h1("3.0  CORRECTION TO THE PREMISE OF QUESTION 1"));
body.push(
  calloutBox(
    "NOTE TO OFFICERS",
    "The premise of Question 1 contains a factual error regarding jurisdiction. This should be corrected courteously before the substantive answer is given, so that DVS is not reported as the authority behind a mandate that was in fact issued by a State Government.",
    RED,
    "FBF3F3"
  ),
  spacer()
);

body.push(
  pr([
    ["3.1  Question 1 states that ", {}],
    ['"DVS has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak."', { italics: true }],
    [" This statement is ", {}],
    ["not accurate", { bold: true }],
    [" as a matter of fact or of jurisdiction.", {}],
  ])
);
body.push(
  pr([
    ["3.2  The closed-house requirement in Perak is a ", {}],
    ["policy of the Perak State Government", { bold: true }],
    [", not a federal directive or mandate issued by DVS. It was announced by the State Authority through the Perak State Executive Councillor for Rural Development, Plantations, Agriculture and Agro-based Industry, YB Datuk Mohd Zolkafly Harun. A transition period has been allowed until the end of 2026, with full enforcement commencing on 1 January 2027.", {}],
  ])
);
body.push(p("3.3  Constitutional position. Under the Ninth Schedule to the Federal Constitution, animal husbandry, prevention of cruelty to animals, veterinary services and animal quarantine fall within the Concurrent List (List III), being matters shared between the Federal and State Governments. Land, local government, and town and country planning, however, are State matters. Accordingly, a decision to mandate closed-house structures — which engages planning approval, premises licensing and local pollution control — lies within the competence of the State Government."));
body.push(p("3.4  The role of DVS in this matter is technical, animal-health regulatory and advisory in nature. This includes providing technical input to the poultry farm planning guidelines issued by PLANMalaysia, setting biosecurity standards, and certifying good livestock farm practices."));
body.push(p("3.5  Suggested wording for the correction when speaking to the media:", { bold: true }));
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
                    text: "“For clarification, the closed-house requirement in Perak is a policy of the Perak State Government and not a mandate of the Department of Veterinary Services. DVS provides technical support, biosecurity standards and veterinary advisory services in support of the State's implementation, consistent with the Concurrent List under the Federal Constitution.”",
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

// 4.0 RESPONSES
body.push(h1("4.0  RESPONSES TO MEDIA QUESTIONS"));

// --- Q1
body.push(h2("Question 1"));
body.push(
  qBlock(
    "In an interview with MARDI, it was mentioned that DVS has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak. How will the closed-house system be more sustainable than free-range, open farms?"
  )
);
body.push(spacer(140));

body.push(p("4.1  The correction set out in Section 3.0 should be stated before the substantive answer is given. Once that clarification is made, the following technical response may be offered."));
body.push(p("4.2  From a sustainability standpoint, the closed-house system offers the following advantages over open-house systems:"));
body.push(bullet("Micro-environment control and reduced heat stress. Closed houses allow temperature, humidity and ventilation rates to be regulated continuously. This reduces heat stress, which is a principal cause of depressed feed intake, stunted growth and elevated mortality during heat waves — precisely the risk expected to increase in frequency under climate change."));
body.push(bullet("Biosecurity and disease prevention. An enclosed structure limits contact between farmed poultry and wild birds, rodents and disease vectors. This lowers the risk of incursion by wild-bird-borne diseases such as avian influenza, and in turn reduces reliance on treatment and losses from outbreaks."));
body.push(bullet("Feed conversion efficiency. A stable environment yields a better feed conversion ratio (FCR). Given that a substantial share of national feed ingredients is imported, every gain in FCR reduces import dependence and lowers the carbon footprint per kilogramme of meat produced."));
body.push(bullet("Pollution and waste control. Closed systems allow manure to be collected, dried and managed under controlled conditions. This addresses the fly nuisance and odour complaints that are the principal source of public grievance against open-house poultry farms — and the stated basis for the Perak State Government's policy."));
body.push(bullet("Traceability and standards compliance. Closed-house farms are better placed to meet the requirements of myGAP certification for the livestock sector (formerly the Livestock Farm Practices Scheme, SALT), which covers animal health programmes, biosecurity, sanitation and farm waste management."));
body.push(p("4.3  In the interest of transparency, DVS also acknowledges the implementation constraints raised by industry: the high capital cost for smallholder farmers, dependence on a stable electricity supply, and the risk of sudden mortality should ventilation systems fail. These matters call for financing support and a phased transition, not enforcement alone.", { after: 200 }));

// --- Q1(a)
body.push(h2("Question 1(a)"));
body.push(qBlock("Will a similar approach be mandated for livestock?"));
body.push(spacer(140));

body.push(
  pr([
    ["4.4  At present there is ", {}],
    ["no federal mandate", { bold: true }],
    [" issued by DVS requiring closed housing for ruminant livestock. Any such decision would in any event engage the jurisdiction of the respective State Governments, as explained in paragraph 3.3.", {}],
  ])
);
body.push(p("4.5  Technically, the same approach cannot be transferred directly to ruminants. Ruminant production in Malaysia is largely pasture-based and integrated with oil palm plantations, with production cycles far longer than those of broiler chickens. Full confinement of ruminants would raise feed costs materially, since animals would no longer obtain grazed forage, and could compromise animal welfare if not carefully planned."));
body.push(p("4.6  The DVS approach for the ruminant sector is oriented towards incentives, certification and extension services — including myGAP certification, shade and cooling at housing areas, pasture management, improved water supply, and heat-stress management advisories — rather than a uniform structural mandate.", { after: 200 }));

// --- Q2
body.push(h2("Question 2"));
body.push(
  qBlock(
    "MARDI highlighted that while they lead the scientific research on climate-resilient livestock genetics, widespread field adoption relies heavily on coordination. How does DVS enable this and could you elaborate on the department's regulatory role in facilitating the deployment of climate-smart livestock breeds in Malaysia?"
  )
);
body.push(spacer(140));

body.push(p("4.7  The role of DVS may be divided into two principal functions: the regulatory function and the technology transfer function at farm level."));

body.push(p("(a)  Regulatory function", { bold: true }));
body.push(p("4.8  DVS is the competent authority regulating the entry, movement and use of animals and animal genetic material in Malaysia. The principal legal instruments are as follows:"));

body.push(
  new Table({
    columnWidths: [3200, CW - 3200],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Legal instrument", { w: 3200, bold: true, fill: "EDF3EF" }),
          tcell("Relevance to deployment of climate-resilient breeds", { w: CW - 3200, bold: true, fill: "EDF3EF" }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Animals Act 1953 [Act 647]", { w: 3200, bold: true }),
          tcell("Controls the import and export of live animals and genetic material such as semen and embryos. An import permit must be obtained from the Director General of Veterinary Services Malaysia or the State Director of Veterinary Services. The Act also governs livestock movement and disease control.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Malaysian Quarantine and Inspection Services Act 2011 [Act 728]", { w: 3200, bold: true }),
          tcell("Inspection and quarantine at national points of entry by MAQIS, including verification of veterinary health certificates for consignments of breeding animals and genetic material.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Import protocols and veterinary health certification", { w: 3200, bold: true }),
          tcell("Sets species- and country-specific health conditions, including disease testing and pre- and post-import quarantine periods.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Animal Welfare Act 2015 [Act 772]", { w: 3200, bold: true }),
          tcell("Ensures that the handling, transport and housing of imported breeding animals meet animal welfare standards.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Feed Act 2009 [Act 698]", { w: 3200, bold: true }),
          tcell("Governs the quality and safety of animal feed, which determines whether the genetic potential of a given breed can be realised in the field.", { w: CW - 3200 }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Veterinary Surgeons Act 1974 [Act 147]", { w: 3200, bold: true }),
          tcell("Regulates veterinary practice, including assisted reproduction procedures requiring registered veterinary expertise.", { w: CW - 3200 }),
        ],
      }),
    ],
  }),
  spacer(200)
);

body.push(p("(b)  Technology transfer and extension function", { bold: true }));
body.push(p("4.9  Scientific findings deliver impact only when translated at farm level. This function is carried out through the DVS network of Veterinary Extension Centres (VetEC) across Peninsular Malaysia. Network performance for the period 2021 to 2025 is as follows:"));

body.push(
  new Table({
    columnWidths: [5600, CW - 5600],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("VetEC performance indicator (2021–2025)", { w: 5600, bold: true, fill: "EDF3EF" }),
          tcell("Result", { w: CW - 5600, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({ children: [tcell("Workforce headcount", { w: 5600 }), tcell("95 → 96 (+1.05%)", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Interventions per farm visit", { w: 5600 }), tcell("3.71 → 5.99", { w: CW - 5600, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [tcell("Clinical treatments", { w: 5600 }), tcell("+113.5%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Regulatory audits", { w: 5600 }), tcell("+639.6%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Livestock handled for treatment", { w: 5600 }), tcell("+102.8%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Livestock handled for breeding", { w: 5600 }), tcell("+47.6%", { w: CW - 5600, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [tcell("Vaccination doses delivered (2025)", { w: 5600 }), tcell("107,581 doses", { w: CW - 5600, align: AlignmentType.CENTER, bold: true })] }),
    ],
  }),
  spacer()
);

body.push(p("4.10  These data show a pronounced decoupling of workforce size from service output: headcount remained essentially flat while service intensity per farm visit rose sharply. Growth was concentrated in beef cattle, meat goat and sheep enterprises, consistent with national ruminant self-sufficiency priorities. This is the mechanism by which research findings are actually taken up at scale in the field.", { after: 200 }));

// --- Q2(a)
body.push(h2("Question 2(a)"));
body.push(
  qBlock(
    "What are the other ways DVS collaborates with state research bodies (like MARDI) and corporate pioneers (like Farm Fresh and F&N) to streamline the import and distribution of climate-resilient genetic materials?"
  )
);
body.push(spacer(140));

body.push(p("4.11  A minor point of clarification: MARDI is a research agency under the Ministry of Agriculture and Food Security and is therefore a federal agency, not a state research body. This may be corrected briefly to avoid misreporting."));
body.push(p("4.12  Collaboration with MARDI. MARDI leads scientific research including the development of the Kedah-Kelantan (KK) cattle breed, which demonstrates resilience to hot and humid conditions and to disease, with a calving rate exceeding 90 per cent annually and mortality below two per cent, while maintaining productivity on moderate-quality feed. DVS supports this through animal health status verification, veterinary services for breeding programmes, and dissemination of research outcomes to farmers via the VetEC network."));
body.push(p("4.13  Collaboration with the corporate sector. Two recent examples illustrate the DVS role in facilitating the entry of climate-resilient genetic material:"));
body.push(bullet("F&N AgriValley, Negeri Sembilan. The arrival of the first commercial batch of 2,500 dairy cattle in April 2025 represented the largest single importation of breeding cattle ever undertaken by the country. DVS, together with MAQIS, carried out health certification, entry-point inspection and a two-week post-import quarantine at the farm."));
body.push(bullet("Farm Fresh. The company maintains the Australian Friesian Sahiwal breed, developed in Australia and well suited to hot and humid climates. It has also built in-house breeding capability with proprietary dairy genetics focused on heat tolerance, disease resilience and productivity. Its import target has been raised to 3,000 head by November 2026."));
body.push(p("4.14  In both cases, the DVS contribution is to ensure that imported genetic material meets national biosecurity standards without delaying industry investment — that is, balancing the regulatory role with the facilitation role.", { after: 200 }));

// --- Q3
body.push(h2("Question 3"));
body.push(
  qBlock(
    "Looking toward 2030, how critical is this shift toward biological resilience and genetic climate adaptation to safeguarding Malaysia's self-sufficiency levels for livestock and poultry?"
  )
);
body.push(spacer(140));

body.push(p("4.15  The current self-sufficiency ratio (SSR) position for the livestock subsector is as follows:"));

body.push(
  new Table({
    columnWidths: [4000, 2300, CW - 6300],
    width: { size: CW, type: WidthType.DXA },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcell("Commodity", { w: 4000, bold: true, fill: "EDF3EF" }),
          tcell("Current SSR", { w: 2300, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
          tcell("NAP 2021–2030 target", { w: CW - 6300, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Beef and buffalo meat", { w: 4000 }),
          tcell("15.9% (2023)", { w: 2300, align: AlignmentType.CENTER, bold: true, color: RED }),
          tcell("50%", { w: CW - 6300, align: AlignmentType.CENTER, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Goat and sheep meat", { w: 4000 }),
          tcell("10.6%", { w: 2300, align: AlignmentType.CENTER, bold: true, color: RED }),
          tcell("30%", { w: CW - 6300, align: AlignmentType.CENTER, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Chicken meat", { w: 4000 }),
          tcell("92.9%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Maintain near full self-sufficiency", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Duck meat", { w: 4000 }),
          tcell("129.9%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Above full self-sufficiency since 2020", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Chicken and duck eggs", { w: 4000 }),
          tcell("107.0%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Above full self-sufficiency since 2020", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          tcell("Fresh milk", { w: 4000 }),
          tcell("62% – 66.8%", { w: 2300, align: AlignmentType.CENTER }),
          tcell("Expansion through dairy valleys", { w: CW - 6300, align: AlignmentType.CENTER }),
        ],
      }),
    ],
  }),
  spacer()
);

body.push(
  pr([
    ["4.16  The gap between the current position and the target is wide, particularly for beef and buffalo meat — from 15.9 per cent against a target of 50 per cent by 2030. The shift towards biological resilience and genetic climate adaptation is therefore ", {}],
    ["critical", { bold: true }],
    [", though it is not sufficient on its own.", {}],
  ])
);
body.push(p("4.17  Climate-resilient genetics contributes in three ways: it reduces productivity losses from heat stress; it lowers mortality and treatment costs; and it shortens calving intervals, thereby accelerating growth of the base breeding population. All three directly support efforts to raise the SSR."));
body.push(p("4.18  Genetic potential can only be realised, however, when matched with secure feed supplies, effective biosecurity and disease surveillance, early-warning systems for extreme weather, and sustained extension and farmer training. Even the best genetics will fall short of its potential if feed supply is disrupted or disease outbreaks go uncontrolled."));
body.push(p("4.19  This effort is supported by the Pengganda 30 Programme, an integrated intervention between companies, farmers and agencies to expand the base population of meat ruminants, and by the food security direction under the Thirteenth Malaysia Plan (13MP) 2026–2030, which emphasises technology transfer, smart agriculture adaptation and strengthening of the agrofood value chain."));
body.push(p("4.20  In conclusion, DVS considers biological resilience to be a central pillar of the national food security agenda towards 2030, to be pursued as part of an integrated approach encompassing climate-smart farming practices, strengthened surveillance systems, more secure feed supplies, and sustained collaboration among government agencies, industry and livestock producers.", { after: 200 }));

// 5.0 KEY POINTS
body.push(h1("5.0  SUMMARY OF KEY POINTS"));
body.push(p("5.1  The following points may serve as a quick reference during engagement with the media:"));
body.push(bullet("The closed-house requirement in Perak is a Perak State Government policy, not a DVS mandate. Full enforcement begins on 1 January 2027."));
body.push(bullet("Animal husbandry and veterinary services sit on the Concurrent List of the Federal Constitution; land and local planning are State matters."));
body.push(bullet("Closed-house systems are more sustainable through heat-stress control, biosecurity, feed efficiency and waste management — but capital cost remains a genuine constraint for smallholders."));
body.push(bullet("There is no federal mandate for closed housing of ruminants. The approach is based on incentives, certification and extension services."));
body.push(bullet("The DVS regulatory role rests on the Animals Act 1953 [Act 647] for animal and genetic material import permits, supported by Acts 728, 772, 698 and 147."));
body.push(bullet("The VetEC network is the technology transfer mechanism: interventions per farm visit rose from 3.71 to 5.99 between 2021 and 2025, with 107,581 vaccination doses delivered in 2025."));
body.push(bullet("Beef and buffalo meat SSR stands at 15.9 per cent against a 50 per cent target by 2030. Climate-resilient genetics is critical, but must be matched with feed security, biosecurity and farmer training."));

// 6.0 SOURCES
body.push(h1("6.0  SOURCES"));

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
          tcell("No.", { w: 700, bold: true, fill: "EDF3EF", align: AlignmentType.CENTER }),
          tcell("Source", { w: 3600, bold: true, fill: "EDF3EF" }),
          tcell("Information drawn", { w: CW - 4300, bold: true, fill: "EDF3EF" }),
        ],
      }),
      srcRow("1", "DVS internal document — GAVIS 2026 abstract, “Climate Resilience in Malaysia's Livestock Sector” (Mohd Noor Hisham Mohd Haron, Zulkifli Ishak, Ernie Muneerah Mohd Adhan, Salleh Sheikh Ibrahim)", "Background on climate vulnerability of the livestock sector and the DVS strategic response (Section 2.0)"),
      srcRow("2", "DVS internal document — GAVIS 2026 poster, “Veterinary Extension as a Pillar of Livestock Industry Development: DVS VetEC 2021–2025”", "All VetEC performance figures in Response 2"),
      srcRow("3", "Sinar Harian and MG Perak — announcement by Perak State Exco, YB Datuk Mohd Zolkafly Harun", "Confirmation that the closed-house mandate is Perak State Government policy; enforcement date of 1 January 2027"),
      srcRow("4", "New Straits Times — “All poultry farms in Perak to adopt closed-house system by 2027”", "Farm statistics and transition timeline"),
      srcRow("5", "Federal Constitution, Ninth Schedule", "Position of animal husbandry, veterinary services and animal quarantine on the Concurrent List"),
      srcRow("6", "Animals Act 1953 [Act 647]; Malaysian Quarantine and Inspection Services Act 2011 [Act 728]; Animal Welfare Act 2015 [Act 772]; Feed Act 2009 [Act 698]; Veterinary Surgeons Act 1974 [Act 147]", "Regulatory framework set out in Response 2"),
      srcRow("7", "Hansard (Official Report of Parliamentary Debates), Third Meeting, Fourth Session, Fifteenth Parliament, 1 December 2025", "Beef and buffalo meat SSR of 15.9%; goat and sheep 10.6%; targets of 50% and 30% under NAP 2021–2030; Pengganda 30 Programme"),
      srcRow("8", "Department of Statistics Malaysia (DOSM) — Supply and Utilisation Accounts for Selected Agricultural Commodities, 2020–2024", "SSR for chicken meat, duck meat, eggs and fresh milk"),
      srcRow("9", "Fraser & Neave and BERNAMA — F&N AgriValley", "Arrival of 2,500 dairy cattle, April 2025; role of DVS and MAQIS in post-import quarantine"),
      srcRow("10", "Business Today and Forbes — Farm Fresh", "Australian Friesian Sahiwal breed; proprietary heat-tolerant genetics; target of 3,000 head by November 2026"),
      srcRow("11", "MARDI — livestock science research; reports on the Kedah-Kelantan (KK) cattle breed", "Resilience characteristics of the KK breed to hot and humid conditions and to disease"),
      srcRow("12", "PLANMalaysia — Planning Guidelines for Poultry Farms (August 2023 edition)", "Technical role of DVS in farm planning guidelines"),
      srcRow("13", "KPKM — media statement on Food Security under 13MP 2026–2030; RMK13 portal", "Food security direction and smart agriculture adaptation towards 2030"),
      srcRow("14", "KPKM and Department of Agriculture — myGAP certification scheme for the livestock sector (formerly SALT, introduced 2003)", "Scope of good livestock farm practice certification"),
    ],
  }),
  spacer(200)
);

// 7.0 GAPS
body.push(h1("7.0  INFORMATION GAPS AND VERIFICATION REQUIRED"));
body.push(p("7.1  This paper draws on accessible DVS internal documents, legal sources, the Official Report of Parliamentary Debates, official statistics and mainstream media reporting. The following should be noted before any response is issued officially:"));
body.push(bullet("Sources not accessible. Departmental OneDrive files and the official Department of Veterinary Services Facebook page could not be accessed during preparation of this paper. Should DVS have issued statements on social media regarding the closed-house issue or climate-resilient breeds, their content should be reviewed to ensure consistency of messaging."));
body.push(bullet("SSR figures. The figures in the table at paragraph 4.15 are drawn from the Official Report of Parliamentary Debates and DOSM publications. The beef and buffalo meat SSR refers to 2023, while fresh milk is reported in a range of 62 to 66.8 per cent depending on the source and reference year. Current figures should be confirmed with the DVS Strategic Planning and Information Management Division before release to the media."));
body.push(bullet("Perak State policy details. Current implementation details, including the number of farms that have converted to closed-house systems and the State's financial support package, should be confirmed with the Perak State Department of Veterinary Services."));
body.push(bullet("Clearance. This paper is an internal draft. Clearance from the Director General of Veterinary Services or an authorised officer should be obtained before any response is issued to the media."));

// ---------- assemble ----------
const doc = new Document({
  creator: "Department of Veterinary Services Malaysia",
  title: "Media Response Paper - Farmer Training and Climate Resilience",
  description: "Response to media enquiries on farmer training for climate change adaptation",
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
                new TextRun({ text: "Media Response Paper — DVS Malaysia  |  Internal Draft  |  Page ", font: FONT, size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
                new TextRun({ text: " of ", font: FONT, size: 16, color: GREY }),
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
