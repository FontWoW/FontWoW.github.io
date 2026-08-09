// Canonical registry of FontWoW's user-facing capabilities.
//
// This is the single source of truth for what the app can do. Landing.jsx renders it as the
// marketing "امکانات" section. Every entry must correspond to something real in App.jsx (or the
// native layer) — do not add an entry here without shipping the capability, and do not ship a new
// capability without adding/updating an entry here. See .claude/skills/sync-site-app/SKILL.md.
//
// iconName references an export from ./icons (e.g. 'IconType' -> I.IconType).
export const FEATURES = [
  { iconName: 'IconType', title: 'ده‌ها فونت چندزبانه', text: 'فارسی، عربی، انگلیسی، ژاپنی، کره‌ای، چینی، روسی، هندی و بیشتر — به‌علاوه‌ی آپلود فونت دلخواه خودت.' },
  { iconName: 'IconPalette', title: 'استایل و افکت متن', text: 'متن قوسی، موجی و دایره‌ای، سایهٔ سه‌بعدی، ماسک تصویر، کشیده، گرادیان و نئون.' },
  { iconName: 'IconGrid', title: 'قالب‌های آماده', text: 'ترکیب‌های آماده‌ی فونت + رنگ + جعبه + پس‌زمینه + افکت برای شروع سریع.' },
  { iconName: 'IconImages', title: 'چند لایه‌ی متن', text: 'افزودن، جابجایی، چرخش و ویرایش چند لایه‌ی متن مستقل روی یک بوم.' },
  { iconName: 'IconSliders', title: 'کنترل کامل چیدمان', text: 'اندازه‌ی فونت، فاصله‌ی حروف و خطوط، چیدمان و نسبت ابعاد خروجی.' },
  { iconName: 'IconSparkles', title: 'ابزارهای جادویی', text: 'چیدمان خودکار، حذف محلی پس‌زمینهٔ استیکر و کنترل هوشمند کشیدهٔ فارسی.' },
  { iconName: 'IconDownload', title: 'خروجی و ذخیره', text: 'خروجی PNG، GIF و ویدئوی متحرک، کپی در کلیپ‌بورد، و ذخیرهٔ طرح‌ها در گالری برنامه.' },
]
