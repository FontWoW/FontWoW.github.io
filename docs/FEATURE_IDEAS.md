# FontWoW — Feature Ideas / ایده‌های قابلیت جدید

Ideas for what you can add next, based on a full pass over the current codebase (`App.jsx`, `features.js`, `fonts.js`, `ShareKit.jsx`, landing, Capacitor native layer).  
Ideas are **not** already shipped (or only partially covered). When you implement any of these, update both the app **and** `src/landing/features.js` (see `.claude/skills/sync-site-app`).

ایده‌های زیر بر اساس بررسی کل پروژه نوشته شده‌اند. چیزی که همین الان در اپ هست تکرار نشده. هر قابلیتی که پیاده کردی را در اپ **و** بخش «امکانات» لندینگ (`src/landing/features.js`) همگام کن.

---

## What you already have (baseline) / وضعیت فعلی

| Area | Already shipped |
|------|-----------------|
| Fonts | Multi-lang presets, custom upload, Google Fonts search + cache |
| Effects | Gradient, neon, arc/wave/circle, 3D long shadow, image fill, kashida |
| Boxes | Simple, solid, underline, frame, glass, note, SMS, notif, Mac, terminal, tweet |
| Canvas | Multi text/image/label layers, drag/rotate/scale, undo/redo |
| Magic | Auto layout, local sticker BG remove, entrance anim for GIF/WebM |
| Export | PNG, GIF, WebM, clipboard, in-app gallery |
| Product | FA/EN UI, theme accents, Android (Capacitor), ShareKit, donations/goals, analytics |

Only **6** built-in templates in `templates.json` — easy win to expand.

---

## Priority legend / اولویت

- **P0** — High impact, fits current architecture, relatively small  
- **P1** — Strong product value, medium effort  
- **P2** — Nice-to-have / larger scope  
- **P3** — Strategic / needs careful privacy or platform work  

---

## P0 — Quick wins / بردهای سریع

### 1. More ready-made templates / قالب‌های آماده‌ی بیشتر
Only 6 presets exist. Add 15–30 story/post packs (Nowruz, Yalda, sale, quote, Q&A, meme, product).  
فقط ۶ قالب دارید؛ پک‌های استوری/پست مناسب مناسبت‌ها و فروش خیلی کم‌هزینه و پر استفاده است.

### 2. Layers panel / پنل لایه‌ها
List all layers with rename, show/hide, lock, reorder, select. Today reorder exists but discovery is weak.  
لیست لایه‌ها با مخفی/قفل/مرتب‌سازی — برای طرح چندلایه ضروری است.

### 3. Alignment guides & snap / خطوط راهنما و چسبیدن به مرکز
Snap to center/edges + Instagram safe-zone overlay (story).  
چسبیدن به مرکز/لبه و ناحیه‌ی امن استوری اینستاگرام.

### 4. Export scale presets / کیفیت خروجی
1x / 2x / 3x PNG (and optional max dimension). Mobile stories look sharper at 2x+.  
خروجی با مقیاس ۲× و ۳× برای استوری واضح‌تر.

### 5. Favorite fonts + recent colors / فونت علاقه‌مندی و رنگ‌های اخیر
Pin fonts; keep last N custom colors. Tiny UX, daily use.  
پین کردن فونت و نگه‌داشتن رنگ‌های اخیر.

### 6. Project file import/export / خروجی/ورود فایل طرح
Download/upload a single JSON (+ embedded assets) so gallery survives browser clear / device switch — still client-side.  
فایل پروژه‌ی قابل انتقال بدون سرور؛ گالری با پاک شدن مرورگر از بین نرود.

### 7. Batch multi-ratio export / خروجی چند نسبت یکجا
One design → story 9:16 + square 1:1 + 4:5 in one tap.  
یک طرح، چند نسبت استاندارد شبکه‌های اجتماعی با یک لمس.

---

## P1 — Editor power / قدرت ادیتور

### 8. More text effects / افکت‌های متنی جدید
Glitch, chrome/metallic, emboss, soft glow (separate from neon), per-letter rainbow, strikethrough styles, double outline.  
گلیچ، کروم، برجسته، درخشش نرم، رنگین‌کمان حرف‌به‌حرف، دورخط دوتایی.

### 9. Shape layers / لایه‌ی شکل
Circles, lines, arrows, dividers, blur blobs — without leaving the editor for another app.  
دایره، خط، فلش، جداکننده — بدون خروج از ادیتور.

### 10. Built-in sticker / emoji packs / پک استیکر و ایموجی
Curated free stickers (stars, sale badges, Persian decorative marks) + emoji picker.  
استیکرهای رایگان و انتخابگر ایموجی داخل اپ.

### 11. Pattern & texture backgrounds / پس‌زمینه‌ی الگو و بافت
Dots, stripes, noise, paper, marble overlays (CSS/canvas), beyond solid/gradient/photo.  
نقطه، راه‌راه، نویز، کاغذ، بافت — علاوه‌ی رنگ و گرادیان.

### 12. Canvas zoom & pan / زوم و جابجایی بوم
Pinch-zoom + pan for precise placement on small phones.  
زوم انگشتی برای چیدمان دقیق روی موبایل.

### 13. Stronger typography controls / کنترل تایپوگرافی دقیق‌تر
Per-layer align (start/center/end/justify), flip H/V, variable font weight axis where available, OpenType ligatures toggle.  
تراز لایه، قرینه، وزن متغیر فونت، لیگچر.

### 14. Richer entrance animations / انیمیشن ورود متنوع‌تر
Bounce, slide-L/R, word-by-word, blur-in — for GIF/WebM (you already have rise/fade/zoom/type).  
بانس، اسلاید، کلمه‌به‌کلمه، بلور — برای GIF/WebM.

### 15. MP4 export / خروجی MP4
WebM is awkward for Instagram/Telegram on many phones. Client-side encode (e.g. ffmpeg.wasm or MediaRecorder H.264 where supported).  
MP4 برای اشتراک در اینستاگرام/تلگرام خیلی کاربردی‌تر از WebM است.

### 16. SVG export / خروجی SVG
Vector text+shapes for designers (Canva/Illustrator workflows). Harder with masks/photos — start with text+box+solid/gradient BG.  
خروجی برداری برای طراحان؛ از حالت متن+جعبه شروع کن.

### 17. Randomize / Surprise me / دکمه‌ی شانس
One tap: random template + palette + font combo (like magic layout, but style-focused).  
یک لمس: قالب و پالت و فونت تصادفی.

### 18. Gallery folders + search / پوشه و جستجو در گالری
Tag/folder saved designs; search by text content.  
پوشه‌بندی و جستجوی طرح‌های ذخیره‌شده.

---

## P1 — Product / i18n / platform

### 19. Arabic UI (`ar`) / رابط عربی
You already ship Arabic fonts; adding `ar` in `strings.js` + RTL is a natural expansion.  
فونت عربی هست؛ زبان رابط عربی قدم منطقی بعدی است.

### 20. Light theme / تم روشن
Accent theming exists; a true light (or high-contrast) mode helps outdoor/mobile use.  
تم روشن یا کنتراست بالا برای استفاده‌ی روز.

### 21. More font language packs / دسته‌ی فونت جدید
Turkish, Kurdish (ckb/ku), Armenian, Georgian — same pattern as `FONT_CATEGORIES`.  
ترکی، کردی، ارمنی، گرجی و مشابه.

### 22. Ship iOS build / انتشار iOS
Capacitor iOS is in dependencies; public release + TestFlight would match Android APK story.  
نسخه‌ی iOS عمومی (TestFlight/App Store) در کنار اندروید.

### 23. Keyboard shortcuts cheat sheet / راهنمای میانبرها
Undo/redo and nudge already exist — surface a `?` help sheet for desktop users.  
نمایش میانبرهای کیبورد برای دسکتاپ.

### 24. Offline readiness UX / آمادگی آفلاین واضح‌تر
Badge when fonts are cached; “download language pack” for full offline of a category.  
نشان آفلاین و دانلود پک زبان برای کار بدون اینترنت.

---

## P2 — Advanced creative tools / ابزارهای پیشرفته

### 25. Better background removal / حذف پس‌زمینه‌ی قوی‌تر
Current remover is simple/local. Optional on-device model (e.g. lightweight segmentation) still privacy-safe.  
مدل سبک روی دستگاه برای حذف بهتر پس‌زمینه‌ی استیکر.

### 26. Freehand / brush text path / مسیر دست‌نویس
Draw a path, text follows it (beyond arc/wave/circle).  
متن روی مسیر کشیده‌شده با انگشت.

### 27. Animated gradient / video background / پس‌زمینه‌ی متحرک
Looping gradient or short muted video behind text for GIF/WebM exports.  
گرادیان متحرک یا ویدئوی کوتاه پشت متن.

### 28. Design history timeline UI / تایم‌لاین تاریخچه
Visual undo stack (thumbnails), not only Ctrl+Z.  
تاریخچه‌ی بصری برگردان‌ها.

### 29. Style copy/paste between layers / کپی استایل بین لایه‌ها
Eyedropper: copy font/color/effect from layer A → B.  
کپی استایل از یک لایه به لایه‌ی دیگر.

### 30. Watermark / brand kit (optional) / واترمارک و کیت برند
Optional logo corner + saved brand colors/fonts for shop owners. Keep off by default.  
لوگوی گوشه و رنگ/فونت برند — پیش‌فرض خاموش.

### 31. Quote & caption helpers (local) / کمک متنی محلی
Built-in Persian quote packs / caption templates — no AI/server required.  
پک نقل‌قول و کپشن آماده‌ی فارسی بدون سرور.

### 32. Collage / multi-frame stories / کلاژ چندقاب
2–3 frame layouts in one export (before→after, tip cards).  
چند قاب در یک خروجی برای استوری آموزشی.

---

## P3 — Strategic (watch privacy) / استراتژیک

FontWoW’s strength is **100% client-side privacy**. Prefer features that keep that promise.

نقطه‌ی قوت پروژه حریم خصوصی کلاینت‌ساید است؛ قابلیت‌هایی که سرور لازم دارند را با احتیاط اضافه کن.

### 33. Optional AI assist (local or user-key) / دستیار هوش مصنوعی اختیاری
Caption rewrite / layout suggestion via **user-provided API key** or on-device — never a FontWoW backend that sees designs.  
فقط با کلید خود کاربر یا مدل روی دستگاه؛ نه سرور شما.

### 34. Shareable read-only links / لینک اشتراک طرح
Would need hosting of design JSON — conflicts with “no server” unless user exports file or uses third-party pastebin they control.  
با معماری بدون‌بک‌اند سخت است؛ مگر فایل یا هاست خود کاربر.

### 35. Real-time collab / همکاری همزمان
Needs backend + CRDT — usually out of scope unless product direction changes.  
نیازمند بک‌اند؛ فعلاً خارج از اسکاپ منطقی.

### 36. Plugin / community template marketplace / بازار قالب جامعه
User-submitted templates (JSON) curated in-repo or static CDN — still no private user data.  
قالب‌های ارسالی جامعه به‌صورت استاتیک/ریپو.

---

## Landing & growth (non-editor) / لندینگ و رشد

### 37. Interactive demo on landing / دموی زنده در لندینگ
~~Mini canvas on the homepage (type → see neon/gradient) before `#/app`.~~ **Done in 1.5.8** (`LandingDemo.jsx`).  
~~بوم کوچک در صفحه‌ی اصلی قبل از ورود به ادیتور.~~ **انجام شد در ۱.۵.۸**

### 38. Short tutorial / onboarding tour / تور آموزشی اول ورود
3-step coach marks: type → pick font → export.  
راهنمای ۳ مرحله‌ای برای کاربر جدید.

### 39. Before/after showcase / گالری نمونه کار
Static gallery of designs made with FontWoW (with creator credit).  
نمایش نمونه‌کارهای واقعی با اعتبار سازنده.

### 40. “Copy this design” deep links / لینک باز کردن قالب
~~`#/app?template=t3`~~ **Done in 1.5.8** (landing chips + App deep-link apply). Full design blob import still open.  
~~باز شدن مستقیم یک قالب~~ **انجام شد در ۱.۵.۸**؛ ورود کامل فایل طرح هنوز باز است.

---

## Suggested roadmap / نقشه‌ی راه پیشنهادی

| Sprint | Focus | Items |
|--------|--------|-------|
| 1 | Retention & polish | 2, 3, 5, 6, 18, 38 |
| 2 | Social export | 1, 4, 7, 14, 15 |
| 3 | Creative depth | 8, 9, 10, 11, 13 |
| 4 | Reach | 19, 20, 21, 22, 37, 40 |

---

## Implementation reminders / یادآوری پیاده‌سازی

1. **Sync site + app:** new user-facing capability → `src/app/App.jsx` (or native) **and** `src/landing/features.js`.  
2. **i18n:** every string in `src/shared/strings.js` (FA + EN; AR if you add it).  
3. **Export safety:** UI chrome must stay **outside** `.stage-inner` (see README / ARCHITECTURE).  
4. **Privacy:** prefer `localStorage` / device filesystem; no design uploads to your servers.  
5. **Changelog:** bump notes in `src/shared/updates.js` (+ `CHANGELOG.md` if you keep detail there).

---

## Good first issues for contributors / مناسب مشارکت اول

If you open GitHub issues from this list, these are good “good first issue” candidates:

برای Issue گیت‌هاب، این‌ها گزینه‌های خوب برای مشارکت‌کننده‌ی تازه‌کارند:

- Expand `templates.json` (item 1)  
- Favorite fonts (item 5)  
- Recent colors (item 5)  
- `#/app?template=` deep link (item 40)  
- Arabic UI strings (item 19)  
- Keyboard shortcuts sheet (item 23)  
- Pattern backgrounds (item 11)

---

*Generated from a project audit — Aug 2026. Revisit after major releases.*  
*تهیه‌شده از روی بررسی کدبیس — مرداد ۱۴۰۵. بعد از انتشارهای بزرگ دوباره به‌روز شود.*
