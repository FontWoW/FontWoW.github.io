// فهرست فونت‌های هدف، به‌ترتیب اولویت خرید. برای افزودن یا ویرایش فونت، همین آرایه را تغییر بده.
// image: مسیر تصویر پیش‌نمایش فونت (در public/goals/ قرار داره)
// price: قیمت لایسنس نسخه‌ی نامحدود (unlimited license) به تومان — طبق fontiran.com
// raised: مبلغی که تا الان برای این فونت جمع شده (تومان)
// url: صفحه‌ی خرید فونت
export const FONT_GOALS = [
  {
    name: 'سپیدار (Sepidar)',
    image: '/goals/sepidar.svg',
    price: 6000000,
    raised: 0,
    url: 'https://fontiran.com/fonts/sepidar',
  },
  {
    name: 'طرلان (Tarlan)',
    image: '/goals/tarlan.svg',
    price: 6000000,
    raised: 0,
    url: 'https://fontiran.com/fonts/tarlan',
  },
  {
    name: 'ایران‌سنس (IranSans)',
    image: '/goals/iransans.svg',
    price: 8500000,
    raised: 0,
    url: 'https://fontiran.com/fonts/iransans',
  },
  {
    name: 'دامون (Damoon)',
    image: '/goals/damoon.svg',
    price: 7000000,
    raised: 0,
    url: 'https://fontiran.com/fonts/damoon',
  },
  {
    name: 'سمرقند (Samarqand)',
    image: '/goals/samarqand.svg',
    price: 8500000,
    raised: 0,
    url: 'https://fontiran.com/fonts/samarqand',
  },
  {
    name: 'کولاک (Colak)',
    image: '/goals/colak.svg',
    price: 8500000,
    raised: 0,
    url: 'https://fontiran.com/fonts/colak',
  },
]

export const FONTIRAN_DISCOUNT_PERCENT = 20

export function getDiscountedFontPrice(price) {
  return Math.round(price * (100 - FONTIRAN_DISCOUNT_PERCENT) / 100)
}
