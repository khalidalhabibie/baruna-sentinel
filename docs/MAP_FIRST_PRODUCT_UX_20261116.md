# BARUNA Sentinel — Map-first UX (16 November 2026)

## Decision
**Workspace first, explanations on demand.** The default page is now a single, source-backed **Tanjung Emas evidence workspace**, not a long pitch deck.

The initial screen has:
1. **Six real published 2005 sectors**, selectable on the left.
2. **Semarang basemap** in the center (regional context only, no invented surveyed sector pins).
3. **One evidence decision** on the right: historical settlement, evidence availability, and next verification action.
4. **Review assessment** and **GNSS** as progressively deeper workflows. No automatic tutorial overlay, invented risk metrics, or unsupported asset georeferencing.

## Source and caveats
The six sector names and cumulative 2005 settlements are loaded at runtime from `data/tanjung-emas-historical-field-evidence.json` and strictly checked by `validateHistoricalFieldEvidence()`. If source data fail validation, the UI displays a loading/error state rather than inventing values.

The 2005 data are cumulative historical amounts, not a 2026 condition, annual displacement rate, engineering safety assessment, or official asset coordinates. The map is centered on the **Semarang region** for orientation only. OSM map tiles are online and credited; no exact sector geometry is shown.

A sector selection opens the actual **Assessment** in source-backed mode and passes the same sector ID. A new synthetic-risk result cannot be obtained through that navigation.

## Dedicated guide
At `?page=guide`, a single, optional 4-step interactive page teaches **lokasi → catatan → evidence gate → tindakan** using the West breakwater source example. Controls are native, keyboard-operable, and stay in one page. There is **no first-visit popup**, no localStorage "completion" and no forced tutorial.

## Visual references (patterns, not copying)
- **Linear UI refresh (March 2026):** de-emphasize chrome, keep one focal task, reduce redundant bordered panels — https://linear.app/now/behind-the-latest-design-refresh
- **Felt map UI:** centered geographic canvas, restrained legend/details and progressive tools — https://help.felt.com/getting-started/tour-the-interface
- **Vercel dashboard (Feb 2026):** primary navigation follows common workflows, secondary items are accessible but less prominent — https://vercel.com/changelog/dashboard-navigation-redesign-rollout

## Reviewer script — 20 seconds
"Di BARUNA, pilih sektor infrastruktur. West breakwater tercatat mengalami penurunan kumulatif 74–140 cm pada studi historis tahun 2005. Tetapi belum ada geometri dan pengukuran aset saat ini. Karena itu sistem meminta verifikasi dulu, lalu menyiapkan assessment brief. Data GNSS dapat diaudit terpisah."

No unsupported subsidence rate, flood forecast, asset safety, spatial risk score or InSAR result should appear in the case review. The video-only simulation route remains distinct.

## QA release gates
- Six research sectors from validated file, no fictional location markers.
- Sector click updates both home and Assessment selection.
- 4 guide stages navigate within one page, and no popup triggers automatically.
- Responsive navigation and no horizontal overflow at 390px.
- Source-backed scientific tests and video BMKG forecast smoke must remain green.
- Desktop/mobile screenshot review, plus live Vercel deployment status verified separately.
