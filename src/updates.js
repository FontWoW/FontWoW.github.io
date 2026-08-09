// Single source of truth for the app's current version. The Android CI build
// (.github/workflows/android.yml) reads this same value to stamp
// android/app/build.gradle's versionName and the GitHub release notes, so
// bumping it here is what makes update-checkForUpdate() below detect a newer
// build once that release goes out.
export const UPDATES = [
  {
    version: '1.5.0',
    date: '2026-08-09',
    fa: {
      title: 'استودیوی جادویی تایپوگرافی',
      changes: [
        'افزودن متن روی مسیر با حالت‌های قوس، موج و دایره و کنترل شدت خمیدگی.',
        'افزودن سایهٔ سه‌بعدی، ماسک تصویر داخل متن و کشیدهٔ هوشمند فارسی.',
        'افزودن چیدمان جادویی و حذف محلی پس‌زمینهٔ سادهٔ عکس‌ها و استیکرها.',
        'افزودن خروجی GIF و ویدئوی WebM با افکت‌های ورود، محوشدن، بزرگ‌نمایی و تایپ.'
      ]
    },
    en: {
      title: 'Magic Typography Studio',
      changes: [
        'Add text-on-a-path with arc, wave, and circle modes plus adjustable curvature.',
        'Add 3D long shadows, image-filled text, and smart Persian kashida.',
        'Add one-tap magic layouts and local background removal for simple sticker images.',
        'Add animated GIF and WebM video export with rise, fade, zoom, and typing effects.'
      ]
    }
  },
  {
    version: '1.4.2',
    date: '2026-08-09',
    fa: {
      title: 'تخفیف فونت‌ها با حمایت فونت‌ایران',
      changes: [
        'اعمال تخفیف ۲۰ درصدی فونت‌ایران روی قیمت تمام فونت‌های در نوبت خرید.',
        'نمایش لوگو و پیام حمایت فونت‌ایران در کنار قیمت اصلی و قیمت نهایی هر فونت.'
      ]
    },
    en: {
      title: 'Discounted Fonts with FontIran Support',
      changes: [
        'Apply FontIran’s 20% discount to every font queued for purchase.',
        'Show FontIran’s logo and support message alongside each font’s original and discounted prices.'
      ]
    }
  },
  {
    version: '1.4.1',
    date: '2026-08-09',
    fa: {
      title: 'لودینگ اختصاصی FontWoW',
      changes: [
        'افزودن تجربه شروع یکپارچه و متحرک با لوگوی FontWoW برای نسخه وب و برنامه اندروید.',
        'بهینه‌سازی حرکت‌ها برای نمایشگرهای کوچک و پشتیبانی از تنظیم کاهش حرکت دستگاه.'
      ]
    },
    en: {
      title: 'Custom FontWoW Loading Experience',
      changes: [
        'Add a unified animated startup experience with the FontWoW logo to the web and Android app.',
        'Optimize motion for small screens and respect the device reduced-motion preference.'
      ]
    }
  },
  {
    version: '1.4.0',
    date: '2026-08-09',
    fa: {
      title: 'اجرای آفلاین و کش پایدار دانلودها',
      changes: [
        'امکان اجرای نسخه وب پس از اولین بارگذاری کامل، حتی بدون اتصال اینترنت.',
        'ذخیره پایدار فونت‌های دانلودشده برای استفاده‌های بعدی بدون دانلود دوباره.',
        'به‌روزرسانی هوشمند پوسته برنامه در حالت آنلاین، بدون سنگین‌کردن مسیر خروجی‌گیری.'
      ]
    },
    en: {
      title: 'Offline Use and Persistent Download Cache',
      changes: [
        'Allow the web app to launch without an internet connection after its first complete load.',
        'Persist downloaded fonts for future use without downloading them again.',
        'Refresh the app shell intelligently while online without adding overhead to exports.'
      ]
    }
  },
  {
    version: '1.3.6',
    date: '2026-08-09',
    fa: {
      title: 'کپی آسان جزئیات خطای راه‌اندازی',
      changes: [
        'رفع خطای راه‌اندازی نسخهٔ وب که به‌دلیل نبودن آیکن‌های شبکه‌های اجتماعی در خروجی ایجاد می‌شد.',
        'نمایش جزئیات کامل‌تر خطای راه‌اندازی و کپی خودکار آن در کلیپ‌بورد با لمس یا کلیک روی متن خطا.'
      ]
    },
    en: {
      title: 'Easy Startup Error Copying',
      changes: [
        'Fix the web startup crash caused by missing social-network icon exports.',
        'Show fuller startup error details and copy them to the clipboard by tapping or clicking the error text.'
      ]
    }
  },
  {
    version: '1.3.5',
    date: '2026-08-09',
    fa: {
      title: 'بهبود کارت‌های حامیان رسانه‌ای',
      changes: [
        'یکسان‌سازی اندازه کارت‌های حامیان رسانه‌ای و متعادل‌کردن چیدمان داخلی برای حذف فضای خالی ناموزون.',
        'نمایش کوتاه‌تر و خواناتر تعداد دنبال‌کنندگان با قالب K.'
      ]
    },
    en: {
      title: 'Improved Media Supporter Cards',
      changes: [
        'Keep media supporter cards the same size and balance their internal layout to avoid uneven empty space.',
        'Show audience counts in a shorter, clearer K format.'
      ]
    }
  },
  {
    version: '1.3.4',
    date: '2026-08-09',
    fa: {
      title: 'بازگشت نام FontWoW به هدر موبایل',
      changes: [
        'نمایش دوباره نام FontWoW در کنار لوگو در هدر نسخه موبایل.',
        'بهینه‌سازی فاصله‌ها و اندازه اجزای هدر برای جلوگیری از بیرون‌زدگی در صفحه‌های کوچک.'
      ]
    },
    en: {
      title: 'Restore FontWoW Name in the Mobile Header',
      changes: [
        'Show the FontWoW name beside the logo again in the mobile header.',
        'Optimize header spacing and control sizes to prevent overflow on small screens.'
      ]
    }
  },
  {
    version: '1.3.3',
    date: '2026-08-09',
    fa: {
      title: 'رفع خطای راه‌اندازی نسخه ۱.۳.۲',
      changes: [
        'رفع خطای «Cannot access before initialization» که به‌دلیل تقسیم دستی و وابستگی دوری فایل‌های JavaScript ایجاد شده بود.',
        'واگذاری ترتیب بسته‌بندی فایل‌ها به Vite برای راه‌اندازی پایدار نسخه وب و اندروید.'
      ]
    },
    en: {
      title: 'Fix v1.3.2 Startup Error',
      changes: [
        'Fix the “Cannot access before initialization” error caused by manual chunking and circular JavaScript dependencies.',
        'Let Vite determine safe chunk boundaries for reliable web and Android startup.'
      ]
    }
  },
  {
    version: '1.3.2',
    date: '2026-08-09',
    fa: {
      title: 'رفع مشکل بارگذاری برنامه روی موبایل',
      changes: [
        'افزودن خروجی سازگار با Android 7 و iOS 12 به بالا برای جلوگیری از ماندن برنامه در صفحه بارگذاری.',
        'بازیابی خودکار فایل‌های قدیمی کش‌شده پس از انتشار نسخه جدید و نمایش خطای قابل‌فهم در صورت قطع اینترنت.',
        'ایمن‌سازی ثبت خطاهای سیستمی برای جلوگیری از بسته‌شدن برنامه هنگام دریافت خطاهای پیچیده.',
        'تغییر نام نمایشی برنامه روی گوشی‌های با زبان فارسی به «فونت واو» و روی زبان‌های انگلیسی و غیره به «FontWoW».'
      ]
    },
    en: {
      title: 'Fix Mobile App Loading',
      changes: [
        'Add compatible bundles for Android 7+ and iOS 12+ to prevent the app from getting stuck while loading.',
        'Recover automatically from stale cached chunks after deployments and show an actionable offline error.',
        'Harden system error logging so complex errors cannot crash the app.',
        'Show localized app name "فونت واو" on Persian devices and "FontWoW" on English or other devices.'
      ]
    }
  },
  {
    version: '1.3.1',
    date: '2026-08-09',
    fa: {
      title: 'نمایش نسخه اندروید در صفحه دانلود',
      changes: [
        'نمایش شماره نسخه برنامه اندروید در دکمه‌ها و لینک‌های دانلود فایل APK برای اطلاع دقیق کاربران.'
      ]
    },
    en: {
      title: 'Display Android Version on Download Page',
      changes: [
        'Show the Android app version number on download buttons and APK links to inform users.'
      ]
    }
  },
  {
    version: '1.3.0',
    date: '2026-08-09',
    fa: {
      title: 'رابط کاربری عیب‌یابی سیستم و بهینه‌سازی‌ها',
      changes: [
        'افزودن بخش عیب‌یابی و بررسی وضعیت سلامت سیستم (پوشه فونت‌ها، حافظه، شبکه و مرورگر).',
        'امکان مشاهده لاگ‌های سیستم، جستجو در آن‌ها و کپی مستقیم برای پشتیبانی.',
        'قابلیت رفع خودکار مشکلات حافظه محلی و بهینه‌سازی بارگذاری برنامه.',
        'بهبود و ثبات بیشتر در بارگذاری فونت‌ها به همراه رفع هشدارهای کارایی.'
      ]
    },
    en: {
      title: 'System Diagnostics & Optimizations',
      changes: [
        'Added a full system diagnostics panel to check storage, network, fonts, and capabilities.',
        'Support viewing, filtering, searching, and copying event logs.',
        'Auto-Fix capabilities for corrupted local storage and optimizations.',
        'Improved font loading performance and resolved reactivity warnings.'
      ]
    }
  },
  {
    version: '1.2.0',
    date: '2026-08-07',
    fa: {
      title: 'افزودن فونت‌های گوگل و سیستم کشینگ',
      changes: [
        'امکان جستجو و اضافه کردن مستقیم هزاران فونت از مخزن بزرگ Google Fonts.',
        'سیستم کشینگ هوشمند برای ذخیره فونت‌های دانلود شده تا در استفاده‌های بعدی بدون نیاز به اینترنت و به سرعت بارگذاری شوند.',
        'بهبود کارایی لود فونت‌ها و کاهش ترافیک مصرفی.'
      ]
    },
    en: {
      title: 'Google Fonts Integration & Caching',
      changes: [
        'Search and directly add thousands of fonts from the Google Fonts directory.',
        'Smart caching system to store downloaded fonts for offline use and instant loading on subsequent visits.',
        'Performance improvements and reduced data usage.'
      ]
    }
  },
  {
    version: '1.1.0',
    date: '2026-08-01',
    fa: {
      title: 'لایه‌ی عکس و استیکر',
      changes: [
        'اضافه شدن دکمه جدید برای آپلود و افزودن عکس یا استیکر دلخواه از گالری دستگاه به بوم طراحی.',
        'قابلیت جابجایی (Drag)، چرخش (Rotate) و تغییر اندازه (Scale) لایه‌های تصویری به صورت کاملاً تعاملی.',
        'امکان استفاده همزمان از چندین لایه متنی و تصویری به صورت مستقل.'
      ]
    },
    en: {
      title: 'Photo & Sticker Layers',
      changes: [
        'Added a new button to upload and add custom images or stickers from device gallery to the canvas.',
        'Fully interactive moving (Drag), rotating (Rotate), and resizing (Scale) of image layers.',
        'Support for multiple independent text and image layers on a single canvas.'
      ]
    }
  },
  {
    version: '1.0.0',
    date: '2026-07-15',
    fa: {
      title: 'نسخه اولیه FontWoW',
      changes: [
        'ابزار کامل متن‌آرایی آنلاین با ده‌ها فونت فارسی و چندزبانه پیش‌فرض.',
        'کنترل کامل روی استایل، سایه، دورخط، گرادیان، نئون، تراز، فاصله حروف و خطوط.',
        'قالب‌ها و استایل‌های آماده برای شروع سریع طراحی.',
        'خروجی PNG با کیفیت بالا، کپی در کلیپ‌بورد و ذخیره طرح‌ها در گالری برنامه.'
      ]
    },
    en: {
      title: 'FontWoW Initial Release',
      changes: [
        'Complete online typography tool with dozens of pre-installed Persian and multi-lingual fonts.',
        'Full control over styles, shadows, outlines, gradients, neon effects, alignment, and spacing.',
        'Ready-made templates and styles for quick designing.',
        'High-quality PNG export, copy to clipboard, and project saving in the local app gallery.'
      ]
    }
  }
];

export const APP_VERSION = UPDATES[0].version
