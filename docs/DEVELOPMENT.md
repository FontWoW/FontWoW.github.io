# راهنمای توسعه

## پیش‌نیازها

- Node.js 20 یا جدیدتر و npm
- برای Android: JDK 21 و Android SDK سازگار با تنظیمات Gradle پروژه

## اجرای وب

```bash
npm install
npm run dev
```

Vite آدرس محلی را در ترمینال نمایش می‌دهد. برای بررسی خروجی production:

```bash
npm run build
npm run preview
```

از `npm ci` در CI یا زمانی استفاده کنید که نصب دقیق بر اساس `package-lock.json` لازم است.

## بررسی کیفیت

```bash
npm run lint
npm run build
```

پروژه فعلاً اسکریپت تست خودکار ندارد؛ [چک‌لیست تست دستی](TESTING.md) بخشی از تکمیل تغییر است.

## توسعه Android

پس از build وب یا تغییر وابستگی/تنظیمات Capacitor:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

خروجی debug در مسیر build اپ Android تولید می‌شود و نباید commit شود. فایل
`android/local.properties` مختص دستگاه توسعه‌دهنده است.

## ساختار `src/`

جزئیات پوشه‌ها در [`src/README.md`](../src/README.md) است. خلاصه:

| مسیر | نقش |
| --- | --- |
| `src/app/` | ادیتور (`#/app`) |
| `src/landing/` | لندینگ + `features.js` |
| `src/share/` | پک اشتراک‌گذاری |
| `src/stats/` | داشبورد آمار |
| `src/shared/` | فونت، رشته‌ها، native، updates، icons |

Aliasهای Vite: `@app`, `@landing`, `@share`, `@stats`, `@shared`.

## قراردادهای مهم

- متن UI فقط در `src/shared/strings.js` و هم‌زمان برای `fa` و `en` تعریف شود.
- استایل جدید از توکن‌های موجود استفاده کند و در موبایل، دسکتاپ، RTL و LTR بررسی شود.
- عملیات پلتفرمی از `src/shared/native.js` عبور کند و fallback وب داشته باشد.
- شکل داده ذخیره‌شده در `localStorage` سازگاری نسخه‌های قبل را حفظ کند.
- کنترل UI داخل `.stage-inner` قرار نگیرد، چون وارد خروجی تصویر می‌شود.
- قابلیت کاربرمحور ادیتور را هم در `src/app/` و هم در `src/landing/features.js` همگام کن.
- وابستگی، درخواست شبکه یا permission جدید باید دلیل روشن و بررسی حریم خصوصی داشته باشد.

## عیب‌یابی

- صفحه سفید پس از build: کنسول مرورگر، base path و chunkهای کش‌شده را بررسی کنید.
- تفاوت وب و Android: ابتدا `npx cap sync android` و سپس Logcat را بررسی کنید.
- مشکل خروجی PNG: DOM و استایل محاسبه‌شدهٔ `.stage-inner`، فونت‌های بارگذاری‌شده و منابع
  cross-origin را بررسی کنید.
- مشکل ذخیره محلی: quota، داده ناسازگار نسخه قبلی و حالت private مرورگر را بررسی کنید.
