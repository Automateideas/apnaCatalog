# TODO

## Photos: Cloudflare R2 (code done, 2026-11-18)

- [ ] Dashboard se ek item mein photo daal kar save karo, phir shop page par dekho ki photo dikh rahi hai (login wala flow abhi test nahi hua).
- [ ] Vercel → Settings → Environment Variables mein ye 6 daalo, phir redeploy:
      `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_MEDIA_BASE_URL`
- [ ] Domain lene ke baad:
  - [ ] R2 bucket par apna photo domain jodo (jaise `img.apnacatalog.in`), aur `NEXT_PUBLIC_MEDIA_BASE_URL` badlo.
  - [ ] R2 CORS policy mein naya site domain jodo (`AllowedOrigins`).
  - [ ] Cloudflare Cache Rule: photos ko 1 saal cache karo.
  - [ ] r2.dev public link band kar do (sirf testing ke liye tha).
- [ ] `.env.local.bak-r2` (purana backup) delete kar do jab sab theek chale.

## Launch se pehle

- [ ] Domain lo (QR print hone se pehle), DNS Cloudflare par.
- [ ] Saara kaam GitHub par push karo; Vercel env mein `NEXT_PUBLIC_MAPBOX_TOKEN` bhi daalo.
- [ ] Google OAuth consent screen ko "In production" karo, privacy aur terms links ke saath.
- [ ] Supabase → Auth → URL Configuration: Site URL aur Redirect URLs (Vercel + `http://localhost:3210/**`).
- [ ] Mapbox token par URL restriction lagao.
- [ ] `.env.local` aur Vercel mein `GRIEVANCE_OFFICER_NAME` aur `GRIEVANCE_EMAIL` bharo.
- [ ] Phone par poora flow test: signup → shop → items → photos → theme → share → WhatsApp order → doori.
- [ ] Ek area mein 15-20 shops jodo, phir customers ko promote karo.
- [ ] Google Search Console mein site jodo aur `sitemap.xml` submit karo.

## Baad mein

- [ ] Paid shops aane par: hosting ka plan socho (Vercel Hobby sirf non-commercial use ke liye hai).
- [ ] Promo video: `media/promo` mein bani hai; music jodna aur `npm run render` se MP4 banana.
