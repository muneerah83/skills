const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageNumber, Footer,
} = require("docx");
const fs = require("fs");

const NAVY = "000078", DEEP = "00005A", GREEN = "00C600", NATG = "4EA506";
const CHAR = "333333", RED = "9C2B2B", GREY = "595959";
const CW = 9026, F = "Calibri";

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 110, line: o.line ?? 268 },
  alignment: o.align, indent: o.indent, keepNext: o.keepNext,
  children: [new TextRun({ text: t, font: F, size: o.size ?? 21, bold: o.bold, italics: o.italics, color: o.color ?? CHAR })],
});

const pr = (runs, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 110, line: o.line ?? 268 },
  alignment: o.align, indent: o.indent, keepNext: o.keepNext,
  children: runs.map(([t, x = {}]) => new TextRun({
    text: t, font: F, size: x.size ?? o.size ?? 21, bold: x.bold, italics: x.italics, color: x.color ?? CHAR })),
});

const H = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 },
  keepNext: true, keepLines: true,
  children: [new TextRun({ text: t, font: F, size: 25, bold: true, color: NAVY })],
});

const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 230, after: 120 },
  keepNext: true, keepLines: true,
  children: [new TextRun({ text: t, font: F, size: 22, bold: true, color: DEEP })],
});

const bullet = (runs) => new Paragraph({
  numbering: { reference: "dot", level: 0 }, spacing: { after: 85, line: 268 },
  children: runs.map(([t, x = {}]) => new TextRun({ text: t, font: F, size: 21, bold: x.bold, italics: x.italics, color: x.color ?? CHAR })),
});

const cell = (children, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 }, children,
});

const tc = (t, o = {}) => cell([new Paragraph({
  spacing: { after: 0, line: 252 }, alignment: o.align,
  children: [new TextRun({ text: t, font: F, size: o.size ?? 19, bold: o.bold, color: o.color ?? CHAR })],
})], o);

const B = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
};

const cap = (n, d) => new Paragraph({
  spacing: { before: 70, after: 190 },
  children: [
    new TextRun({ text: `Table ${n}. `, font: F, size: 18, bold: true, color: CHAR }),
    new TextRun({ text: d, font: F, size: 18, italics: true, color: GREY }),
  ],
});

const eqBar = (t) => new Table({
  columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    left: { style: BorderStyle.SINGLE, size: 24, color: GREEN },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({ cantSplit: true, children: [cell([new Paragraph({
    spacing: { after: 0, line: 264 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: t, font: F, size: 23, bold: true, color: NAVY })],
  })], { w: CW, fill: "EFEFF7" })] })],
});

const qBox = (label, q) => new Table({
  columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NATG },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NATG },
    left: { style: BorderStyle.SINGLE, size: 20, color: NATG },
    right: { style: BorderStyle.SINGLE, size: 4, color: NATG },
    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({ cantSplit: true, children: [cell([
    new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: label, font: F, size: 18, bold: true, color: NATG })] }),
    new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: q, font: F, size: 19, italics: true, color: "1A1A1A" })] }),
  ], { w: CW, fill: "F1F7EC" })] })],
});

const quoteBox = (label, t) => new Table({
  columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: DEEP },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: DEEP },
    left: { style: BorderStyle.SINGLE, size: 20, color: DEEP },
    right: { style: BorderStyle.SINGLE, size: 4, color: DEEP },
    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({ cantSplit: true, children: [cell([
    new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: label, font: F, size: 18, bold: true, color: DEEP })] }),
    new Paragraph({ spacing: { after: 0, line: 264 }, children: [new TextRun({ text: t, font: F, size: 21, italics: true, color: "1A1A1A" })] }),
  ], { w: CW, fill: "EFEFF7" })] })],
});

const sp = (a = 150) => new Paragraph({ spacing: { after: a }, children: [] });
const body = [];

// ── LETTERHEAD ──
body.push(
  new Paragraph({ spacing: { after: 35 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "DEPARTMENT OF VETERINARY SERVICES MALAYSIA", font: F, size: 24, bold: true, color: NAVY })] }),
  new Paragraph({ spacing: { after: 35 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "MINISTRY OF AGRICULTURE AND FOOD SECURITY", font: F, size: 19, bold: true, color: DEEP })] }),
  new Paragraph({ spacing: { after: 150 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Livestock Industry Development Division  ·  Wisma Tani, Precinct 4, 62630 Putrajaya", font: F, size: 16, color: GREY })] }),
  new Paragraph({ spacing: { before: 40, after: 170 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: GREEN, space: 1 } },
    children: [new TextRun({ text: "", font: F, size: 2 })] }),
  new Paragraph({ spacing: { after: 55 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "PROPOSED RESPONSES TO MEDIA ENQUIRY", font: F, size: 21, bold: true, color: GREY })] }),
  new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "FARMER TRAINING FOR CLIMATE CHANGE — THE EDGE (ESG)", font: F, size: 27, bold: true, color: NAVY })] }),
);

const mr = (k, v, c) => new TableRow({ cantSplit: true, children: [tc(k, { w: 2100, bold: true, fill: "F4F4F4" }), tc(v, { w: CW - 2100, color: c })] });
body.push(new Table({
  columnWidths: [2100, CW - 2100], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    mr("To", "Dairy Unit, Livestock Industry Development Division"),
    mr("From", "Ruminant Section, Livestock Industry Development Division"),
    mr("Date", "28 July 2026"),
    mr("Enquiry", "The Edge — ESG desk (English-medium). Five questions received by e-mail"),
    mr("Status", "PROPOSED RESPONSES — for review and clearance before transmission", RED),
  ],
}), sp());

// ── 1.0 PURPOSE ──
body.push(H("1.0  PURPOSE"));
body.push(p("1.1  This paper supplies the Ruminant Section's proposed responses to five questions received from The Edge (ESG desk) concerning the Department's role in farmer training for climate change adaptation. It is prepared for collation by the Dairy Unit and onward transmission."));
body.push(p("1.2  Responses follow the sequence in which the questions were received. Each is supported by the sources listed at 6.3. Coverage gaps and figures requiring confirmation are recorded at 6.2, and required actions at 5.0."));
body.push(p("1.3  The paper is written in English throughout because The Edge publishes in English. Supplying responses that the outlet must translate would cede control of the Department's exact wording on positions it will be quoted on."));

// ── 2.0 PREMISE ──
body.push(H("2.0  NOTE ON THE PREMISE OF QUESTION 1"));
body.push(p("2.1  Question 1 states that the Department has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak. This statement is not accurate as a matter of fact or of jurisdiction, and should be corrected before the substantive answer is given.", { bold: false }));
body.push(pr([
  ["2.2  The closed-house requirement in Perak is a ", {}],
  ["policy of the Perak State Government", { bold: true }],
  [". It was announced by the State Authority through the State Executive Councillor for Rural Development, Plantations, Agriculture and Agro-based Industry. A transition period runs to the end of 2026, with full enforcement from 1 January 2027 (Reference: Sinar Harian and MG Perak, 2026).", {}],
]));
body.push(p("2.3  Under the Ninth Schedule to the Federal Constitution, animal husbandry, veterinary services and animal quarantine fall within the Concurrent List (List III), while land, local government, and town and country planning are State matters. A decision to mandate closed-house structures engages planning approval, premises licensing and local pollution control, and therefore lies within the competence of the State Government. Table 1 sets out the division."));

const vr = (a, d, s) => new TableRow({ children: [tc(a, { w: 3400 }), tc(d, { w: 2700 }), tc(s, { w: CW - 6100 })] });
body.push(new Table({
  columnWidths: [3400, 2700, CW - 6100], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Power", { w: 3400, bold: true, fill: "EAF3EA" }),
      tc("DVS (Federal)", { w: 2700, bold: true, fill: "EAF3EA" }),
      tc("Perak State Government", { w: CW - 6100, bold: true, fill: "EAF3EA" }),
    ] }),
    vr("Issuing the closed-house requirement", "✗  No", "✓  Yes"),
    vr("Land and local planning control", "✗  No", "✓  Yes"),
    vr("Licensing of livestock premises", "✗  No", "✓  Yes"),
    vr("Setting biosecurity and animal health standards", "✓  Yes", "✗  No"),
    vr("Regulating import of animals and genetic material", "✓  Yes", "✗  No"),
    vr("Farm practice certification (myGAP)", "✓  Yes", "✗  No"),
    vr("Technical input to farm planning guidelines", "✓  Yes", "✓  Yes"),
  ],
}));
body.push(cap(1, "Division of powers between DVS and the Perak State Government on closed-house systems."));

body.push(eqBar("CLOSED-HOUSE REQUIREMENT  ≠  DVS MANDATE"), sp(150));
body.push(quoteBox("2.4  SENTENCE THE DAIRY UNIT MAY QUOTE VERBATIM",
  "“For clarification, the closed-house requirement in Perak is a policy of the Perak State Government and not a mandate of the Department of Veterinary Services. DVS provides technical support, biosecurity standards and veterinary advisory services in support of the State's implementation, consistent with the Concurrent List under the Federal Constitution.”"), sp());

// ── 3.0 RESPONSES ──
body.push(H("3.0  RESPONSES"));

body.push(H2("3.1  Question 1"));
body.push(qBox("AS RECEIVED", "In an interview with MARDI, it was mentioned that DVS has mandated a phased implementation of closed-house systems for poultry farms, starting in Perak. How will the closed-house system be more sustainable than free-range, open farms?"));
body.push(sp(130));
body.push(p("3.1.1  The correction at 2.0 should be stated first. The substantive answer follows."));
body.push(p("3.1.2  Scale is the context the outlet will want. Table 2 sets out the distribution of poultry farms in Perak."));
body.push(new Table({
  columnWidths: [4200, 1900, CW - 6100], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Housing system", { w: 4200, bold: true, fill: "EAF3EA" }),
      tc("Farms", { w: 1900, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Share", { w: CW - 6100, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    new TableRow({ children: [tc("Closed house", { w: 4200 }), tc("169", { w: 1900, align: AlignmentType.CENTER }), tc("24.9%", { w: CW - 6100, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [tc("Open house", { w: 4200 }), tc("480", { w: 1900, align: AlignmentType.CENTER, bold: true, color: RED }), tc("70.8%", { w: CW - 6100, align: AlignmentType.CENTER, bold: true, color: RED })] }),
    new TableRow({ children: [tc("Combined closed and open", { w: 4200 }), tc("29", { w: 1900, align: AlignmentType.CENTER }), tc("4.3%", { w: CW - 6100, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [tc("TOTAL", { w: 4200, bold: true }), tc("678", { w: 1900, align: AlignmentType.CENTER, bold: true }), tc("100.0%", { w: CW - 6100, align: AlignmentType.CENTER, bold: true })] }),
  ],
}));
body.push(cap(2, "Poultry farms in Perak by housing system (Reference: New Straits Times, 2026)."));
body.push(p("3.1.3  From a sustainability standpoint, the closed-house system offers the following advantages over open-house systems:"));
body.push(bullet([["Micro-environment control and reduced heat stress. ", { bold: true }], ["Temperature, humidity and ventilation rates are regulated continuously. This reduces heat stress, a principal cause of depressed feed intake, stunted growth and elevated mortality during heat waves — precisely the risk expected to increase in frequency under climate change.", {}]]));
body.push(bullet([["Biosecurity and disease prevention. ", { bold: true }], ["An enclosed structure limits contact between farmed poultry and wild birds, rodents and disease vectors, lowering the risk of incursion by wild-bird-borne diseases such as avian influenza and reducing reliance on treatment.", {}]]));
body.push(bullet([["Feed conversion efficiency. ", { bold: true }], ["A stable environment yields a better feed conversion ratio. Given that a substantial share of national feed ingredients is imported, every gain in efficiency reduces import dependence and lowers the carbon footprint per kilogramme of meat produced.", {}]]));
body.push(bullet([["Pollution and waste control. ", { bold: true }], ["Manure is collected, dried and managed under controlled conditions, addressing the fly nuisance and odour complaints that are the principal source of public grievance against open-house farms and the stated basis for the State's policy.", {}]]));
body.push(bullet([["Traceability and standards compliance. ", { bold: true }], ["Closed-house farms are better placed to meet myGAP certification for the livestock sector, formerly the Livestock Farm Practices Scheme (SALT), introduced in 2003.", {}]]));
body.push(pr([["3.1.4  Conversely, ", { bold: true }], ["480 farms, or 70.8 per cent of the 678 in Perak, still operate open-house and must convert within the remaining transition period. In the interest of transparency, the Department acknowledges the constraints industry has raised: high capital cost for smallholders, dependence on a stable electricity supply, and the risk of sudden mortality should ventilation fail. These call for financing support and a phased transition, not enforcement alone.", {}]], { after: 180 }));

body.push(H2("3.2  Question 1(a)"));
body.push(qBox("AS RECEIVED", "Will a similar approach be mandated for livestock?"));
body.push(sp(130));
body.push(pr([["3.2.1  There is at present ", {}], ["no federal mandate", { bold: true }], [" requiring closed housing for ruminant livestock. Any such decision would in any event engage the jurisdiction of the respective State Governments, for the reasons at 2.3.", {}]]));
body.push(p("3.2.2  Technically, the approach does not transfer directly. Ruminant production in Malaysia is largely pasture-based and integrated with oil palm plantations, with production cycles far longer than those of broiler chickens. Full confinement would raise feed costs materially, since animals would no longer obtain grazed forage, and could compromise welfare if not carefully planned."));
body.push(p("3.2.3  The Department's approach for the ruminant sector is therefore built on incentives, certification and extension — myGAP certification, shade and cooling at housing areas, pasture management, improved water supply, and heat-stress advisories — rather than a uniform structural mandate.", { after: 180 }));

body.push(H2("3.3  Question 2"));
body.push(qBox("AS RECEIVED", "MARDI highlighted that while they lead the scientific research on climate-resilient livestock genetics, widespread field adoption relies heavily on coordination. How does DVS enable this and could you elaborate on the department's regulatory role in facilitating the deployment of climate-smart livestock breeds in Malaysia?"));
body.push(sp(130));
body.push(p("3.3.1  The Department's role has two parts: a regulatory function, and a technology transfer function at farm level."));
body.push(p("3.3.2  Regulatory function. DVS is the competent authority regulating the entry, movement and use of animals and animal genetic material in Malaysia. Table 3 lists the principal instruments."));
const lr = (a, b) => new TableRow({ children: [tc(a, { w: 3300, bold: true }), tc(b, { w: CW - 3300 })] });
body.push(new Table({
  columnWidths: [3300, CW - 3300], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Legal instrument", { w: 3300, bold: true, fill: "EAF3EA" }),
      tc("Relevance to deployment of climate-resilient breeds", { w: CW - 3300, bold: true, fill: "EAF3EA" }),
    ] }),
    lr("Animals Act 1953 [Act 647]", "Controls the import and export of live animals and genetic material such as semen and embryos. An import permit must be obtained from the Director General of Veterinary Services Malaysia or the State Director of Veterinary Services. The Act also governs livestock movement and disease control."),
    lr("Malaysian Quarantine and Inspection Services Act 2011 [Act 728]", "Inspection and quarantine at national points of entry by MAQIS, including verification of veterinary health certificates for consignments of breeding animals and genetic material."),
    lr("Import protocols and veterinary health certification", "Sets species- and country-specific health conditions, including disease testing and pre- and post-import quarantine periods."),
    lr("Animal Welfare Act 2015 [Act 772]", "Ensures that the handling, transport and housing of imported breeding animals meet animal welfare standards."),
    lr("Feed Act 2009 [Act 698]", "Governs the quality and safety of animal feed, which determines whether the genetic potential of a given breed can be realised in the field."),
    lr("Veterinary Surgeons Act 1974 [Act 147]", "Regulates veterinary practice, including assisted reproduction procedures requiring registered veterinary expertise."),
  ],
}));
body.push(cap(3, "Legal instruments governing the entry and use of animal genetic material."));
body.push(p("3.3.3  Technology transfer function. Research findings deliver impact only when translated at farm level. This is carried out through the network of Veterinary Extension Centres (VetEC) across Peninsular Malaysia. Table 4 sets out network performance for 2021 to 2025."));
const vv = (a, b, bold) => new TableRow({ children: [tc(a, { w: 5500 }), tc(b, { w: CW - 5500, align: AlignmentType.CENTER, bold })] });
body.push(new Table({
  columnWidths: [5500, CW - 5500], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("VetEC performance indicator", { w: 5500, bold: true, fill: "EAF3EA" }),
      tc("2021 → 2025", { w: CW - 5500, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    vv("Workforce headcount", "95 → 96  (+1.05%)"),
    vv("Interventions per farm visit", "3.71 → 5.99  (+61.46%)", true),
    vv("Clinical treatments", "+113.5%"),
    vv("Regulatory audits", "+639.6%"),
    vv("Livestock handled for treatment", "+102.8%"),
    vv("Livestock handled for breeding", "+47.6%"),
    vv("Vaccination doses delivered (2025)", "107,581 doses", true),
  ],
}));
body.push(cap(4, "VetEC network performance, Peninsular Malaysia, 2021–2025 (Reference: DVS GAVIS 2026 poster)."));
body.push(p("3.3.4  In other words, headcount remained essentially flat at +1.05 per cent while service intensity per farm visit rose 61.46 per cent. Growth concentrated in beef cattle, meat goat and sheep enterprises, consistent with national ruminant self-sufficiency priorities. This is the mechanism by which research findings are taken up at scale.", { after: 180 }));

body.push(H2("3.4  Question 2(a)"));
body.push(qBox("AS RECEIVED", "What are the other ways DVS collaborates with state research bodies (like MARDI) and corporate pioneers (like Farm Fresh and F&N) to streamline the import and distribution of climate-resilient genetic materials?"));
body.push(sp(130));
body.push(p("3.4.1  A minor point of clarification: MARDI is a research agency under the Ministry of Agriculture and Food Security and is therefore a federal agency, not a state research body. This may be corrected briefly to avoid misreporting."));
body.push(p("3.4.2  Collaboration with MARDI. MARDI leads scientific research including development of the Kedah-Kelantan (KK) cattle breed, which demonstrates resilience to hot and humid conditions and to disease, with a calving rate above 90 per cent annually and mortality below 2 per cent. DVS supports this through animal health status verification, veterinary services for breeding programmes, and dissemination of outcomes to farmers via the VetEC network."));
body.push(p("3.4.3  Collaboration with the corporate sector:"));
body.push(bullet([["F&N AgriValley, Negeri Sembilan. ", { bold: true }], ["The first commercial batch of 2,500 dairy cattle arrived in April 2025, the largest single importation of breeding cattle undertaken by the country. DVS, with MAQIS, carried out health certification, entry-point inspection and a two-week post-import quarantine at the farm.", {}]]));
body.push(bullet([["Farm Fresh. ", { bold: true }], ["One of the companies under Large-Scale Entrepreneur Transformation since the Twelfth Malaysia Plan, in which DVS facilitated the entry of breeding stock. The company maintains the Australian Friesian Sahiwal breed, suited to hot and humid climates, and has built in-house breeding capability with proprietary dairy genetics focused on heat tolerance and disease resilience. Its import target has been raised to 3,000 head by November 2026.", {}]]));
body.push(p("3.4.4  In both cases the Department's contribution is to ensure imported genetic material meets national biosecurity standards without delaying industry investment — balancing the regulatory role against the facilitation role.", { after: 180 }));

body.push(H2("3.5  Question 3"));
body.push(qBox("AS RECEIVED", "Looking toward 2030, how critical is this shift toward biological resilience and genetic climate adaptation to safeguarding Malaysia's self-sufficiency levels for livestock and poultry?"));
body.push(sp(130));
body.push(p("3.5.1  Table 5 sets out the current self-sufficiency ratio (SSR) position against National Agrofood Policy 2021–2030 targets."));
const sr = (k, a, b, c, col) => new TableRow({ children: [
  tc(k, { w: 3300 }), tc(a, { w: 1750, align: AlignmentType.CENTER, bold: !!col, color: col }),
  tc(b, { w: 1750, align: AlignmentType.CENTER }), tc(c, { w: CW - 6800, align: AlignmentType.CENTER })] });
body.push(new Table({
  columnWidths: [3300, 1750, 1750, CW - 6800], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("Commodity", { w: 3300, bold: true, fill: "EAF3EA" }),
      tc("Current SSR", { w: 1750, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("2030 target", { w: 1750, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Gap", { w: CW - 6800, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    sr("Beef and buffalo meat", "15.9%", "50%", "34.1 points", RED),
    sr("Goat and sheep meat", "10.6%", "30%", "19.4 points", RED),
    sr("Chicken meat", "92.9%", "Maintain", "—"),
    sr("Duck meat", "129.9%", "Maintain", "—"),
    sr("Chicken and duck eggs", "107.0%", "Maintain", "—"),
    sr("Fresh milk", "66.8%", "Continue raising", "—"),
  ],
}));
body.push(cap(5, "SSR for the livestock subsector (2023 basis) against National Agrofood Policy 2021–2030 targets (Reference: Hansard, 1 December 2025; DOSM, 2020–2024)."));
body.push(pr([
  ["3.5.2  The gap for beef and buffalo meat is 34.1 percentage points, requiring SSR to rise ", {}],
  ["3.14 times", { bold: true }],
  [" from 15.9 per cent to 50 per cent by 2030. For goat and sheep meat the gap is 19.4 points, a 2.83-times increase. Conversely, duck meat at 129.9 per cent and eggs at 107.0 per cent have remained above full self-sufficiency since 2020.", {}],
]));
body.push(p("3.5.3  Against that gap, the shift toward biological resilience and genetic climate adaptation is critical, though not sufficient on its own. Climate-resilient genetics contributes in three ways: it reduces productivity losses from heat stress, it lowers mortality and treatment costs, and it shortens calving intervals, thereby accelerating growth of the base breeding population."));
body.push(p("3.5.4  Nevertheless, genetic potential is realised only when matched with secure feed supplies, effective biosecurity and disease surveillance, early-warning systems for extreme weather, and sustained extension and farmer training. Even the best genetics will fall short of its potential if feed supply is disrupted or disease outbreaks go uncontrolled.", { after: 180 }));

// ── 4.0 SUMMARY POSITION ──
body.push(H("4.0  SUMMARY POSITION"));
body.push(eqBar("CLIMATE-RESILIENT GENETICS  =  A COMPLEMENT,  NOT A SUBSTITUTE"), sp(150));
body.push(new Table({
  columnWidths: [CW / 2, CW / 2], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [new TableRow({ children: [
    cell([
      new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: "✓  IT CONTRIBUTES TO", font: F, size: 19, bold: true, color: NATG })] }),
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: "Reduced productivity loss from heat stress · lower mortality and treatment cost · shorter calving intervals · faster growth of the base ruminant breeding population", font: F, size: 19, color: CHAR })] }),
    ], { w: CW / 2, fill: "F1F7EC" }),
    cell([
      new Paragraph({ spacing: { after: 55 }, children: [new TextRun({ text: "✗  IT DOES NOT REPLACE", font: F, size: 19, bold: true, color: RED })] }),
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: "The need for secure feed supply · biosecurity and disease surveillance · early-warning systems for extreme weather · extension services and farmer training", font: F, size: 19, color: CHAR })] }),
    ], { w: CW / 2, fill: "FAF2F2" }),
  ] })],
}), sp(150));
body.push(p("4.1  In conclusion, the Department considers biological resilience to be a central pillar of the national food security agenda towards 2030, to be pursued as part of an integrated approach encompassing climate-smart farming practices, strengthened surveillance, more secure feed supplies, and sustained collaboration among government agencies, industry and livestock producers. This is supported by the Pengganda 30 Programme and by the food security direction under the Thirteenth Malaysia Plan 2026–2030."));

// ── 5.0 ACTIONS ──
body.push(H("5.0  ACTIONS"));
const ar = (n, t, o, d) => new TableRow({ children: [
  tc(n, { w: 620, align: AlignmentType.CENTER, bold: true }), tc(t, { w: 4400 }),
  tc(o, { w: 2350, }), tc(d, { w: CW - 7370, align: AlignmentType.CENTER })] });
body.push(new Table({
  columnWidths: [620, 4400, 2350, CW - 7370], width: { size: CW, type: WidthType.DXA }, borders: B,
  rows: [
    new TableRow({ tableHeader: true, children: [
      tc("No.", { w: 620, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
      tc("Action", { w: 4400, bold: true, fill: "EAF3EA" }),
      tc("Responsibility", { w: 2350, bold: true, fill: "EAF3EA" }),
      tc("By", { w: CW - 7370, bold: true, fill: "EAF3EA", align: AlignmentType.CENTER }),
    ] }),
    ar("1", "Confirm the SSR figures for all six commodities at Table 5 against the current DOSM series, and confirm the reference year of each", "Strategic Planning and Information Management Division, DVS", "4 August 2026"),
    ar("2", "Review DVS statements on the departmental website and social media concerning closed-house systems and climate-resilient breeds, and report any inconsistency of message", "Corporate Communications Unit, DVS", "4 August 2026"),
    ar("3", "Confirm Perak implementation detail, including the number of farms converted and the State's financial support package", "DVS Perak", "11 August 2026"),
    ar("4", "Obtain clearance for these responses before transmission to the outlet", "Director General of Veterinary Services", "Before transmission"),
  ],
}));
body.push(cap(6, "Actions, responsible unit and completion date."));

// ── 6.0 NOTES ──
body.push(H("6.0  NOTES"));
body.push(p("6.1  Data correction note", { bold: true, keepNext: true }));
body.push(p("During preparation, one arithmetic inconsistency was found among the compiled sources. Two bases were reported for fresh milk SSR, 62.0 per cent and 66.8 per cent, a difference of 4.8 percentage points. The 66.8 per cent basis is used throughout because it is reported alongside the 15.9 per cent beef and buffalo figure in the same 2023 reference series, whereas the 62.0 per cent basis is reported without a reference year. Dependent figures have been recomputed on the adopted basis."));
body.push(p("6.2  Source note", { bold: true, keepNext: true }));
body.push(p("This paper draws on internal departmental documents, the Federal Constitution, Hansard, Department of Statistics Malaysia publications, agency publications and mainstream media reporting."));
body.push(bullet([["Sources not reached. ", { bold: true }], ["Departmental OneDrive and SharePoint files were not accessible during preparation, as was the official DVS Facebook page and the departmental website. Action 2 addresses this coverage gap.", {}]]));
body.push(bullet([["Reference years. ", { bold: true }], ["SSR figures at Table 5 use a 2023 basis. Table 2 reflects the position reported for 2025.", {}]]));
body.push(bullet([["Source tier. ", { bold: true }], ["The jurisdictional position at Tables 1 and 3 rests on primary instruments. Media reporting is used only to establish that the State policy announcement was made, not to determine the content of legal power.", {}]]));
body.push(bullet([["Activity is not outcome. ", { bold: true }], ["The VetEC figures at Table 4 record activity delivered, not change at farm level. They should not be quoted as evidence of improved farm productivity.", {}]]));

body.push(p("6.3  References", { bold: true, keepNext: true }));
[
  "Federal Constitution, Ninth Schedule, Concurrent List (List III).",
  "Animals Act 1953 [Act 647]; Malaysian Quarantine and Inspection Services Act 2011 [Act 728]; Animal Welfare Act 2015 [Act 772]; Feed Act 2009 [Act 698]; Veterinary Surgeons Act 1974 [Act 147].",
  "Parliament of Malaysia (2025). Hansard, Third Meeting, Fourth Session, Fifteenth Parliament, 1 December 2025. Written answer.",
  "Department of Statistics Malaysia (2026). Supply and Utilisation Accounts for Selected Agricultural Commodities, 2020–2024.",
  "Department of Veterinary Services (2026). GAVIS 2026 poster: Veterinary Extension as a Pillar of Livestock Industry Development, DVS VetEC 2021–2025. Internal document.",
  "Department of Veterinary Services (2026). GAVIS 2026 abstract: Climate Resilience in Malaysia's Livestock Sector. Internal document.",
  "Sinar Harian and MG Perak (2026). Perak State Executive Councillor announcement on the closed-house requirement.",
  "New Straits Times (2026). All poultry farms in Perak to adopt closed-house system by 2027.",
  "MARDI. Livestock science research; reports on the Kedah-Kelantan (KK) cattle breed.",
  "Fraser & Neave and BERNAMA (2025). F&N AgriValley, Negeri Sembilan.",
  "Business Today and Forbes (2026). Farm Fresh — Australian Friesian Sahiwal breed.",
  "PLANMalaysia (2023). Planning Guidelines for Poultry Farms, August 2023 edition.",
  "Ministry of Agriculture and Food Security (2025). Media statement on food security under the Thirteenth Malaysia Plan 2026–2030.",
  "Ministry of Agriculture and Food Security and Department of Agriculture. myGAP certification scheme for the livestock sector, formerly SALT (2003).",
].forEach((s, i) => body.push(new Paragraph({
  spacing: { after: 75, line: 252 }, indent: { left: 420, hanging: 420 },
  children: [new TextRun({ text: `${i + 1}.  ${s}`, font: F, size: 18, color: CHAR })],
})));

body.push(sp(220));
body.push(new Paragraph({ spacing: { after: 25 }, children: [new TextRun({ text: "Ruminant Section", font: F, size: 20, bold: true, color: NAVY })] }));
body.push(new Paragraph({ spacing: { after: 25 }, children: [new TextRun({ text: "Livestock Industry Development Division", font: F, size: 20, color: CHAR })] }));
body.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Department of Veterinary Services Malaysia", font: F, size: 20, color: CHAR })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
  children: [new TextRun({ text: "- End -", font: F, size: 18, italics: true, color: GREY })] }));

const doc = new Document({
  creator: "Department of Veterinary Services Malaysia",
  title: "Proposed Responses to Media Enquiry — The Edge (ESG)",
  description: "Mode B, channel E-mel — proposed responses for collation by the Dairy Unit",
  numbering: { config: [{ reference: "dot", levels: [{
    level: 0, format: LevelFormat.BULLET, text: "●", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 420, hanging: 220 } }, run: { font: F, size: 16, color: NATG } },
  }] }] },
  styles: { default: { document: { run: { font: F, size: 21, color: CHAR }, paragraph: { spacing: { line: 268 } } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1250, right: 1440, bottom: 1250, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: DEEP, space: 8 } },
      spacing: { before: 90 },
      children: [
        new TextRun({ text: "Proposed Responses — Ruminant Section, DVS Malaysia  ·  For clearance  ·  Page ", font: F, size: 15, color: GREY }),
        new TextRun({ children: [PageNumber.CURRENT], font: F, size: 15, color: GREY }),
        new TextRun({ text: " of ", font: F, size: 15, color: GREY }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: F, size: 15, color: GREY }),
      ],
    })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[2], b); console.log("written:", process.argv[2]); });
