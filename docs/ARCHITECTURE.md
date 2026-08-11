# معماری FontWoW

## نمای کلی

FontWoW یک Single Page Application بدون بک‌اند است. React رابط و وضعیت ویرایشگر را مدیریت
می‌کند، Vite خروجی وب را می‌سازد و Capacitor همان خروجی را داخل برنامه Android اجرا می‌کند.

```text
User input
   ↓
React UI and editor state (`src/app/App.jsx`)
   ├── localization (`src/shared/strings.js`)
   ├── fonts/templates (`src/shared/fonts.js`, `src/shared/templates.json`)
   ├── persistence (localStorage / browser storage)
   ├── diagnostics (`src/shared/logger.js`)
   └── platform bridge (`src/shared/native.js` → Capacitor → Android plugin)
   ↓
Canvas DOM (`.stage-inner`)
   ↓ html-to-image
PNG / clipboard / native file save
```

See also [`src/README.md`](../src/README.md) for the feature-folder layout.

## لایه‌ها و مسئولیت‌ها

### رابط و دامنهٔ ویرایشگر

`src/app/App.jsx` هستهٔ فعلی برنامه است: متن، لایه‌ها، قالب، پس‌زمینه، تاریخچه، تعامل لمسی و
ذخیرهٔ طرح‌ها. `src/app/useDesignHistory.js` تاریخچهٔ طرح را جدا می‌کند و فایل‌های CSS توکن‌ها،
ریسپانسیو، RTL/LTR و انیمیشن را نگه می‌دارند.

### خروجی و اشتراک‌گذاری

`src/share/ShareKit.jsx` و `html-to-image` DOM بوم را به تصویر تبدیل می‌کنند. مرز حیاتی سیستم
`.stage-inner` است: هر چیزی داخل آن باشد می‌تواند در PNG نهایی دیده شود. کنترل‌ها و تزئینات
رابط باید sibling آن باشند، مگر عمداً بخشی از خروجی باشند.

### سازگاری پلتفرم

`src/shared/native.js` تشخیص Capacitor و fallback مرورگر را متمرکز می‌کند. عملیات ذخیره، کلیپ‌بورد
و بازکردن لینک نباید در مؤلفه‌ها با شرط‌های پراکندهٔ پلتفرم پیاده شوند. کد اختصاصی Android
در `android/app/src/main/java/ir/m4tinbeigi/fontwow/` قرار دارد.

### داده و حریم خصوصی

طرح‌ها، تنظیمات و فونت‌های سفارشی سمت کاربر باقی می‌مانند. پروژه API کاربردی یا پایگاه‌داده
ندارد. داده‌های عمومی حمایت مالی با GitHub Actions دریافت و به فایل استاتیک
`public/donations.json` تبدیل می‌شوند تا هیچ توکن سروری به مرورگر نرسد.

### بومی‌سازی

`src/shared/strings.js` منبع متن‌های رابط است. زبان انتخاب‌شده هم متن و هم جهت سند را تعیین می‌کند.
هر تغییر UI باید در فارسی و انگلیسی و در هر دو جهت RTL و LTR بررسی شود.

## ساخت و استقرار

- `npm run build` خروجی استاتیک `dist/` را تولید می‌کند.
- `.github/workflows/deploy.yml` شاخه `main` را روی GitHub Pages منتشر می‌کند.
- `.github/workflows/android.yml` نسخه را از `src/shared/updates.js` همگام، Capacitor را sync، APK را build و در GitHub Releases منتشر می‌کند.
- گردش‌کارهای امنیتی CodeQL، dependency review، npm audit و ZAP را اجرا می‌کنند.

## تصمیم‌های معماری

- **بدون بک‌اند:** کاهش هزینه و حفظ حریم خصوصی.
- **بدون UI kit:** کنترل دقیق ظاهر، RTL و حجم بسته؛ در مقابل، دسترس‌پذیری مؤلفه‌های سفارشی
  باید دستی بررسی شود.
- **یک مدل مشترک وب/Android:** بیشترین اشتراک کد؛ تفاوت‌های پلتفرم پشت bridge قرار می‌گیرند.
- **نسخه در `src/shared/updates.js`:** یک منبع مشترک برای UI، Android و انتشار.

برای قواعد تغییر کد به [AI/developer guide](AI_GUIDE.md) و برای اجرای محلی به
[DEVELOPMENT.md](DEVELOPMENT.md) مراجعه کنید.
