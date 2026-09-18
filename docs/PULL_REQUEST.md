# Pull Request: Studio 2.0 Innovations, Visual Shaders, Desktop UX & High-Res Pipeline

**Target Repository:** `FontWoW/FontWoW.github.io` (Branch: `main`)  
**Head / Source:** `omid-io:feat/studio-innovations-and-desktop-ux`  
**Type of Change:** `Feature` / `UX/UI Enhancement` / `Performance & Hardening`

---

## 🌟 Quick Overview & Live Demos for Reviewers

First off, a sincere thank you to the creator and contributors of FontWoW for building such an empowering, privacy-first Iranian typography tool.

This pull request represents **Studio 2.0 Innovations**, a major quality-of-life, architectural, and visual evolution designed to bring FontWoW to modern design standards across both desktop and mobile devices while preserving 100% backward compatibility and privacy guarantees.

To help you review and test these changes immediately without needing to clone or compile locally:

- 🌐 **Live Web Preview (Hosted on Fork):** [https://omid-io.github.io/FontWoW-2.0/](https://omid-io.github.io/FontWoW-2.0/)
- 📱 **Direct Android APK Download:** [Download FontWoW-v2.0.0.apk](https://github.com/omid-io/FontWoW-2.0/releases/download/v2.0.0/FontWoW-v2.0.0.apk) *(Release: v2.0.0 | API 24+)*

---

## 🎬 Visual Highlights: Interactive Tour & Before/After Comparison

### 1. 🔄 Before vs After Interactive Comparison Slider
A visual comparison showcasing the evolution in layout cleanliness, spacing, ergonomics, and visual hierarchy:

<div align="center">
  <img src="https://raw.githubusercontent.com/omid-io/FontWoW-2.0/main/docs/compare-slider.gif" width="400" alt="Before vs After Slider" /><br />
  <sub><em>Split-slider comparison: Left is legacy v1.x layout; Right is the refined Studio 2.0 layout.</em></sub>
</div>

<br />

### 2. ⚡ 5-Step Complete Studio Walkthrough
A tour covering core workflows: Initial Canvas ➔ Tabs (Fonts, Cyber Neon, Glass Box) ➔ Background ON/OFF ➔ Settings ➔ 900px Save Modal:

<div align="center">
  <img src="https://raw.githubusercontent.com/omid-io/FontWoW-2.0/main/docs/tour-showcase.gif" width="440" alt="FontWoW Studio 2.0 Tour" /><br />
  <sub><em>Interactive walkthrough showing smooth bottom-sheet physics, shader effects, and high-res export options.</em></sub>
</div>

---

## 🚀 Detailed Summary of Improvements

### 1. 🎨 14 Advanced Visual Text Effects & Dynamic Gradients
- **Modern Shader Presets:** Added Cyber Neon, Retro Synthwave, Pop 3D, Digital Glitch, Hologram, Aurora Borealis, Imperial Gold, and Deep Ocean.
- **Dynamic Color Palettes:** 11 perceptual color gradients engineered for high contrast across both light and dark canvas backgrounds.
- **17 Glassmorphic Text Boxes:** Crystal glass, iOS/macOS window, code terminal, and pill styles with hardware-accelerated backdrop filters.
- **Bilingual Typographic Perfection:** First-class Persian & Arabic cursive text support with smart Kashida/Tatweel elongation and multi-line line-height adjustments.

### 2. 🖱️ Desktop Drag-to-Scroll Pointer Physics Engine
- Solved the desktop UX friction where horizontal lists required horizontal trackpad scrolling.
- All horizontal toolbars (Fonts, Effects, Palettes, Tabs) can now be smoothly dragged with mouse cursor on desktop just like a touch screen.
- Built with a **zero-re-render pointer physics engine** using `requestAnimationFrame` and velocity decay.
- Intelligent 6px threshold prevents accidental clicks while dragging; navigation chevrons fade dynamically based on scroll boundaries.

### 3. ✋ Draggable Canvas Text & Magnetic Snap Alignment
- **Smart Separation of Modes:** In default sticker mode, text remains rock-solid in the center. When Background Mode is toggled on, the text becomes freely draggable anywhere across the canvas.
- **Magnetic Crosshair Guides:** Snaps dynamically to exact 50% horizontal and vertical canvas center coordinates.
- **Visual Affordance:** Subtle dashed outline with a floating `✥ جابجایی` (`✥ Drag to Move`) badge, automatically excluded during image export (`.is-exporting`).

### 4. ⚡ Ultra-Smooth 60fps Bottom Sheet
- Overhauled `.controls-grab-bar` interaction with calibrated spring physics (`cubic-bezier(0.2, 0.9, 0.3, 1)`).
- Eliminated micro-stuttering and redundant `ResizeObserver` re-layouts on low-end mobile devices.
- Added tactile haptic feedback (`@capacitor/haptics`) on sheet gestures and tab switches.

### 5. 🎯 Balanced 900px High-Resolution Transparent Sticker Pipeline
- Auto-crops transparent whitespace around rendered typography (`trimTransparentImage`) with 3x retina oversampling.
- Normalized output resolution: transparent stickers are automatically scaled to a balanced 900px bounding box with high-quality bicubic smoothing (`imageSmoothingQuality = 'high'`).
- Solves pixelation when stickers are enlarged on 1080p Instagram Stories and Telegram while keeping file sizes lightweight (~40–80 KB).

### 6. 📱 Edge-to-Edge Native Mobile Studio & Hardening
- **Reclaimed Vertical Space:** The footer is cleanly hidden in native mobile environments (`!isNative()`), granting 100% vertical canvas area to users, while remaining present on web for attribution.
- **Resilient Network Handling:** Font loading timeout extended to 25s with graceful fallback fonts for intermittent mobile networks.
- **Native Android APK:** Hardware back button handling, direct GIF and WebP saving into the Android system media gallery via `FontWowNativePlugin.java`.
- **Security & Hygiene:** Resolved all `npm audit` dependency vulnerabilities and TDZ hoisting warnings.

---

## 🧪 Testing & Verification Matrix

| Target Environment | Verification Status | Notes |
| :--- | :---: | :--- |
| **Desktop Chrome / Edge (Windows 11)** | ✅ Passed | Verified mouse drag-to-scroll, font slider, quick-bar, and canvas export. |
| **Desktop Safari (macOS Sonoma)** | ✅ Passed | Verified WebKit backdrop-filter glassmorphism and clipboard write. |
| **Mobile Chrome / Safari (Android / iOS)** | ✅ Passed | Verified touch gestures, layout adaptability, and virtual keyboard handling. |
| **Native Android APK (API 24 - 34)** | ✅ Passed | Tested hardware back button, native gallery write, and edge-to-edge layout. |
| **Offline PWA** | ✅ Passed | Service worker caching functions offline with cached fonts. |
| **RTL / LTR BiDi** | ✅ Passed | Verified English and Persian/Arabic strings with correct icon directionality. |

---

## 🤝 Note to Maintainer

All changes have been designed to be 100% additive and backward-compatible. No existing user preferences or saved designs will be lost upon upgrading.

Please feel free to review the code, test the live link or APK, and suggest any adjustments or refinements. I would be more than happy to make any changes you recommend!

---

<details>
<summary>🇮🇷 توضیحات و یادداشت به زبان فارسی (Persian Note)</summary>

با سلام و احترام خدمت سازنده محترم پروژه فونت‌واو و جامعه توسعه‌دهندگان،

این پول ریکوئست حاصل مجموعه‌ای از بازطراحی‌ها و ارتقاهای مهندسی تحت عنوان **Studio 2.0** است که با هدف ارتقای تجربه کاربری، افزایش خوانایی، اضافه کردن شیدرهای بصری نوین و بهبود تجربه استفاده روی دسکتاپ و اپلیکیشن موبایل توسعه یافته است.

تمامی تغییرات با حفظ کامل سازگاری با نسخه‌های قبلی، احترام به حریم خصوصی کاربر و بدون افزودن بار سروری طراحی شده‌اند. لینک پیش‌نمایش آنلاین وب و فایل نصب مستقیم APK در ابتدای متن قرار داده شده تا بدون نیاز به کامپایل بتوانید تغییرات را از نزدیک تست فرمایید.

باعث افتخار خواهد بود که این پول ریکوئست مورد بررسی شما قرار گیرد و در صورت نیاز به هرگونه اصلاح، ادیت یا تغییر در کدها با کمال میل در خدمت خواهم بود.
</details>
