// Single source of truth for the app's current version. The Android CI build
// (.github/workflows/android.yml) reads this same value to stamp
// android/app/build.gradle's versionName and the GitHub release notes, so
// bumping it here is what makes update-checkForUpdate() below detect a newer
// build once that release goes out.
export const UPDATES = [
  {
    version: '1.7.1',
    date: '2026-08-14',
    fa: {
      title: 'اولویت‌بندی کاربردمحور فونت‌ها',
      changes: [
        'ترتیب اهداف خرید با اولویت استفاده‌ی واقعی فونت‌ها در FontWoW و سپس محبوبیت عمومی و شکاف پوشش تایپوگرافی محاسبه می‌شود.',
        'نزدیک‌بودن به تکمیل حمایت فقط یک عامل اجرایی محدود است و قیمت خام یا درصد ساده‌ی تأمین مالی را به معیار اصلی تبدیل نمی‌کند.',
        'لایک‌های جامعه، فقط در صورت ثبت از یک منبع عمومی مشترک، با وزن کم در تصمیم‌گیری اثر می‌گذارند.',
        'امتیاز و عوامل مؤثر در اولویت هر فونت در لندینگ نمایش داده می‌شود.'
      ]
    },
    en: {
      title: 'Data-backed Font Prioritization',
      changes: [
        'Rank the font purchase roadmap primarily by real FontWoW usage, then by public popularity and the typography coverage gap.',
        'Keep near-complete funding as a small execution signal without turning raw price or a simple funding percentage into the main priority.',
        'Use community likes as a small signal only when they come from a shared public source.',
        'Show each font priority score and its contributing signals on the landing page.'
      ]
    }
  },
  {
    version: '1.6.0',
    date: '2026-08-11',
    fa: {
      title: 'افزودن فونت‌های فارسی جدید و پیش‌نمایش زنده',
      changes: [
        'افزودن ۱۰ فونت فارسی جدید و رایگان از گوگل‌فونتز (پرستو، روبیک عربی، ریدکس پرو، کتیبه، جمهوریا، میرزا، المسیری، لمونادا، شهرزاد جدید و هارماتان).',
        'نمایش نام و پیش‌نمایش هر فونت در بخش انتخاب فونت با خود همان فونت برای انتخاب آسان‌تر کاربران.'
      ]
    },
    en: {
      title: 'New Persian Fonts and Live Previews',
      changes: [
        'Add 10 new free Persian fonts from Google Fonts (Parastoo, Rubik Arabic, Readex Pro, Katibeh, Jomhuria, Mirza, El Messiri, Lemonada, Scheherazade New, and Harmattan).',
        'Display each font’s name and preview character in its own typeface within the font selection menu.'
      ]
    }
  },
  {
    version: '1.5.11',
    date: '2026-08-10',
    fa: {
      title: 'پایداری بیشتر بررسی آپدیت',
      changes: [
        'سخت‌گیرانه‌تر شدن تشخیص نسخه‌ی جدید تا اگر فرمت متن انتشار یا نام ریلیز تغییر کند، بررسی آپدیت از کار نیفتد.',
        'ایمن‌سازی ذخیره‌سازی نسخه‌های ردشده تا محدودیت‌های مرورگر یا WebView باعث خطا در نمایش یا رد کردن آپدیت نشوند.'
      ]
    },
    en: {
      title: 'More Reliable Update Checks',
      changes: [
        'Make update detection more tolerant so it keeps working even if the release body or release name format changes.',
        'Harden dismissed-version storage so browser or WebView storage limits do not break update prompts.'
      ]
    }
  },
  {
    version: '1.5.9',
    date: '2026-08-10',
    fa: {
      title: 'پایداری بیشتر بررسی آپدیت',
      changes: [
        'سخت‌گیرانه‌تر شدن تشخیص نسخه‌ی جدید تا اگر فرمت متن انتشار یا نام ریلیز تغییر کند، بررسی آپدیت از کار نیفتد.',
        'ایمن‌سازی ذخیره‌سازی نسخه‌های ردشده تا محدودیت‌های مرورگر یا WebView باعث خطا در نمایش یا رد کردن آپدیت نشوند.'
      ]
    },
    en: {
      title: 'More Reliable Update Checks',
      changes: [
        'Make update detection more tolerant so it keeps working even if the release body or release name format changes.',
        'Harden dismissed-version storage so browser or WebView storage limits do not break update prompts.'
      ]
    }
  },
  {
    version: '1.5.7',
    date: '2026-08-10',
    fa: {
      title: 'تفکیک آمار بازدید صفحات',
      changes: [
        'ثبت آمار بازدید هر بخش سایت به‌صورت جداگانه؛ از جمله صفحه اصلی، ویرایشگر، صفحه اشتراک‌گذاری و داشبورد آمار.',
        'تفکیک اجرای نسخه نصب‌شدهٔ اپلیکیشن از بازدید ویرایشگر در مرورگر، با حفظ حریم خصوصی کاربران.'
      ]
    },
    en: {
      title: 'Page Visit Analytics Breakdown',
      changes: [
        'Track visits for each site section separately, including the landing page, editor, sharing page, and analytics dashboard.',
        'Separate installed app launches from browser editor visits while preserving visitor privacy.'
      ]
    }
  },
  {
    version: '1.5.6',
    date: '2026-08-10',
    fa: {
      title: 'افزودن حامی رسانه‌ای جدید',
      changes: [
        'افزودن ریک سانچز به حامیان رسانه‌ای پروژه همراه با تمام پیوندهای توییتر، اینستاگرام، لینکدین و گیت‌هاب.'
      ]
    },
    en: {
      title: 'Add Rick Sanchez to Media Supporters',
      changes: [
        'Add Rick Sanchez to the media supporters list with Twitter, Instagram, LinkedIn, and GitHub links.'
      ]
    }
  },
  {
    version: '1.5.5',
    date: '2026-08-10',
    fa: {
      title: 'افزودن حامی رسانه‌ای جدید',
      changes: [
        'افزودن محمد زمانی به لیست حامیان رسانه‌ای پروژه همراه با آدرس کانال تلگرام و صفحه اینستاگرام.'
      ]
    },
    en: {
      title: 'Add Mohammad Zamani to Media Supporters',
      changes: [
        'Add Mohammad Zamani to the media supporters list with his Telegram channel and Instagram links.'
      ]
    }
  },
  {
    version: '1.5.4',
    date: '2026-08-10',
    fa: {
      title: 'افزودن حامیان رسانه‌ای جدید',
      changes: [
        'افزودن نیما اکسوی و امیر مختاری به جمع حامیان رسانه‌ای پروژه همراه با مشخصات و پیوندهای ارتباطی.',
        'پشتیبانی بخش حامیان رسانه‌ای از پلتفرم‌های لینکدین، وب‌سایت شخصی و تیک‌تاک.'
      ]
    },
    en: {
      title: 'Add New Media Supporters',
      changes: [
        'Add Nima Aksoy and Amir Mokhtari to the media supporters list with their profiles and social links.',
        'Expand the media supporters section to support LinkedIn, personal websites, and TikTok.'
      ]
    }
  },
  {
    version: '1.5.3',
    date: '2026-08-09',
    fa: {
      title: 'آمار زنده بازدیدکنندگان',
      changes: [
        'افزودن قابلیت ثبت آمار بازدید کل صفحات با سیستم حریم‌خصوصی‌محور counter.dev.',
        'نمایش کارت شکیل آمار بازدیدهای زنده در صفحه اصلی و افزودن صفحه آمار تفصیلی کل وب‌سایت.'
      ]
    },
    en: {
      title: 'Live Visitor Analytics',
      changes: [
        'Add page view analytics tracking powered by privacy-friendly counter.dev.',
        'Display a sleek live visitor count card on the landing page and add a dedicated web analytics dashboard.'
      ]
    }
  },
  {
    version: '1.5.2',
    date: '2026-08-09',
    fa: {
      title: 'بهبود پیام نصب در آیفون',
      changes: [
        'انتقال بنر راهنمای نصب وب‌اپلیکیشن در آیفون و آیپد به پایین صفحه برای جلوگیری از مسدود شدن منوی بالای ادیتور.',
        'افزودن آیکون راهنما برای دکمه‌ی اشتراک‌گذاری (Share) در پیام نصب وب‌اپلیکیشن iOS.'
      ]
    },
    en: {
      title: 'Improve iOS Installation Prompt',
      changes: [
        'Move the iOS/iPadOS installation guide banner to the bottom of the screen to prevent covering the top toolbar.',
        'Add a visual guide icon for the Share button in the iOS Web App installation prompt.'
      ]
    }
  },
  {
    version: '1.5.1',
    date: '2026-08-09',
    fa: {
      title: 'رفع مشکل بررسی بروزرسانی موبایل',
      changes: [
        'رفع مشکل عدم پیشنهاد نسخه جدید روی دستگاه‌های موبایل و فعال‌سازی بررسی خودکار در زمان هر بار راه‌اندازی برنامه.'
      ]
    },
    en: {
      title: 'Fix Mobile Update Check',
      changes: [
        'Fix issue where update prompts did not appear on mobile devices, and enable automatic update check on every app launch.'
      ]
    }
  },
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
