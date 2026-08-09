# Mode templates — output skeletons

**Load when:** the mode is selected (see SKILL.md routing). Use only the skeleton for the
selected mode. Emit only the finished document — no preamble, no process narration. Every mode
ends with assignable action (what · who by unit/post · by when). Run the verification gate
before printing.

---

## MODE A — ANALISIS INVESTIGATIF
```
Laporan Teknikal
[TAJUK]

Ringkasan Eksekutif
  — the counterintuitive finding, first
  — scope, period, unit of observation
  — methods deployed, named
  — headline magnitudes with absolutes and percentages
  — the management implication in one bolded sentence

Tujuan Laporan
  — 3–4 numbered questions the report answers

1  Data dan Metodologi
   1.1 Sumber dan struktur data
   1.2 Takrif dan pengecualian
2  Trend Parameter Utama
3  [Analisis komposisi / aktiviti]
4  Analisis Statistik Inferensi        ← only at rigor TINGGI
5  Analisis Mengikut [unit ruang]
6  Analisis Regresi / Dekomposisi      ← only at rigor TINGGI
7  Limitasi Dapatan
8  Kesimpulan
9  Tindakan                            ← numbered, owned, dated
Nota                                   ← reconciliations disclosed
```

## MODE B — PENDIRIAN & ADVOKASI

### Channel: Nota
```
[TAJUK MESYUARAT]
Tarikh / Masa / Tempat

PERBANDINGAN: [A] vs [B]              ← ✓/✗ verdict table
ISU UTAMA                              ← numbered, each citing (Rujukan: …, m.s. …)
RISIKO
DATA EKONOMI
KESIMPULAN (SUDUT INDUSTRI)
TINDAKAN
SUMBER RUJUKAN                         ← numbered, full citations
[Bahagian / Jabatan]
```

### Channel: E-mel  (Mode C decimal skeleton)

Use when the deliverable is **input for an e-mail reply** that another unit will collate and
forward — a forwarded message carrying numbered questions, a request for *cadangan jawapan*, a
named collating unit, a reply-by date. Mode B content rules still bind: per-claim citation,
categorical disambiguation as an equation, a closing position. **Single language throughout.**

```
[KOP: JABATAN / BAHAGIAN]
[TAJUK — subject of the enquiry]

Kepada        : [collating unit / post — never an individual]
Daripada      : [originating section, bahagian]
Tarikh        : [DD Bulan YYYY]
Rujukan       : [enquiring outlet + medium]  ← sets the output language
Status        : Cadangan jawapan — untuk semakan dan kelulusan

1.0  TUJUAN
     — one sentence: input supplied for questions received from [outlet]

2.0  NOTA PEMBETULAN PREMIS            ← only where a question's premise is factually wrong
     2.1 the premise as stated
     2.2 the correction, with the primary instrument cited
     2.3 [DISAMBIGUATION AS AN EQUATION]
     2.4 the sentence the collating unit may quote verbatim

3.0  JAWAPAN                            ← one numbered subsection per question asked
     3.1  Soalan 1  — [question verbatim]
          Jawapan   — position first, then evidence, each claim cited
     3.2  Soalan 1(a) …
     3.3  Soalan 2 …

4.0  RINGKASAN PENDIRIAN                ← the closing position, ✓/✗ contrast where it earns it

5.0  TINDAKAN                           ← numbered, owned by unit/post, dated

6.0  NOTA
     6.1 Nota Pembetulan Data           ← only if reconciliation was triggered
     6.2 Nota Sumber                    ← coverage declaration; unreachable classes named
     6.3 Sumber Rujukan                 ← numbered, full citations

[Nama Seksyen, Bahagian]
[Jabatan]
- Tamat -
```

Questions are reproduced **verbatim in the language they were asked**, then answered in the
document language. A quoted question is a citation, not a language switch.

### Channel: Slaid
```
1  Tajuk & penceramah
2  Soalan pemacu + the disruptive counter-fact
3  Konteks: rantaian nilai / struktur industri
4  Realiti semasa — large numeric callouts
5  Definisi & perbezaan kritikal
6  Isu undang-undang / regulatori
7  Penanda aras antarabangsa
8  Pemetaan perbandingan          ← ⚠ PENEMUAN UTAMA callout
9  Analisis kos
10 Penemuan kritikal              ← the disambiguation as an equation
11 Kerangka strategik             ← e.g. Porter's Five Forces
12 Kajian kes
13 Rumusan                        ← 3 numbered positions
14 Terima kasih
```

## MODE C — REKOD PRESTASI
```
[KOP RASMI: JABATAN / BAHAGIAN]
LAPORAN [TAJUK] BAGI TAHUN [T]
Disediakan oleh: [Seksyen, Bahagian, Ibu Pejabat, Putrajaya]
Tarikh Laporan: [DD Bulan YYYY]

1.0  PENDAHULUAN                       ← headline total + YoY change
2.0  [AGREGAT MENGIKUT NEGERI]
3.0  [PECAHAN MENGIKUT PPIT]
4.0  [PECAHAN MENGIKUT DAERAH]
5.0  ANALISIS TREND                    ← bulanan, suku tahun
6.0  PERBANDINGAN TAHUNAN
7.0  POPULASI TERNAKAN
8.0  BILANGAN PENTERNAK
9.0  ANALISIS DAN RUMUSAN
10.0 TINDAKAN                          ← numbered, owned, dated
11.0 NOTA                              ← definitions, coverage, reconciliations, cut-off date
- Tamat Laporan -
```

## MODE D — AGENDA PENYELIDIKAN
```
[TAJUK]

Pembukaan: the what/why is established; the how is not.

For each thematic area:
  N. [Bidang]
     • [Sub-bidang]
       o Soalan Kajian:   the precise question
       o Jurang:          what current work does not answer
       o Kaedah Dicadang: method, data source, owner, timeline
```
