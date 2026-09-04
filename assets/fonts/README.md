# Deterministic Unicode bitmap source

`unifont-17.0.05.hex.gz` is the fixed GNU Unifont 17.0.05 Plane 0 `.hex` build downloaded from:

```text
https://unifoundry.com/pub/unifont/unifont-17.0.05/font-builds/unifont-17.0.05.hex.gz
```

Identity:

```text
bytes   936609
sha256  2ae5311c8e123e9e85f5331cd012aa99757071df23243f1487fdbf8f3acd86be
```

Workprint reads the fixed 8×16 and 16×16 glyph bitmaps directly and never invokes a system font or platform rasterizer. This makes BMP public-title rendering, including CJK, byte-deterministic across supported Node platforms. Complex-script shaping and supplementary-plane coverage are not claimed.

The font software remains under the SIL Open Font License 1.1, reproduced in `OFL-1.1.txt`. Workprint's own source remains under its repository `LICENSE`.
