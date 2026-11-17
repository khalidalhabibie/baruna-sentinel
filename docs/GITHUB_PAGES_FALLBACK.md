# BARUNA Sentinel — emergency GitHub Pages release

Purpose: make the latest, tested **static** website accessible when Vercel Hobby's build-rate limit blocks production. It does not change `sentinel.ourdo.id`, its DNS, or any Vercel settings.

## One-time GitHub setup (repository owner)

1. Open [BARUNA Repository Settings → Pages](https://github.com/khalidalhabibie/baruna-sentinel/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**. Save if prompted.
3. Open [Actions → Publish BARUNA backup to GitHub Pages](https://github.com/khalidalhabibie/baruna-sentinel/actions/workflows/pages-fallback.yml).
4. Select **Run workflow → Branch: main → Run workflow**.
5. Wait for the **Publish GitHub Pages** job to succeed. Read the **deployment URL from the job summary**; do not assume the expected URL is live until it loads.
6. Inspect homepage, `proposal-demo.html`, `evidence-brief-coaster.html`, and `spatial-demo.html` on the actual published URL.

For a regular public GitHub project page, the expected default path after success is `https://khalidalhabibie.github.io/baruna-sentinel/`. This is **not** a confirmation that the URL exists.

## Why this build works

- The repository's public frontend is static; `npm run build` writes `dist/`.
- The workflow builds from the reviewed **main** branch and uploads only `dist/`.
- The critical evidence-first homepage, print-ready Coaster Brief, guided demo, GIS and GNSS modules are all in `dist/`.
- No production credentials, API keys, Vercel tokens or DNS changes are used.
- Workflow runs **manually** so it does not incur GitHub Pages failures or churn before owner setup. Running again publishes updated `main`.

## Scientific and release QA

Verify the fallback site specifically shows the evidence-first homepage and links to the Coaster Brief, not the prior Vercel version. Real cases stay `DATA_INSUFFICIENT`; BAKO QC remains clearly Cibinong, not Semarang; simulation never becomes a real asset risk assessment.

If the workflow fails with Pages not enabled / 404: complete Settings → Pages → Source = GitHub Actions before rerunning.

If production must remain on `sentinel.ourdo.id`, leave DNS untouched until you have checked and approved the fallback host. GitHub Pages is a temporary shareable alternative, not an automatic switch of the Vercel domain.

Optional later: use Cloudflare Pages with GitHub repo, build `npm run build`, output `dist`, branch `main` for alternate hosting and custom domains; do not migrate your live hostname until the alternate URL has been verified.
