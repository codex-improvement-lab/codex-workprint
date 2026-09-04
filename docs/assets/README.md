# Repository assets

`github-social-preview.png` is the current 0.3 Run Receipt repository social preview. It is byte-identical to `demo/share-card.png`, so the public repository card and the product's own downloadable card tell the same bounded story. The copied repository asset is not an eighth bundle file and must not replace `demo/share-card.png` in bundle receipts.

`workprint-profile-triptych.png` remains the 0.2 Unified Profiles comparison asset. It is generated deterministically from the three checked-in Profile IRs with the Profile bitmap renderer. Its fixed indexed palette keeps the image below the strict one-million-byte gate without a runtime image dependency.

| Property | Value |
| --- | --- |
| Dimensions | 1200×630 |
| Format | PNG, indexed color |
| Bytes | 756798 |
| SHA-256 | `dc7e8a82ba3196cfb5216a29f307d99de6a0a375eaeba47a0bb0c588c292331c` |
| Source | byte-identical `demo/share-card.png` |
| Renderer | `workprint-png-v5/indexed-stored-deflate/unifont-17.0.05` |

| Profile triptych property | Value |
| --- | --- |
| Dimensions | 1200×630 |
| Format | PNG, indexed color |
| Bytes | 756798 |
| SHA-256 | `77398e82359a997211a012012bcd8b3c919c0d89e55f24399eeafbad4661c446` |
| Source | Three checked-in `examples/profile/*/profile.json` public projections |
| Renderer | `workprint-profile-png-v1/stored-deflate/bitmap-5x7` |

[GitHub's social-preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview) accepts PNG/JPG/GIF under 1 MB and recommends at least 640×320. The automated gate intentionally uses the unambiguous stricter check `< 1,000,000` bytes. Upload the current Run Receipt preview through repository settings only after the user creates the remote repository.
