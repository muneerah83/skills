# Verification gate — run before printing ANY draft

**Load when:** a draft exists and is about to be printed. Every check is **blocking**.

---

## S1 — Register and voice
- Formal institutional register; impersonal construction: **`Laporan ini menilai…`**,
  `Analisis ini berasaskan…`, `Bahagian ini membentangkan…`
- **First person is prohibited in all modes.** No *kita*, no *kami*, no *saya*. The analyst is
  not a character in the document.
- English technical terms parenthesised on first use, then BM alone (see lexicon first-use rule).

## S2 — Bold discipline (semantic only, never decorative)
Bold is reserved for: the takeaway sentence of a section · table headers, total rows, and delta
columns · significance verdicts (**Signifikan** / **Tidak signifikan**) · the disambiguating
term in a contrast. If bold is doing emphasis rather than *marking a finding*, remove it.

## S3 — Numeric precision
- Retain full source precision in tables: `63,325,673.45 liter`, `H = 1.567 (evenness 0.680)`
- Percentage change always paired with absolutes: `+31.84%, iaitu 3,216 kepada 4,240 orang`
- Statistical results as complete tuples: `F = 22.94, p < 0.0001`; `r = +0.924, p = 0.025`; `R² = 0.998`
- Thousands separators throughout; two decimals on money and volume
- Direction sign carried explicitly on deltas: `−14.64%`, `+125.89%`

## S4 — Table and figure discipline
- Sequential numbering: `Jadual 1, 2, 3…` and `Rajah 1, 2, 3…` — verify no repeats, no gaps
- **Every table/figure is referenced in prose before it appears** (`Jadual 1 menunjukkan…`,
  `Rajah 3 memaparkan…`)
- Caption format: bold label, italic descriptor —
  `**Jadual 1.** *Trend parameter utama VetEC, 2021–2025.*`
- Section numbering strictly sequential — verify the whole sequence end to end

## S5 — Transition lexicon (deploy deliberately; they carry the argument)
| Transition | Function |
|---|---|
| **`Dengan kata lain,`** | restate a technical result in policy language — bridge from statistics to decision |
| **`Sebaliknya,`** | pivot to the counter-trend or the contradicting case |
| `Secara rumusan,` | open the executive summary's headline finding |
| `Apabila dinilai mengikut…` | introduce a reframing by a different unit or period |
| `Namun demikian,` | concede, then qualify |
| `Ini bermakna` / `Ini mengesahkan bahawa` | convert a result into its interpretation |

## S6 — Authority ceiling is RAISED — hedged endings are BANNED
| ✗ Banned | ✓ Required |
|---|---|
| `Keutamaan disarankan bertumpu…` | `Keutamaan hendaklah bertumpu…` |
| `adalah dicadangkan…` | `perlu dilaksanakan…` |
| `memerlukan siasatan lanjut` | a **specified study**: question, method, data source, owner, deadline |
| `perlu diberi perhatian` | the specific action, its owner, and its timeline |
| `boleh dipertimbangkan` | `hendaklah` / `perlu` + the action |

Every report terminates in a numbered, prioritised action list. Each action names **what**,
**who** (by unit or post — never an individual), and **by when**. Where an evidence gap prevents
a recommendation, convert it into a commissioned study, not a hedge:

> ✗ `Penurunan pengeluaran di PPIT Sabak Bernam memerlukan siasatan lanjut.`
> ✓ `PPIT Sabak Bernam hendaklah menjalani audit pengeluaran meliputi rekod populasi induk,
>    kadar laktasi dan penyelenggaraan peralatan bagi tempoh Julai–Disember 2025.
>    Tanggungjawab: Seksyen Ruminan, BPIT dengan JPV Negeri Selangor. Tarikh siap: 30 Jun 2026.`

## S7 — Arithmetic verification gate (recompute; do not trust a supplied table)
| # | Check |
|---|---|
| **V1** | every column and row total equals the sum of its components |
| **V2** | every percentage recomputes from its own numerator/denominator; percentage columns sum to 100.00% |
| **V3** | every period-on-period change recomputes from the two values shown |
| **V4** | every composite equals its stated definition (e.g. `Induk = B. Perah + B. Kering + Dara`) |
| **V5** | every ranking claim in prose matches the ordering in the table it cites |
| **V6** | one national total only — same figure in summary, tables, and narrative |
| **V7** | section and figure numbering sequential and complete |
| **V8** | every declared parameter is actually applied — and on **both** the cost side and the revenue side |
| **V9** | every unit label is dimensionally coherent with its own arithmetic |
| **V10** | every label matches the computation beneath it (a line called "5% of X" must compute 5% of X) |

**V8, V9, V10 catch the errors humans miss.** A model whose parameter table declares a varying
rate while its revenue line holds output constant is internally contradictory, and every
downstream appraisal figure inherits the contradiction.

## Reconciliation protocol (MANDATORY, all modes)
On any conflict across sources, tables, or sections — or any V-check failure:
1. **Identify** every basis present and quantify the delta.
2. **Trace** the delta to its origin (a component included in one basis and excluded from
   another; a stale revision; a transcription error).
3. **Auto-select** the internally consistent basis — the one whose components sum to its own
   total and which reconciles with the narrative.
4. **Apply it uniformly** to every table, figure, percentage, and sentence.
5. **Disclose** the correction in `Nota` — state the discrepancy, the basis adopted, and why.

Never halt for instructions. Never silently pick one. Correct, apply, disclose.

## S9 — Sourcing integrity (run against `reference/sourcing-protocol.md`)
| # | Check |
|---|---|
| **X1** | Every claim is attributed to its correct tier — statutory/primary, internal record, agency publication, or media. No claim inherits authority from a tier above its origin |
| **X2** | Where a legal or jurisdictional position is asserted, it rests on the **primary instrument**, not on a media restatement of it |
| **X3** | No figure seen only in a search snippet is presented as verified; each is confirmed against a Tier 1 source or flagged in `Nota` |
| **X4** | Every source class attempted is recorded, and every unreachable class is declared in the coverage block — never silently omitted |
| **X5** | Internal records cited are traceable to a named file and version; no figure quoted from an ambiguous near-duplicate |
| **X6** | Where a departmental public statement may exist on the same issue and could not be read, that risk is stated |

An unflagged figure is, by construction, a figure the department is prepared to defend. Flag
accordingly, or verify.

## S10 — Single-language integrity (BLOCKING)

One language governs the **entire** deliverable. Mixing is a failure even where each fragment is
individually correct — it is the most common defect in e-mail-input drafts, where an officer
reasons in one language and places the quotable line in the other.

| # | Check |
|---|---|
| **G1** | Every heading, table header, caption, bullet, verdict line and closing block is in the document language |
| **G2** | No question is answered in one language while an adjacent question is answered in the other |
| **G3** | The quotable position line is in the **same** language as the reasoning that supports it |
| **G4** | No heading in one language sits over a body in the other |
| **G5** | Where both languages are required, **two complete single-language documents** exist carrying an identical argument — never one bilingual document |

**Not mixing, and not to be "corrected":**
- Untranslatable proper nouns — statute short titles (`Akta Binatang 1953 [Akta 647]`), agency
  names, scheme names (`myGAP`), post titles, publication names.
- First-use glosses under the lexicon rule — `lembu tenusu (dairy cattle)`, `fixed effects
  (kesan tetap)`. A parenthesised gloss is not a switch of the running text.
- A question reproduced **verbatim in the language it was asked**, before being answered in the
  document language. A quoted question is a citation.
- An internal covering remark that sits outside the answer body.

Detect mechanically before printing — per-section function-word balance, not impression:

```bash
python3 - <<'PY'
import re, sys
BM = set("dan yang ini itu pada dengan untuk adalah akan tidak boleh perlu hendaklah "
         "merupakan kepada daripada dalam oleh serta bagi iaitu manakala kerana".split())
EN = set("the and this that with for is are will not can must should of to from in "
         "by as which while because been have has".split())
text = open(sys.argv[1], encoding='utf-8').read()
# Numbered bibliography entries quote source titles verbatim and are exempt by rule.
REF = re.compile(r'^\s*\d+\.\s')
blocks = [b for b in re.split(r'\n\s*\n', text)
          if len(b.split()) >= 12 and not REF.match(b)]
tag = []
for b in blocks:
    w = re.findall(r"[A-Za-z']+", b.lower())
    bm, en = sum(x in BM for x in w), sum(x in EN for x in w)
    tag.append('BM' if bm > en else 'EN' if en > bm else '?')
major = max(set(tag), key=tag.count) if tag else '?'
odd = [(i, t, blocks[i][:70].replace('\n', ' ')) for i, t in enumerate(tag)
       if t != major and t != '?']
print(f'document language: {major}   blocks: {len(tag)}')
print('S10 :', 'PASSED' if not odd else 'FAILED')
for i, t, s in odd: print(f'   [{t}] block {i}: {s}…')
sys.exit(1 if odd else 0)
PY
```

Run it against extracted draft text. Every flagged block is either a genuine language switch —
rewrite it — or one of the four exemptions above, in which case confirm and move on.

## S8 — Final pre-print sweep
- [ ] Mode correct for audience × stakes
- [ ] Rigor level justified by contestation, not data volume
- [ ] No inferential statistics deployed against an uncontested finding
- [ ] Language matches the audience, not the request — and a media outlet's own publication medium
- [ ] **S10 single-language integrity passed (G1–G5) — no mixing anywhere in the deliverable**
- [ ] Lexicon compliant; no L10 source errors propagated
- [ ] **L11 purity sweep run and PASSED — zero Indonesian forms, L11.6 exceptions honoured**
- [ ] **Sourcing checks X1–X6 passed; coverage declaration present in `Nota`**
- [ ] No individuals named
- [ ] All ten verification checks passed
- [ ] Reconciliations disclosed in `Nota`
- [ ] `Limitasi` present (Mode A)
- [ ] Terminates in assignable action with owner and deadline — no banned hedges
- [ ] Conclusion restates the **implication**, not the statistics
