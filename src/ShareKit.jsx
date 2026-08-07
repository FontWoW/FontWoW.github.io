import { useEffect, useState } from 'react'
import * as I from './icons'
import { STRINGS } from './strings'
import './ShareKit.css'

const SETTINGS_KEY = 'fontwow_app_settings_v1'

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export default function ShareKit() {
  const [appSettings] = useState(() => loadJSON(SETTINGS_KEY, { lang: 'fa', themeColor: '#00ffa3' }))
  
  const t = (key) => STRINGS[appSettings.lang][key] || key
  const isRtl = appSettings.lang === 'fa'

  useEffect(() => {
    document.body.dir = isRtl ? 'rtl' : 'ltr'
  }, [isRtl])

  return (
    <div className="sharekit-page" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--accent': appSettings.themeColor }}>
      <header className="sharekit-header">
        <a href="#/app" className="sharekit-brand">
          <I.Logo size={24} /> FontWoW
        </a>
        <a href="#/app" className="sharekit-back">
          <I.IconExternal size={16} style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} /> 
          {t('backToApp') || (isRtl ? 'بازگشت به برنامه' : 'Back to App')}
        </a>
      </header>

      <main className="sharekit-content">
        <div className="sharekit-info">
          <h1>{t('shareKitTitle') || (isRtl ? 'خلق کن، به اشتراک بگذار!' : 'Create & Share!')}</h1>
          <p>
            {t('shareKitDesc') || (isRtl 
              ? 'با FontWoW متن‌های خیره‌کننده خلق کن. ما این عکس باکیفیت رو مخصوص استوری اینستاگرام و توییت زدن آماده کردیم تا بتونی ابزاری که ازش استفاده می‌کنی رو با دوستات و بقیه طراحا به اشتراک بذاری.' 
              : 'Create stunning texts with FontWoW. We have prepared this high-quality image for your Instagram stories and tweets so you can share the tool you use with your friends and other designers.')}
          </p>

          <a href="/promo-story.jpg" download="fontwow-promo.jpg" className="sharekit-download-btn">
            <I.IconDownload size={20} />
            {t('downloadPromo') || (isRtl ? 'دانلود عکس تبلیغاتی' : 'Download Promo Image')}
          </a>

          <div className="sharekit-contact">
            <h3><I.IconSparkles size={18} /> {t('shareKitContactTitle') || (isRtl ? 'محتوایی منتشر کردی؟' : 'Published content?')}</h3>
            <p>
              {t('shareKitContactDesc') || (isRtl 
                ? 'هرکسی محتوایی با این اپلیکیشن منتشر کرد به ایمیل ریک سانچز خبر بده تا در سایت به عنوان نمونه کار درج بشه.' 
                : 'If you published any content using this app, let Rick Sanchez know via email so it can be featured on the site as a portfolio.')}
            </p>
            <a href="mailto:m4tinbeigi@gmail.com" className="sharekit-email">
              <I.IconMail size={16} /> m4tinbeigi@gmail.com
            </a>
          </div>
        </div>

        <div className="sharekit-preview">
          <div className="sharekit-preview-decoration" />
          <img 
            src="/promo-story.jpg" 
            alt="FontWoW Promo Story" 
            className="sharekit-preview-img"
          />
        </div>
      </main>
    </div>
  )
}
