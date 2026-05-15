#!/usr/bin/env python3
"""Build self-hosted woff2 subsets and emit fonts.css with matched fallback metrics.

Sources are the canonical google/fonts mirror (SIL OFL). Output:
  apps/web/public/fonts/*.woff2
  apps/web/public/fonts/LICENSE-*.txt
  apps/web/src/fonts.css

Re-run after changing source URLs or unicode-range to regenerate the committed
artifacts. The generated woff2 + fonts.css are committed so the runtime never
fetches a third-party CDN.
"""
from __future__ import annotations

import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONTS_DIR = ROOT / "apps" / "web" / "public" / "fonts"
CSS_OUT = ROOT / "apps" / "web" / "src" / "fonts.css"
METRICS_OUT = ROOT / "apps" / "web" / "src" / "fonts.metrics.json"

# Google Fonts Latin + Latin-Extended unicode-range, merged for the subsetter.
# Source: https://fonts.google.com/knowledge/glossary/unicode_range
SUBSET_UNICODES = ",".join([
    # Latin
    "U+0000-00FF",
    "U+0131",
    "U+0152-0153",
    "U+02BB-02BC",
    "U+02C6",
    "U+02DA",
    "U+02DC",
    "U+0304",
    "U+0308",
    "U+0329",
    "U+2000-206F",
    "U+2074",
    "U+20AC",
    "U+2122",
    "U+2191",
    "U+2193",
    "U+2212",
    "U+2215",
    "U+FEFF",
    "U+FFFD",
    # Latin-Extended
    "U+0100-02AF",
    "U+0259",
    "U+0300-0301",
    "U+0303",
    "U+0305",
    "U+0307",
    "U+0309-030A",
    "U+030C",
    "U+0312",
    "U+0315",
    "U+031A",
    "U+0326",
    "U+032C",
    "U+032F",
    "U+0331",
    "U+0335",
    "U+0338",
    "U+0342",
    "U+0345",
    "U+1E00-1EFF",
    "U+2020",
    "U+20A0-20AB",
    "U+20AD-20C0",
    "U+2113",
    "U+2C60-2C7F",
    "U+A720-A7BF",
    "U+A7C2-A7CA",
    "U+A7F5-A7FF",
    "U+FB00-FB06",
])

# Public-domain canonical metrics for the chosen system fallbacks. Sourced from
# @capsizecss/metrics 3.x (MIT). Keeping a local copy avoids an npm dep just to
# emit four numbers and keeps the build hermetic.
FALLBACKS = {
    "times-new-roman": {
        # @capsizecss/metrics/timesNewRoman.js
        "familyName": "Times New Roman",
        "unitsPerEm": 2048,
        "ascent": 1825,
        "descent": -443,
        "lineGap": 87,
        "capHeight": 1356,
        "xHeight": 916,
        "xWidthAvg": 832,
    },
    "helvetica-neue": {
        # @capsizecss/metrics/helveticaNeue.js
        "familyName": "Helvetica Neue",
        "unitsPerEm": 1000,
        "ascent": 952,
        "descent": -213,
        "lineGap": 28,
        "capHeight": 714,
        "xHeight": 517,
        "xWidthAvg": 484,
    },
}


@dataclass
class FaceSpec:
    key: str                # output filename stem
    family: str             # CSS family name
    source_url: str         # upstream TTF on google/fonts mirror
    style: str              # "normal" | "italic"
    weight: str             # "400" or "100 900" etc
    license_url: str        # OFL.txt url
    license_filename: str   # apps/web/public/fonts/LICENSE-...
    fallback_key: str       # "times-new-roman" | "helvetica-neue"
    # Optional: variable-font axis defaults for the @font-face. Empty when static.
    font_variation_settings: str = ""


GH = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FRAUNCES = f"{GH}/fraunces"
INSTRUMENT = f"{GH}/instrumentserif"
SPACE_GROTESK = f"{GH}/spacegrotesk"
INTER = f"{GH}/inter"

FACES: list[FaceSpec] = [
    FaceSpec(
        key="Fraunces-VF",
        family="Fraunces",
        source_url=f"{FRAUNCES}/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf",
        style="normal",
        weight="100 900",
        license_url=f"{FRAUNCES}/OFL.txt",
        license_filename="LICENSE-Fraunces.txt",
        fallback_key="times-new-roman",
    ),
    FaceSpec(
        key="Fraunces-VF-Italic",
        family="Fraunces",
        source_url=f"{FRAUNCES}/Fraunces-Italic%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf",
        style="italic",
        weight="100 900",
        license_url=f"{FRAUNCES}/OFL.txt",
        license_filename="LICENSE-Fraunces.txt",
        fallback_key="times-new-roman",
    ),
    FaceSpec(
        key="InstrumentSerif-Regular",
        family="Instrument Serif",
        source_url=f"{INSTRUMENT}/InstrumentSerif-Regular.ttf",
        style="normal",
        weight="400",
        license_url=f"{INSTRUMENT}/OFL.txt",
        license_filename="LICENSE-InstrumentSerif.txt",
        fallback_key="times-new-roman",
    ),
    FaceSpec(
        key="InstrumentSerif-Italic",
        family="Instrument Serif",
        source_url=f"{INSTRUMENT}/InstrumentSerif-Italic.ttf",
        style="italic",
        weight="400",
        license_url=f"{INSTRUMENT}/OFL.txt",
        license_filename="LICENSE-InstrumentSerif.txt",
        fallback_key="times-new-roman",
    ),
    FaceSpec(
        key="SpaceGrotesk-VF",
        family="Space Grotesk",
        source_url=f"{SPACE_GROTESK}/SpaceGrotesk%5Bwght%5D.ttf",
        style="normal",
        weight="300 700",
        license_url=f"{SPACE_GROTESK}/OFL.txt",
        license_filename="LICENSE-SpaceGrotesk.txt",
        fallback_key="helvetica-neue",
    ),
    FaceSpec(
        key="Inter-VF",
        family="Inter",
        source_url=f"{INTER}/Inter%5Bopsz%2Cwght%5D.ttf",
        style="normal",
        weight="100 900",
        license_url=f"{INTER}/OFL.txt",
        license_filename="LICENSE-Inter.txt",
        fallback_key="helvetica-neue",
    ),
    FaceSpec(
        key="Inter-VF-Italic",
        family="Inter",
        source_url=f"{INTER}/Inter-Italic%5Bopsz%2Cwght%5D.ttf",
        style="italic",
        weight="100 900",
        license_url=f"{INTER}/OFL.txt",
        license_filename="LICENSE-Inter.txt",
        fallback_key="helvetica-neue",
    ),
]


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "robware-fonts-build"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def subset_ttf_to_woff2(ttf_bytes: bytes, out_path: Path) -> None:
    """Run pyftsubset to produce a Latin+Latin-Ext woff2 with all OT features kept."""
    with tempfile.TemporaryDirectory() as tmpdir:
        src = Path(tmpdir) / "src.ttf"
        src.write_bytes(ttf_bytes)
        cmd = [
            sys.executable, "-m", "fontTools.subset",
            str(src),
            f"--unicodes={SUBSET_UNICODES}",
            "--layout-features+=ss01,ss02,ss03,ss04,ss05,ss06,ss07,ss08,salt,smcp,c2sc,onum,lnum,tnum,pnum,zero,case,frac,sups,subs,dlig,hlig,calt,clig,liga,kern,dnom,numr,ordn",
            "--name-IDs=*",
            "--name-legacy",
            "--glyph-names",
            "--symbol-cmap",
            "--legacy-cmap",
            "--notdef-glyph",
            "--notdef-outline",
            "--recommended-glyphs",
            "--no-hinting",
            "--drop-tables=",
            "--passthrough-tables",
            "--flavor=woff2",
            f"--output-file={out_path}",
        ]
        subprocess.run(cmd, check=True)


def compute_metrics(face_path: Path, fallback: dict) -> dict:
    """Compute size-adjust + ascent/descent/line-gap overrides.

    Algorithm follows @capsizecss/core:
        size-adjust       = fallback.xWidthAvg/UPM  /  custom.xWidthAvg/UPM
        ascent-override   = custom.ascent / (UPM * size-adjust)
        descent-override  = |custom.descent| / (UPM * size-adjust)
        line-gap-override = custom.lineGap / (UPM * size-adjust)
    xWidthAvg is the frequency-weighted average advance width of lowercase a-z
    (Latin only); falls back to 'x' advance when frequency tables are absent.
    """
    tt = TTFont(face_path)
    upm = tt["head"].unitsPerEm
    os2 = tt["OS/2"]
    hhea = tt["hhea"]

    # Prefer Typo metrics when fsSelection bit 7 (USE_TYPO_METRICS) is set.
    use_typo = bool(os2.fsSelection & (1 << 7))
    if use_typo:
        ascent = os2.sTypoAscender
        descent = os2.sTypoDescender
        line_gap = os2.sTypoLineGap
    else:
        ascent = hhea.ascent
        descent = hhea.descent
        line_gap = hhea.lineGap

    # xWidthAvg: frequency-weighted advance widths of a-z, matching Capsize.
    # Weights are normalised relative-frequency from common English corpora.
    letter_freq = {
        "a": 8.2, "b": 1.5, "c": 2.8, "d": 4.3, "e": 12.7, "f": 2.2,
        "g": 2.0, "h": 6.1, "i": 7.0, "j": 0.15, "k": 0.77, "l": 4.0,
        "m": 2.4, "n": 6.7, "o": 7.5, "p": 1.9, "q": 0.095, "r": 6.0,
        "s": 6.3, "t": 9.1, "u": 2.8, "v": 0.98, "w": 2.4, "x": 0.15,
        "y": 2.0, "z": 0.074,
    }
    cmap = tt.getBestCmap()
    hmtx = tt["hmtx"]
    total_weight = 0.0
    weighted_advance = 0.0
    for ch, w in letter_freq.items():
        gid = cmap.get(ord(ch))
        if not gid:
            continue
        advance, _lsb = hmtx[gid]
        weighted_advance += advance * w
        total_weight += w
    if total_weight == 0:
        # Static fallback: use 'x' advance, or upm/2.
        gid = cmap.get(ord("x"))
        x_advance = hmtx[gid][0] if gid else upm / 2
    else:
        x_advance = weighted_advance / total_weight

    x_width_avg = x_advance

    custom_ratio = x_width_avg / upm
    fallback_ratio = fallback["xWidthAvg"] / fallback["unitsPerEm"]
    size_adjust = fallback_ratio / custom_ratio
    ascent_override = ascent / (upm * size_adjust)
    descent_override = abs(descent) / (upm * size_adjust)
    line_gap_override = line_gap / (upm * size_adjust)

    return {
        "unitsPerEm": upm,
        "ascent": ascent,
        "descent": descent,
        "lineGap": line_gap,
        "xWidthAvg": x_width_avg,
        "fallback": fallback["familyName"],
        "sizeAdjust": size_adjust,
        "ascentOverride": ascent_override,
        "descentOverride": descent_override,
        "lineGapOverride": line_gap_override,
    }


def pct(n: float) -> str:
    return f"{n * 100:.4f}%"


def emit_css(metrics_by_key: dict) -> str:
    parts: list[str] = []
    parts.append(
        "/* Generated by scripts/build-fonts.py — DO NOT EDIT BY HAND.\n"
        " *\n"
        " * Self-hosted woff2 subsets (Latin + Latin-Extended).\n"
        " * Each @font-face carries size-adjust + ascent/descent/line-gap overrides\n"
        " * tuned against the matching system fallback so the swap from fallback to\n"
        " * the real face stays inside ~2% width delta at the poster headline.\n"
        " */\n"
    )

    for face in FACES:
        m = metrics_by_key[face.key]
        # Same unicode-range we subsetted to; mirrored from SUBSET_UNICODES so
        # the browser only requests this face for the Latin/Latin-Ext subset.
        unicode_range = ", ".join(SUBSET_UNICODES.split(","))
        parts.append(
            "@font-face {\n"
            f"  font-family: '{face.family}';\n"
            f"  src: url('/fonts/{face.key}.woff2') format('woff2');\n"
            f"  font-style: {face.style};\n"
            f"  font-weight: {face.weight};\n"
            "  font-display: swap;\n"
            f"  size-adjust: {pct(m['sizeAdjust'])};\n"
            f"  ascent-override: {pct(m['ascentOverride'])};\n"
            f"  descent-override: {pct(m['descentOverride'])};\n"
            f"  line-gap-override: {pct(m['lineGapOverride'])};\n"
            f"  unicode-range: {unicode_range};\n"
            "}\n"
        )

    parts.append(
        "/* Design tokens — pair every brand family with its tuned fallback stack so\n"
        " * the matched-metrics machinery applies during the swap window. */\n"
        ":root {\n"
        "  --font-fraunces: 'Fraunces', 'Times New Roman', Times, serif;\n"
        "  --font-instrument-serif: 'Instrument Serif', 'Times New Roman', Times, serif;\n"
        "  --font-space-grotesk: 'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;\n"
        "  --font-inter: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;\n"
        "  --font-serif: var(--font-fraunces);\n"
        "  --font-sans: var(--font-inter);\n"
        "}\n"
    )

    parts.append(
        "/* OpenType feature presets.\n"
        " * .ot-poster: applied to anything rendering on the poster surface — keeps\n"
        " *   editorial typography on by default.\n"
        " * .ot-ui-numerals: lining + tabular numerals for UI chrome, where columns\n"
        " *   and alignment matter more than rhythm. */\n"
        ".ot-poster {\n"
        "  font-feature-settings: 'liga' 1, 'clig' 1, 'dlig' 1, 'kern' 1, 'onum' 1;\n"
        "  font-variant-ligatures: common-ligatures discretionary-ligatures contextual;\n"
        "  font-variant-numeric: oldstyle-nums;\n"
        "  font-kerning: normal;\n"
        "  text-rendering: optimizeLegibility;\n"
        "}\n"
        ".ot-ui-numerals {\n"
        "  font-feature-settings: 'lnum' 1, 'tnum' 1, 'kern' 1;\n"
        "  font-variant-numeric: lining-nums tabular-nums;\n"
        "}\n"
        ".ot-watermark {\n"
        "  font-feature-settings: 'smcp' 1, 'c2sc' 1, 'kern' 1;\n"
        "  font-variant-caps: all-small-caps;\n"
        "  letter-spacing: 0.08em;\n"
        "}\n"
    )

    return "\n".join(parts) + "\n"


def main() -> int:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    metrics_by_key: dict = {}
    licenses_fetched: set[str] = set()

    for face in FACES:
        print(f"→ {face.key}: downloading {face.source_url}", flush=True)
        ttf_bytes = http_get(face.source_url)
        out_path = FONTS_DIR / f"{face.key}.woff2"
        print(f"  subsetting → {out_path.relative_to(ROOT)} ({len(ttf_bytes)} B in)", flush=True)
        subset_ttf_to_woff2(ttf_bytes, out_path)

        # Compute metrics from the subsetted file for fidelity to what ships.
        fallback = FALLBACKS[face.fallback_key]
        with tempfile.NamedTemporaryFile(suffix=".woff2") as tmp:
            tmp.write(out_path.read_bytes())
            tmp.flush()
            # fontTools.TTFont needs a real path for woff2; reuse our output.
            metrics = compute_metrics(out_path, fallback)
        metrics_by_key[face.key] = metrics
        print(
            "  metrics:"
            f" size-adjust={pct(metrics['sizeAdjust'])}"
            f" ascent={pct(metrics['ascentOverride'])}"
            f" descent={pct(metrics['descentOverride'])}"
            f" line-gap={pct(metrics['lineGapOverride'])}",
            flush=True,
        )

        if face.license_filename not in licenses_fetched:
            print(f"  license → {face.license_filename}", flush=True)
            (FONTS_DIR / face.license_filename).write_bytes(http_get(face.license_url))
            licenses_fetched.add(face.license_filename)

    CSS_OUT.write_text(emit_css(metrics_by_key))
    METRICS_OUT.write_text(json.dumps(metrics_by_key, indent=2) + "\n")
    print(f"✓ wrote {CSS_OUT.relative_to(ROOT)}")
    print(f"✓ wrote {METRICS_OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
