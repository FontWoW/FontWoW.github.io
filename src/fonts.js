export const FONT_CATEGORIES = [
  { id: 'fa', label: 'فارسی' },
  { id: 'ar', label: 'عربی' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
  { id: 'zh', label: '中文' },
  { id: 'ru', label: 'Русский' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'th', label: 'ไทย' },
]

// google: "Family+Name:wght@weights" used to build the Google Fonts stylesheet URL for each category
export const FONTS = [
  // فارسی
  { id: 'vazirmatn', label: 'وزیرمتن', family: "'Vazirmatn', sans-serif", rtl: true, lang: 'fa', google: 'Vazirmatn:wght@400;700', license: 'OFL-1.1', creator: 'Saber Rastikerdar' },
  { id: 'estedad', label: 'استعداد', family: "'Estedad', sans-serif", rtl: true, lang: 'fa', google: 'Estedad:wght@400;700', license: 'OFL-1.1', creator: 'Amin Abedi' },
  { id: 'parastoo', label: 'پرستو', family: "'Parastoo', sans-serif", rtl: true, lang: 'fa', google: 'Parastoo:wght@400;700', license: 'OFL-1.1', creator: 'Saber Rastikerdar' },
  { id: 'lalezar', label: 'لاله‌زار', family: "'Lalezar', cursive", rtl: true, lang: 'fa', google: 'Lalezar:wght@400', license: 'OFL-1.1', creator: 'Borna Izadpanah' },
  { id: 'rubikarabic', label: 'روبیک عربی', family: "'Rubik Arabic', sans-serif", rtl: true, lang: 'fa', google: 'Rubik+Arabic:wght@400;700', license: 'OFL-1.1', creator: 'Philipp Hubert, Sebastian Fischer' },
  { id: 'readexpro', label: 'ریدکس پرو', family: "'Readex Pro', sans-serif", rtl: true, lang: 'fa', google: 'Readex+Pro:wght@400;700', license: 'OFL-1.1', creator: 'Thomas Jockin, Nadine Chahine' },
  { id: 'katibeh', label: 'کتیبه', family: "'Katibeh', cursive", rtl: true, lang: 'fa', google: 'Katibeh:wght@400', license: 'OFL-1.1', creator: 'Kief Type Foundry' },
  { id: 'jomhuria', label: 'جمهوریا', family: "'Jomhuria', serif", rtl: true, lang: 'fa', google: 'Jomhuria:wght@400', license: 'OFL-1.1', creator: 'Kief Type Foundry' },
  { id: 'mirza', label: 'میرزا', family: "'Mirza', serif", rtl: true, lang: 'fa', google: 'Mirza:wght@400;700', license: 'OFL-1.1', creator: 'KB Studio' },
  { id: 'elmessiri', label: 'المسیری', family: "'El Messiri', sans-serif", rtl: true, lang: 'fa', google: 'El+Messiri:wght@400;700', license: 'OFL-1.1', creator: 'Kief Type Foundry' },
  { id: 'lemonada', label: 'لمونادا', family: "'Lemonada', sans-serif", rtl: true, lang: 'fa', google: 'Lemonada:wght@400;700', license: 'OFL-1.1', creator: 'Mohamed Gaber' },
  { id: 'scheherazade', label: 'شهرزاد جدید', family: "'Scheherazade New', serif", rtl: true, lang: 'fa', google: 'Scheherazade+New:wght@400;700', license: 'OFL-1.1', creator: 'SIL International' },
  { id: 'harmattan', label: 'هارماتان', family: "'Harmattan', sans-serif", rtl: true, lang: 'fa', google: 'Harmattan:wght@400;700', license: 'OFL-1.1', creator: 'SIL International' },
  { id: 'amiri', label: 'امیری', family: "'Amiri', serif", rtl: true, lang: 'fa', google: 'Amiri:wght@400;700', license: 'OFL-1.1', creator: 'Khaled Hosny' },
  { id: 'naskh', label: 'نسخ', family: "'Noto Naskh Arabic', serif", rtl: true, lang: 'fa', google: 'Noto+Naskh+Arabic:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'aref', label: 'عارف', family: "'Aref Ruqaa', serif", rtl: true, lang: 'fa', google: 'Aref+Ruqaa:wght@400;700', license: 'OFL-1.1', creator: 'Khaled Hosny' },
  { id: 'reem', label: 'ریم کوفی', family: "'Reem Kufi', sans-serif", rtl: true, lang: 'fa', google: 'Reem+Kufi:wght@400;700', license: 'OFL-1.1', creator: 'Khaled Hosny' },
  { id: 'oi', label: 'Oi', family: "'Oi', cursive", rtl: true, lang: 'fa', google: 'Oi:wght@400', license: 'OFL-1.1', creator: 'Kostas Bartsokas' },
  { id: 'arad', label: 'آراد', family: "'Arad', sans-serif", rtl: true, lang: 'fa', creator: 'Mohamad Darvishi', license: 'OFL-1.1' },
  { id: 'ario', label: 'آریو', family: "'Ario', sans-serif", rtl: true, lang: 'fa', creator: 'Mohamad Darvishi', license: 'OFL-1.1' },
  { id: 'sorena', label: 'سورنا', family: "'Sorena', sans-serif", rtl: true, lang: 'fa', creator: 'Mohamad Darvishi', license: 'OFL-1.1' },
  { id: 'notokufi', label: 'نوتو کوفی', family: "'Noto Kufi Arabic', sans-serif", rtl: true, lang: 'fa', google: 'Noto+Kufi+Arabic:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'baloobhaijaan2', label: 'بالو ۲', family: "'Baloo Bhaijaan 2', cursive", rtl: true, lang: 'fa', google: 'Baloo+Bhaijaan+2:wght@500;700', license: 'OFL-1.1', creator: 'Ek Type' },
  { id: 'vibes', label: 'وایبز', family: "'Vibes', cursive", rtl: true, lang: 'fa', google: 'Vibes:wght@400', license: 'OFL-1.1', creator: 'Abdallah Aravind' },

  // عربی
  { id: 'cairo', label: 'Cairo', family: "'Cairo', sans-serif", rtl: true, lang: 'ar', google: 'Cairo:wght@400;700', license: 'OFL-1.1', creator: 'Mohamed Gaber' },
  { id: 'tajawal', label: 'Tajawal', family: "'Tajawal', sans-serif", rtl: true, lang: 'ar', google: 'Tajawal:wght@400;700', license: 'OFL-1.1', creator: 'Boutros Fonts' },
  { id: 'almarai', label: 'Almarai', family: "'Almarai', sans-serif", rtl: true, lang: 'ar', google: 'Almarai:wght@400;700', license: 'OFL-1.1', creator: 'Boutros Fonts' },
  { id: 'changa', label: 'Changa', family: "'Changa', sans-serif", rtl: true, lang: 'ar', google: 'Changa:wght@400;700', license: 'OFL-1.1', creator: 'Eduardo Tunni' },
  { id: 'markazi', label: 'Markazi Text', family: "'Markazi Text', serif", rtl: true, lang: 'ar', google: 'Markazi+Text:wght@400;700', license: 'OFL-1.1', creator: 'Borna Izadpanah' },
  { id: 'rakkas', label: 'Rakkas', family: "'Rakkas', cursive", rtl: true, lang: 'ar', google: 'Rakkas:wght@400', license: 'OFL-1.1', creator: 'Zeynep Akay' },
  { id: 'alexandria', label: 'Alexandria', family: "'Alexandria', sans-serif", rtl: true, lang: 'ar', google: 'Alexandria:wght@400;700', license: 'OFL-1.1', creator: 'Boutros Fonts' },
  { id: 'zain', label: 'Zain', family: "'Zain', sans-serif", rtl: true, lang: 'ar', google: 'Zain:wght@400;700', license: 'OFL-1.1', creator: 'Boutros Fonts' },

  // English
  { id: 'pacifico', label: 'Pacifico', family: "'Pacifico', cursive", rtl: false, lang: 'en', google: 'Pacifico:wght@400', license: 'OFL-1.1', creator: 'Vernon Adams' },
  { id: 'caveat', label: 'Caveat', family: "'Caveat', cursive", rtl: false, lang: 'en', google: 'Caveat:wght@400;700', license: 'OFL-1.1', creator: 'Impallari Type' },
  { id: 'bungee', label: 'Bungee', family: "'Bungee', cursive", rtl: false, lang: 'en', google: 'Bungee:wght@400', license: 'OFL-1.1', creator: 'David Jonathan Ross' },
  { id: 'righteous', label: 'Righteous', family: "'Righteous', cursive", rtl: false, lang: 'en', google: 'Righteous:wght@400', license: 'OFL-1.1', creator: 'Astigmatic' },
  { id: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif", rtl: false, lang: 'en', google: 'Playfair+Display:wght@400;700', license: 'OFL-1.1', creator: 'Claus Eggers Sørensen' },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", rtl: false, lang: 'en', google: 'Poppins:wght@400;700', license: 'OFL-1.1', creator: 'Indian Type Foundry' },
  { id: 'vibes', label: 'Great Vibes', family: "'Great Vibes', cursive", rtl: false, lang: 'en', google: 'Great+Vibes:wght@400', license: 'OFL-1.1', creator: 'TypeSETit' },
  { id: 'marker', label: 'Permanent Marker', family: "'Permanent Marker', cursive", rtl: false, lang: 'en', google: 'Permanent+Marker:wght@400', license: 'OFL-1.1', creator: 'Font Diner' },
  { id: 'pixel', label: 'Press Start 2P', family: "'Press Start 2P', cursive", rtl: false, lang: 'en', google: 'Press+Start+2P:wght@400', license: 'OFL-1.1', creator: 'CodeMan38' },
  { id: 'roboto', label: 'Roboto', family: "'Roboto', sans-serif", rtl: false, lang: 'en', google: 'Roboto:wght@400;700', license: 'Apache-2.0', creator: 'Christian Robertson' },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", rtl: false, lang: 'en', google: 'Montserrat:wght@400;700', license: 'OFL-1.1', creator: 'Julieta Ulanovsky' },
  { id: 'oswald', label: 'Oswald', family: "'Oswald', sans-serif", rtl: false, lang: 'en', google: 'Oswald:wght@400;700', license: 'OFL-1.1', creator: 'Vernon Adams' },
  { id: 'lobster', label: 'Lobster', family: "'Lobster', cursive", rtl: false, lang: 'en', google: 'Lobster:wght@400', license: 'OFL-1.1', creator: 'Impallari Type' },
  { id: 'anton', label: 'Anton', family: "'Anton', sans-serif", rtl: false, lang: 'en', google: 'Anton:wght@400', license: 'OFL-1.1', creator: 'Vernon Adams' },
  { id: 'bebas', label: 'Bebas Neue', family: "'Bebas Neue', cursive", rtl: false, lang: 'en', google: 'Bebas+Neue:wght@400', license: 'OFL-1.1', creator: 'Ryoichi Tsunekawa' },

  // 日本語
  { id: 'noto-jp-sans', label: 'Noto Sans JP', family: "'Noto Sans JP', sans-serif", rtl: false, lang: 'ja', google: 'Noto+Sans+JP:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'noto-jp-serif', label: 'Noto Serif JP', family: "'Noto Serif JP', serif", rtl: false, lang: 'ja', google: 'Noto+Serif+JP:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'kosugi', label: 'Kosugi Maru', family: "'Kosugi Maru', sans-serif", rtl: false, lang: 'ja', google: 'Kosugi+Maru:wght@400', license: 'OFL-1.1', creator: 'Motoya' },
  { id: 'sawarabi', label: 'Sawarabi Mincho', family: "'Sawarabi Mincho', serif", rtl: false, lang: 'ja', google: 'Sawarabi+Mincho:wght@400', license: 'OFL-1.1', creator: 'mshv' },
  { id: 'yusei', label: 'Yusei Magic', family: "'Yusei Magic', cursive", rtl: false, lang: 'ja', google: 'Yusei+Magic:wght@400', license: 'OFL-1.1', creator: 'Tanukizamurai' },
  { id: 'dela', label: 'Dela Gothic One', family: "'Dela Gothic One', cursive", rtl: false, lang: 'ja', google: 'Dela+Gothic+One:wght@400', license: 'OFL-1.1', creator: 'artakana' },

  // 한국어
  { id: 'noto-kr-sans', label: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif", rtl: false, lang: 'ko', google: 'Noto+Sans+KR:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'nanum-gothic', label: 'Nanum Gothic', family: "'Nanum Gothic', sans-serif", rtl: false, lang: 'ko', google: 'Nanum+Gothic:wght@400;700', license: 'OFL-1.1', creator: 'Sandoll' },
  { id: 'nanum-myeongjo', label: 'Nanum Myeongjo', family: "'Nanum Myeongjo', serif", rtl: false, lang: 'ko', google: 'Nanum+Myeongjo:wght@400;700', license: 'OFL-1.1', creator: 'Sandoll' },
  { id: 'do-hyeon', label: 'Do Hyeon', family: "'Do Hyeon', sans-serif", rtl: false, lang: 'ko', google: 'Do+Hyeon:wght@400', license: 'OFL-1.1', creator: 'Woowahan Brothers' },
  { id: 'black-han', label: 'Black Han Sans', family: "'Black Han Sans', sans-serif", rtl: false, lang: 'ko', google: 'Black+Han+Sans:wght@400', license: 'OFL-1.1', creator: 'Zixia' },
  { id: 'gaegu', label: 'Gaegu', family: "'Gaegu', cursive", rtl: false, lang: 'ko', google: 'Gaegu:wght@400;700', license: 'OFL-1.1', creator: 'JIKJI SOFT' },

  // 中文
  { id: 'noto-sc-sans', label: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif", rtl: false, lang: 'zh', google: 'Noto+Sans+SC:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'noto-sc-serif', label: 'Noto Serif SC', family: "'Noto Serif SC', serif", rtl: false, lang: 'zh', google: 'Noto+Serif+SC:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'zcool-xiaowei', label: 'ZCOOL XiaoWei', family: "'ZCOOL XiaoWei', serif", rtl: false, lang: 'zh', google: 'ZCOOL+XiaoWei:wght@400', license: 'OFL-1.1', creator: 'ZCOOL' },
  { id: 'zcool-kuaile', label: 'ZCOOL KuaiLe', family: "'ZCOOL KuaiLe', cursive", rtl: false, lang: 'zh', google: 'ZCOOL+KuaiLe:wght@400', license: 'OFL-1.1', creator: 'ZCOOL' },
  { id: 'long-cang', label: 'Long Cang', family: "'Long Cang', cursive", rtl: false, lang: 'zh', google: 'Long+Cang:wght@400', license: 'OFL-1.1', creator: 'Cang Yuan' },
  { id: 'ma-shan', label: 'Ma Shan Zheng', family: "'Ma Shan Zheng', cursive", rtl: false, lang: 'zh', google: 'Ma+Shan+Zheng:wght@400', license: 'OFL-1.1', creator: 'Ma Shan Zheng' },

  // Русский
  { id: 'pt-sans', label: 'PT Sans', family: "'PT Sans', sans-serif", rtl: false, lang: 'ru', google: 'PT+Sans:wght@400;700', license: 'OFL-1.1', creator: 'ParaType' },
  { id: 'rubik', label: 'Rubik', family: "'Rubik', sans-serif", rtl: false, lang: 'ru', google: 'Rubik:wght@400;700', license: 'OFL-1.1', creator: 'Philipp Hubert, Sebastian Fischer' },
  { id: 'comfortaa', label: 'Comfortaa', family: "'Comfortaa', cursive", rtl: false, lang: 'ru', google: 'Comfortaa:wght@400;700', license: 'OFL-1.1', creator: 'Johan Aakerlund' },
  { id: 'marck', label: 'Marck Script', family: "'Marck Script', cursive", rtl: false, lang: 'ru', google: 'Marck+Script:wght@400', license: 'OFL-1.1', creator: 'Denis Masharov' },
  { id: 'kurale', label: 'Kurale', family: "'Kurale', serif", rtl: false, lang: 'ru', google: 'Kurale:wght@400', license: 'OFL-1.1', creator: 'Eduardo Tunni' },
  { id: 'ruslan', label: 'Ruslan Display', family: "'Ruslan Display', cursive", rtl: false, lang: 'ru', google: 'Ruslan+Display:wght@400', license: 'OFL-1.1', creator: 'Denis Masharov' },

  // हिन्दी
  { id: 'noto-deva', label: 'Noto Sans Devanagari', family: "'Noto Sans Devanagari', sans-serif", rtl: false, lang: 'hi', google: 'Noto+Sans+Devanagari:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'hind', label: 'Hind', family: "'Hind', sans-serif", rtl: false, lang: 'hi', google: 'Hind:wght@400;700', license: 'OFL-1.1', creator: 'Indian Type Foundry' },
  { id: 'tiro-deva', label: 'Tiro Devanagari Hindi', family: "'Tiro Devanagari Hindi', serif", rtl: false, lang: 'hi', google: 'Tiro+Devanagari+Hindi:wght@400', license: 'OFL-1.1', creator: 'Tiro Typeworks' },
  { id: 'baloo2', label: 'Baloo 2', family: "'Baloo 2', cursive", rtl: false, lang: 'hi', google: 'Baloo+2:wght@400;700', license: 'OFL-1.1', creator: 'Ek Type' },
  { id: 'yatra', label: 'Yatra One', family: "'Yatra One', cursive", rtl: false, lang: 'hi', google: 'Yatra+One:wght@400', license: 'OFL-1.1', creator: 'Ebenezer Sunder Singh' },
  { id: 'kalam', label: 'Kalam', family: "'Kalam', cursive", rtl: false, lang: 'hi', google: 'Kalam:wght@400;700', license: 'OFL-1.1', creator: 'Indian Type Foundry' },

  // ไทย
  { id: 'noto-thai', label: 'Noto Sans Thai', family: "'Noto Sans Thai', sans-serif", rtl: false, lang: 'th', google: 'Noto+Sans+Thai:wght@400;700', license: 'OFL-1.1', creator: 'Google' },
  { id: 'kanit', label: 'Kanit', family: "'Kanit', sans-serif", rtl: false, lang: 'th', google: 'Kanit:wght@400;700', license: 'OFL-1.1', creator: 'Cadson Demak' },
  { id: 'mitr', label: 'Mitr', family: "'Mitr', sans-serif", rtl: false, lang: 'th', google: 'Mitr:wght@400;700', license: 'OFL-1.1', creator: 'Cadson Demak' },
  { id: 'prompt', label: 'Prompt', family: "'Prompt', sans-serif", rtl: false, lang: 'th', google: 'Prompt:wght@400;700', license: 'OFL-1.1', creator: 'Cadson Demak' },
  { id: 'pattaya', label: 'Pattaya', family: "'Pattaya', sans-serif", rtl: false, lang: 'th', google: 'Pattaya:wght@400', license: 'OFL-1.1', creator: 'Cadson Demak' },
  { id: 'sriracha', label: 'Sriracha', family: "'Sriracha', cursive", rtl: false, lang: 'th', google: 'Sriracha:wght@400', license: 'OFL-1.1', creator: 'Cadson Demak' },
]

// builds a single Google Fonts stylesheet URL that loads every font belonging to a category
export function googleFontsUrlFor(categoryId) {
  const families = FONTS.filter(f => f.lang === categoryId).map(f => `family=${f.google}`)
  if (!families.length) return null
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

// builds a Google Fonts stylesheet URL for a single font, used to fetch it on demand
export function googleFontsUrlForFont(font) {
  if (!font?.google) return null
  return `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
}

export const FONT_LICENSE_URLS = {
  'OFL-1.1': 'https://openfontlicense.org/',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
}

// all fonts in FONTS are hosted by Google Fonts under their respective open licenses;
// this points to the attribution/license page for a given font
export function fontAttributionUrlFor(font) {
  if (!font?.google) return null
  const family = font.google.split(':')[0]
  return `https://fonts.google.com/specimen/${family}/about`
}

export const BACKGROUNDS = [
  { id: 'none', label: 'بدون پس‌زمینه', css: 'transparent' },
  { id: 'solid-1', label: 'قرمز', css: '#c0392b' },
  { id: 'solid-2', label: 'مشکی', css: '#111111' },
  { id: 'solid-3', label: 'سفید', css: '#ffffff' },
  { id: 'grad-1', label: 'گرادیان قرمز', css: 'linear-gradient(135deg,#ff5f6d,#8b0000)' },
  { id: 'grad-2', label: 'گرادیان بنفش', css: 'linear-gradient(135deg,#8e2de2,#4a00e0)' },
  { id: 'grad-3', label: 'گرادیان آبی', css: 'linear-gradient(135deg,#2193b0,#6dd5ed)' },
  { id: 'grad-4', label: 'گرادیان طلایی', css: 'linear-gradient(135deg,#f7971e,#ffd200)' },
  { id: 'grad-5', label: 'گرادیان سبز', css: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  { id: 'grad-6', label: 'شب', css: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
]

export const BG_CATEGORIES = [
  { id: 'colors', label: 'رنگ‌ها' },
  { id: 'questions', label: 'سوالات' },
  { id: 'post', label: 'پست جدید' },
  { id: 'work', label: 'کار' },
  { id: 'fantasy', label: 'فانتزی' },
]

export const BG_TEMPLATES = {
  questions: [
    { id: 'q1', label: 'سوال آبی', css: 'linear-gradient(160deg,#1e3c72,#2a5298)' },
    { id: 'q2', label: 'سوال بنفش', css: 'linear-gradient(160deg,#654ea3,#eaafc8)' },
    { id: 'q3', label: 'سوال قرمز', css: 'linear-gradient(160deg,#cb2d3e,#ef473a)' },
    { id: 'q4', label: 'سوال صورتی', css: 'linear-gradient(160deg,#ee9ca7,#ffdde1)' },
  ],
  post: [
    { id: 'p1', label: 'پست تیره', css: 'linear-gradient(160deg,#0f2027,#203a43,#2c5364)' },
    { id: 'p2', label: 'پست طلایی', css: 'linear-gradient(160deg,#bf953f,#fcf6ba,#b38728)' },
    { id: 'p3', label: 'پست سرمه‌ای', css: 'linear-gradient(160deg,#141e30,#243b55)' },
    { id: 'p4', label: 'پست بنفش', css: 'linear-gradient(160deg,#42275a,#734b6d)' },
  ],
  work: [
    { id: 'w1', label: 'کار آبی', css: 'linear-gradient(160deg,#2193b0,#6dd5ed)' },
    { id: 'w2', label: 'کار زرد', css: 'linear-gradient(160deg,#f7971e,#ffd200)' },
    { id: 'w3', label: 'کار خاکستری', css: 'linear-gradient(160deg,#485563,#29323c)' },
    { id: 'w4', label: 'کار سبز', css: 'linear-gradient(160deg,#0f9b8e,#134e5e)' },
  ],
  fantasy: [
    { id: 'f1', label: 'فانتزی صورتی', css: 'linear-gradient(160deg,#ff9a9e,#fecfef)' },
    { id: 'f2', label: 'فانتزی کهکشانی', css: 'linear-gradient(160deg,#360033,#0b8793)' },
    { id: 'f3', label: 'فانتزی جادویی', css: 'linear-gradient(160deg,#134e5e,#71b280)' },
    { id: 'f4', label: 'فانتزی شفق', css: 'linear-gradient(160deg,#1a2980,#26d0ce)' },
  ],
}

export const ALL_BACKGROUNDS = [...BACKGROUNDS, ...Object.values(BG_TEMPLATES).flat()]

export const TEXT_BOX_STYLES = [
  { id: 'none', label: 'ساده' },
  { id: 'box', label: 'جعبه رنگی' },
  { id: 'quote', label: 'نقل‌قول' },
  { id: 'underline', label: 'زیرخط ضخیم' },
  { id: 'frame', label: 'قاب' },
  { id: 'glass', label: 'شیشه‌ای' },
  { id: 'note', label: 'نوت آیفون' },
  { id: 'sms', label: 'پیامک' },
  { id: 'notif', label: 'نوتیفیکیشن' },
  { id: 'mac', label: 'پنجره مک' },
  { id: 'terminal', label: 'ترمینال' },
  { id: 'tweet', label: 'توییت' },
]

export const TEXT_COLORS = [
  '#ffffff', '#111111', '#ffd54f', '#ff6b6b', '#4dd0e1',
  '#81c784', '#ba68c8', '#ffb74d', '#f06292', '#90a4ae',
]

export const THEME_COLORS = [
  '#8b5cf6', '#f43f5e', '#f97316', '#eab308', '#10b981', '#0ea5e9', '#ec4899', '#ff5c5c',
]

export const TEXT_EFFECTS = [
  { id: 'none', label: 'بدون افکت' },
  { id: 'gradient', label: 'گرادیان' },
  { id: 'neon', label: 'نئون' },
]

export const TEXT_GRADIENTS = [
  { id: 'g1', label: 'طلایی', css: 'linear-gradient(90deg,#f7971e,#ffd200)' },
  { id: 'g2', label: 'صورتی', css: 'linear-gradient(90deg,#ff5f6d,#ffc371)' },
  { id: 'g3', label: 'بنفش', css: 'linear-gradient(90deg,#8e2de2,#4a00e0)' },
  { id: 'g4', label: 'آبی', css: 'linear-gradient(90deg,#00c6ff,#0072ff)' },
  { id: 'g5', label: 'سبز', css: 'linear-gradient(90deg,#11998e,#38ef7d)' },
  { id: 'g6', label: 'رنگین‌کمان', css: 'linear-gradient(90deg,#ff0000,#ff9900,#33cc33,#0066ff,#9900cc)' },
]

export const ASPECT_RATIOS = [
  { id: 'free', label: 'آزاد', value: null },
  { id: 'story', label: 'استوری ۹:۱۶', value: '9 / 16' },
  { id: 'square', label: 'مربعی ۱:۱', value: '1 / 1' },
  { id: 'portrait', label: 'پست عمودی ۴:۵', value: '4 / 5' },
  { id: 'carousel', label: 'کاروسل ۳:۴', value: '3 / 4' },
  { id: 'landscape', label: 'لندسکیپ ۱۶:۹', value: '16 / 9' },
  { id: 'banner', label: 'بنر ۳:۱', value: '3 / 1' },
]

// designer-editable styles: edit templates.json directly, or use the in-app "Style Studio"
// (Templates tab -> add) to preview a style live and copy its JSON to paste in there.
import templatesData from './templates.json'
export const TEMPLATES = templatesData
