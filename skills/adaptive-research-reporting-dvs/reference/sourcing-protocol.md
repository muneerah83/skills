# Sourcing protocol — acquiring the data spine

**Load when:** the request needs facts, figures, or documents you do not already hold.
Run this **before** the synthesis ladder. An analysis is only as defensible as its weakest source.

---

## 1 — Source precedence

Every claim is attributed to a tier. **A claim never inherits the authority of a higher tier
than the one it came from.**

| Tier | Class | Authority | Use for |
|---|---|---|---|
| **1** | Statutory and primary — Perlembagaan Persekutuan, Akta (LOM/AGC), Penyata Rasmi Parlimen (Hansard), DOSM releases, gazetted instruments | Decisive | Jurisdiction, legal duties, official statistics |
| **2** | Internal departmental records — Google Drive, OneDrive/SharePoint, PPIT returns, technical logs, herd registers | Decisive **for own-department activity only** | Modes A and C data spine |
| **3** | Agency publications — DVS, KPKM, PLANMalaysia, MARDI, JAKIM, KKM; commissioned studies | Strong | Programme design, technical standards, policy direction |
| **4** | Mainstream media | **Weak** | Establishing *that* an announcement was made, and by whom. **Never** the substance of a figure or of a legal position |

**The recurring failure this rule prevents:** a media report says an agency "mandated" something.
Tier 4 establishes that the announcement happened; only Tier 1 establishes who actually holds the
power. Where the two diverge, the divergence *is the finding* — surface it, do not average it.

Where a Tier 1 source is reachable, a Tier 3 or 4 restatement of the same fact is not a
substitute. Cite the primary instrument.

---

## 2 — Internal records: Google Drive

Tools: `search_files` · `read_file_content` · `download_file_content` · `list_recent_files` ·
`get_file_metadata`

**Search both languages, always.** Departmental drives mix BM and English filenames and body
text; a single-language query silently halves the corpus.

```
fullText contains 'ternakan' or fullText contains 'livestock'
title contains 'tenusu' or title contains 'dairy'
```

Query grammar: `title` · `fullText` · `mimeType` · `modifiedTime` · `createdTime` · `parentId` ·
`owner = 'me'` · `sharedWithMe = true`. Combine with `and` / `or` / `not`. Dates in RFC 3339.

- Pass `excludeContentSnippets: true` when enumerating — snippets bury the file list.
- Google-native files (`application/vnd.google-apps.document|presentation|spreadsheet`) read
  directly via `read_file_content`. Binary `.pdf` / `.docx` / `.xlsx` may need
  `download_file_content` and local extraction (§5.1).
- Record `owner`, `modifiedTime` and file ID for every document cited. A departmental figure
  whose file version you cannot name is not a Tier 2 source.

**Watch for near-duplicates.** Drives routinely hold `X.pptx` and a Google-converted `X` of the
same deck, or `Copy of X (updated ...)`. Establish which is authoritative before quoting; a
figure taken from a stale copy is a reconciliation break waiting to be found by a reader.

---

## 3 — Internal records: OneDrive / SharePoint

Tool class: Microsoft 365 connector (`mcp__Microsoft_365__*` or equivalent).

**Check availability before relying on it.** In many sessions the connector is installed at
organisation level but not enabled for the active chat, in which case its tools are absent
even though the connector appears in the account's list.

When it is unavailable, the protocol is fixed:

1. **Do not silently omit the source class.** Absence of departmental OneDrive content is a
   coverage gap, not an empty result.
2. **Declare it** in the coverage block (§6) and in `Nota`.
3. **Offer the two fallbacks:** the officer enables the connector for the session, or uploads
   the specific files directly.
4. **Never infer** the content of an unreachable file from its title.

The same rule governs any departmental social channel (e.g. the official Facebook page): if a
public departmental statement may exist and cannot be read, say so. Message inconsistency
between a report and a prior public statement is a Tier 1 political risk even when the report
is technically correct.

---

## 4 — Public and statutory sources: WebSearch and WebFetch

### 4.1 WebSearch

**Search Malaysian government material in Bahasa Malaysia.** BM queries surface Hansard PDFs,
state portals and agency releases that the English equivalent does not return. Run the BM query
first, then the English query for international framing.

For every result, capture three things before using it:

- **Issuing body** — and whether it is **federal or state**. This single attribute resolves a
  large share of jurisdiction questions.
- **Date** — and the reference year of any figure, which is frequently earlier than the
  publication date.
- **Tier** (§1).

Target sources by name where the question is legal or statistical:
`parlimen.gov.my` (Hansard) · `lom.agc.gov.my` (Undang-undang Malaysia) · `dosm.gov.my` ·
state enactment portals · agency sites.

### 4.2 WebFetch

Use to obtain the full text of a page already identified by search.

**Known blocks — treat as expected, not as errors to retry:**

| Symptom | Meaning | Response |
|---|---|---|
| `403` from a news site | Publisher blocks automated fetch | Fall back to the search snippet; mark the figure unverified |
| `403` on a statistics PDF | Same | Seek the figure in Hansard or an agency restatement instead |
| Proxy `403` on CONNECT | Host denied by the environment's egress policy | **Report the blocked host. Do not route around it** |

Diagnose a proxy denial with `curl -sS "$HTTPS_PROXY/__agentproxy/status"`, which records the
refused host. Never disable TLS verification and never unset the proxy.

**The blocking rule:** a figure seen only in a search snippet is **not verified**. Either
confirm it against a reachable Tier 1 source, or carry it with an explicit verification flag
into `Nota`. Presenting snippet-level precision as confirmed is a fabrication.

---

## 5 — Local processing: Bash

### 5.1 Extraction from supplied documents

`.docx` is a zip of XML; extract without a converter when none is installed:

```bash
python3 - <<'PY'
import zipfile, re, html
z = zipfile.ZipFile('input.docx')
d = z.read('word/document.xml').decode('utf-8')
d = re.sub(r'</w:p>', '\n', d)
d = re.sub(r'<[^>]+>', '', d)
print(html.unescape(d))
PY
```

For `.pdf`, prefer `pdftotext`; install `poppler-utils` if absent.

### 5.2 Arithmetic — recompute, never eyeball

Every V1–V10 check in `verification-gate.md` is a computation. Run it. A recomputed table is
evidence; a glanced-at table is not. Totals, percentages, period-on-period deltas and composite
columns (`Induk = B. Perah + B. Kering + Dara`) are all recomputed from primitives before the
draft is printed.

### 5.3 Bahasa Malaysia purity sweep (L11.8)

Automate the sweep; do not read for it. Word boundaries are mandatory — see L11.6.

```bash
python3 - <<'PY'
import re, sys
text = open(sys.argv[1], encoding='utf-8').read().lower()
prohibited = """sapi hewan peternak peternakan domba pakan bibit wabah obat laboratorium
pangan swasembada gizi kesehatan penelitian peneliti analisa rata-rata persen persentase
variabel koefisien rasio frekuensi observasi temuan proyeksi prediksi asumsi tingkat produksi
produsen konsumen distribusi ekspor impor dampak efisiensi efektivitas kinerja capaian
keberlanjutan berkelanjutan limbah energi listrik pasokan pemerintah kebijakan instansi dinas
lembaga perusahaan karyawan rapat pedoman usulan rekomendasi implementasi kepatuhan penegakan
evaluasi tinjauan administrasi keuangan biaya investasi bisnis manajemen pabrik kantor izin
sertifikasi informasi pelatihan wilayah provinsi kabupaten tim koordinasi sosialisasi yaitu
yakni karena sedangkan kenapa bisa sistim banci""".split()
hits = [w for w in prohibited
        if re.search(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', text)]
for c in ('di mana', 'adalah merupakan'):
    if c in text: hits.append(c + ' (calque)')
fp = [w for w in ('kita', 'kami', 'saya')
      if re.search(r'(?<![a-z])' + w + r'(?![a-z])', text)]
print('L11 sweep :', hits or 'PASSED')
print('S1 person :', fp or 'PASSED')
sys.exit(1 if (hits or fp) else 0)
PY
```

Run it against extracted draft text, not the source script. Exit code 1 = the draft has FAILED
and must be corrected and re-scanned.

### 5.4 Rendered output

Where the deliverable is a document, render and **look at it** before release — a draft never
displayed has not been checked. Wording errors and broken pagination survive every textual
review and are obvious on sight.

---

## 6 — Coverage declaration (MANDATORY)

Every report records which source classes were attempted and which were reachable. This is not
an apology; it is the same armour as `Limitasi` — a gap the reader discovers is a wound, a gap
you declare first is a fence.

Place it in `Nota`, in the document language:

```
Nota Sumber
Laporan ini disediakan berdasarkan [senarai kelas sumber yang dicapai].
Sumber berikut tidak dapat dicapai semasa penyediaan: [kelas + sebab].
Angka bertanda [†] memerlukan pengesahan dengan [unit pemilik data] sebelum
dikeluarkan secara rasmi.
```

Three conditions make the declaration blocking:

- A **Tier 2** source class was unreachable → declare it; the internal data spine is incomplete.
- A figure rests on **Tier 4** only → flag it and name the Tier 1 source that would settle it.
- A figure was seen **only in a search snippet** → flag it as unverified.

An unflagged figure is, by construction, a figure the department is prepared to defend.
