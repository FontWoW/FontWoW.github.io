// فهرست فونت‌های هدف. ترتیب نمایش با مدل src/fontRoadmap.js محاسبه می‌شود.
// image: مسیر تصویر پیش‌نمایش فونت (در public/goals/ قرار داره)
// price: قیمت لایسنس نسخه‌ی نامحدود (unlimited license) به تومان — طبق fontiran.com
// raised: مبلغی که تا الان برای این فونت جمع شده (تومان)
// inAppUsageCount: تعداد استفاده‌ی واقعی از فونت در خود FontWoW؛ تا زمان وجود snapshot معتبر null بماند.
// publicPopularityScore: امتیاز ۰ تا ۱۰۰ از منبع عمومی قابل استناد؛ در نبود داده null بماند.
// coverageGapScore: امتیاز ۰ تا ۱۰۰ برای شکاف پوشش تایپوگرافی FontWoW؛ در نبود داده null بماند.
// communityLikeCount: تعداد لایک‌های قابل‌تجمیع از منبع عمومی؛ در نبود snapshot null بماند.
// url: صفحه‌ی خرید فونت
export const FONT_GOALS = [
  {
    id: 'sepidar',
    name: 'سپیدار (Sepidar)',
    image: '/goals/sepidar.svg',
    price: 6000000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/sepidar',
  },
  {
    id: 'tarlan',
    name: 'طرلان (Tarlan)',
    image: '/goals/tarlan.svg',
    price: 6000000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/tarlan',
  },
  {
    id: 'iransans',
    name: 'ایران‌سنس (IranSans)',
    image: '/goals/iransans.svg',
    price: 8500000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/iransans',
  },
  {
    id: 'damoon',
    name: 'دامون (Damoon)',
    image: '/goals/damoon.svg',
    price: 7000000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/damoon',
  },
  {
    id: 'samarqand',
    name: 'سمرقند (Samarqand)',
    image: '/goals/samarqand.svg',
    price: 8500000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/samarqand',
  },
  {
    id: 'colak',
    name: 'کولاک (Colak)',
    image: '/goals/colak.svg',
    price: 8500000,
    raised: 0,
    inAppUsageCount: null,
    publicPopularityScore: null,
    coverageGapScore: null,
    communityLikeCount: null,
    url: 'https://fontiran.com/fonts/colak',
  },
]

export const FONTIRAN_DISCOUNT_PERCENT = 20

export function getDiscountedFontPrice(price) {
  return Math.round(price * (100 - FONTIRAN_DISCOUNT_PERCENT) / 100)
}
