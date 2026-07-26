# VetEC Analysis

This directory contains analysis reports, appendices, scripts, and generated HTML artifacts for the VetEC (Veterinary Extension Centre) trend and output-driver study covering 2021–2025.

## Contents

### Reports & Appendices
- `Analisis-Tren-VetEC-2021-2025.docx` — zone and year trend analysis report
- `Lampiran-F-Analisis-Post-Hoc-VetEC.docx` — Appendix F: post-hoc multivariate analysis
- `Lampiran-G-Pemacu-Output-VetEC.docx` — Appendix G: output-driver and zone-identity analysis
- `Lampiran-H-Identiti-Zon-Tidak-Diukur.docx` — Appendix H: unmeasured regulatory-zone identity analysis

### Analysis Scripts (Python)
- `tren.py` / `tren2.py` — trend analysis by zone and year
- `posthoc.py` — post-hoc statistical analysis
- `robust.py` — robust regression analysis
- `identiti.py` / `identiti2.py` — zone identity analysis
- `lawatan.py` / `lawatan2.py` — farm-visit analysis
- `baki.py` — residual analysis
- `mandat.py` — mandate/regulatory output analysis
- `build_panel.py` — panel data construction

### Report Generators (JavaScript)
- `mklampg.js` — generates `Lampiran-G-Pemacu-Output-VetEC.docx` via the `docx` npm package
- `mklamph.js` — generates `Lampiran-H-Identiti-Zon-Tidak-Diukur.docx` via the `docx` npm package

### Generated HTML Artifacts
- `laporan-pemacu-output-vetec.html` — output-driver report (HTML)
- `peta-vetec-2025.html` — VetEC zone map for 2025 (HTML)

## Notes

All scripts use relative paths and should be run from within this `vetec-analysis/` directory. Input data files (e.g. `logteknikal_v2.xlsx`, `lt_v3.xlsx`) should be placed here before running the scripts.
