# Pull Request Description: Studio 2.0 Innovations, Desktop Drag-to-Scroll, Modern Shaders & High-Res Pipeline

**Target Branch:** `FontWoW/FontWoW.github.io:main`  
**Source Branch:** `feat/studio-innovations-and-desktop-ux` (or `omid-io/FontWoW-2.0:main`)  
**Type of Change:** `Feature` / `Performance` / `UX/UI Enhancement` / `Refactor`

---

## 🎯 Summary & Overview

This pull request introduces **Studio 2.0 Innovations**, a comprehensive major upgrade to the FontWoW typography studio. It modernizes the editor with **14 shader-inspired visual text effects**, **inertial drag-to-scroll on desktop**, **magnetic canvas snapping guides**, **ultra-smooth 60fps bottom sheet interactions**, an **edge-to-edge native mobile layout**, and an intelligent **900px high-resolution transparent sticker export pipeline**.

All enhancements maintain 100% backward compatibility with existing saved templates, support both Persian/Arabic RTL and English/Latin LTR seamlessly, and adhere to clean modular architecture.

---

## 🎬 Studio Tour Preview

![FontWoW Studio 2.0 Showcase](https://raw.githubusercontent.com/omid-io/FontWoW.github.io/main/docs/tour-showcase.gif)

| Modern Editor & Cyber Neon | Minimalist Structured Layout | High-Res 900px Save Modal |
| :---: | :---: | :---: |
| <img src="https://raw.githubusercontent.com/omid-io/FontWoW.github.io/main/docs/screen-editor.png" width="260" alt="Editor & Neon" /> | <img src="https://raw.githubusercontent.com/omid-io/FontWoW.github.io/main/docs/screen-layout.png" width="260" alt="Layout Cards" /> | <img src="https://raw.githubusercontent.com/omid-io/FontWoW.github.io/main/docs/screen-save.png" width="260" alt="Save Modal" /> |

<div align="center">
  <img src="https://raw.githubusercontent.com/omid-io/FontWoW.github.io/main/docs/screen-wide.png" width="820" alt="Desktop Studio Experience" /><br />
  <sub><em>Desktop Studio Experience: Inertial mouse drag scrolling, vertical font size slider, and quick canvas toolbar.</em></sub>
</div>

---

## 🚀 Key Innovations & Architectural Upgrades

### 1. 🎨 14 Advanced Visual Text Effects & Dynamic Gradients
- **Shader Effects:** Added Cyber Neon, Retro Synthwave, Pop 3D, Digital Glitch, Hologram, Aurora Borealis, Imperial Gold, and Deep Ocean.
- **Dynamic Color Gradients:** 11 rich, perceptual color palettes engineered for high contrast across both dark and light backgrounds.
- **Modern Text Box Styles:** 17 glassmorphic, iOS/macOS window, code terminal, and pill styles with isolated backdrop filters.
- **Bilingual Typographic Engine:** First-class support for Persian cursive script with smart Kashida/Tatweel elongation and multi-line line-height control.

### 2. 🖱️ Desktop Inertial Drag-to-Scroll Engine
- Horizontal toolbars (Fonts, Effects, Palettes, Tabs) can now be smoothly dragged with mouse cursor on desktop just like a native touch screen.
- Built with a **zero-re-render pointer physics engine** using `requestAnimationFrame` and velocity decay.
- Intelligent 6px movement threshold prevents accidental button/item triggering while dragging.
- Smooth navigation chevrons with edge-detection fade effects.

### 3. ✋ Draggable Canvas Text & Magnetic Snap Alignment
- **Smart Separation of Behavior:** Text remains centered in standard sticker mode, but unlocks full 2D drag-and-drop freedom when background mode is activated.
- **Magnetic Alignment Guides:** Visual magenta/purple crosshair guides snap dynamically at exact 50% horizontal and vertical canvas centers.
- **Intuitive Grab Affordance:** Subtle dashed selection boundary with a floating `✥ جابجایی` (`✥ Drag to Move`) handle, automatically excluded from exported images (`.is-exporting`).
- **One-Touch Reset:** Instant vertical position presets (Top, Center, Bottom) and coordinate reset in the Layout tab.

### 4. ⚡ Ultra-Smooth 60fps Bottom Sheet & Gesture System
- Overhauled `.controls-grab-bar` interaction with calibrated spring physics (`cubic-bezier(0.2, 0.9, 0.3, 1)`).
- Eliminated micro-stuttering and redundant `ResizeObserver` re-layouts on mobile devices.
- Subtle haptic feedback (`@capacitor/haptics`) on sheet open/close and tab switches.

### 5. 🎯 Balanced 900px High-Resolution Sticker Pipeline
- Auto-crops transparent whitespace around rendered text (`trimTransparentImage`) with 3x retina oversampling.
- Normalized output resolution: stickers are automatically scaled to a balanced 900px bounding box with high-quality bicubic smoothing (`imageSmoothingQuality = 'high'`).
- Prevents extreme file sizes while ensuring crystal-clear, razor-sharp rendering on Instagram Stories, Telegram, and WhatsApp.

### 6. 📱 Edge-to-Edge Native Mobile Studio & Hardening
- **Native Layout Optimization:** The footer bar is cleanly hidden in native mobile environments (`!isNative()`), reclaiming valuable vertical canvas space.
- **Offline & Network Resilience:** Font loading timeout extended to 25s with graceful fallback fonts for intermittent mobile connections.
- **Native Android APK:** Hardware back button handling, direct GIF and WebP saving into the Android system media gallery via `FontWowNativePlugin.java`.
- **Clean Audit:** Cleaned all `npm audit` dependency advisories and resolved TDZ hoisting warnings.

---

## 🧪 Testing & Verification Matrix

- [x] **Chrome / Firefox / Edge (Desktop Windows & macOS):** Verified mouse drag-to-scroll, font slider, quick-bar, and canvas export.
- [x] **Safari (macOS & iOS):** Verified WebKit backdrop-filter glassmorphism, touch gestures, and clipboard image write.
- [x] **Android (Native Capacitor APK API 24-34):** Verified hardware back button, native gallery write, and edge-to-edge layout without footer.
- [x] **PWA / Offline Mode:** Verified service worker caching and offline typography rendering.
- [x] **RTL / LTR BiDi Tests:** Verified Persian, Arabic, and English strings with proper text alignment and directional icons.

---

## 📋 Checklist for Reviewers

- [x] Code adheres to the project's formatting and ESLint rules.
- [x] No breaking changes to existing localStorage schemes or URL hash parameters.
- [x] Performance profile audited (consistent 60fps animations, zero memory leaks).
- [x] All exported assets (PNG, WebP, SVG, GIF) verified across multiple aspect ratios.
- [x] Translations updated in `src/strings.js`.

---

<details>
<summary>🇮🇷 توضیحات و خلاصه تغییرات به زبان فارسی (Persian Summary)</summary>

### خلاصه تغییرات کلیدی FontWoW Studio 2.0:
1. **۱۴ افکت متنی و شیدرهای نوین:** سایبر نئون، سینت‌ویو، هولوگرام، گلیچ، ارورا و گرادیان‌های داینامیک با رندرینگ سریع.
2. **موتور درگ و اسکرول اینرسی با ماوس در دسکتاپ:** جابجایی روان تب‌ها، فونت‌ها و افکت‌ها روی کامپیوتر بدون نیاز به اسکرول‌بار.
3. **جابجایی آزاد متن روی بوم با راهنماهای مغناطیسی:** قابلیت درگ متن در حالت پس‌زمینه با خطوط اسنپ سنتر ۵۰٪ و نشانگر بصری جابجایی.
4. **پنل کشویی ۶۰ فریم فوق‌العاده نرم:** رفع کامل لگ و بهینه‌سازی انیمیشن باز و بسته شدن پنل تنظیمات.
5. **خط لوله بهینه استیکر شفاف با عرض ۹۰۰ پیکسل:** برش خودکار حاشیه‌های خالی و اسکیل دقیق ۹۰۰ پیکسلی برای حفظ حداکثر کیفیت در تلگرام و اینستاگرام.
6. **تجربه کاربری تمام‌صفحه در اپلیکیشن موبایل:** مخفی‌سازی هوشمند فوتر در نسخه نیتیو، پشتیبانی کامل از دکمه فیزیکی بازگشت، و ذخیره مستقیم در گالری سیستم اندروید.
</details>
