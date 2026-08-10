import { useEffect, useState } from 'react'
import * as I from '../shared/icons'
import { STRINGS } from '../shared/strings'
import { APP_VERSION } from '../shared/updates'
import './ShareKit.css'

const SETTINGS_KEY = 'fontwow_app_settings_v1'
const REPO = 'https://github.com/FontWoW/FontWoW.github.io'
const LATEST_RELEASE_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/releases/tags/latest'
const RELEASES_URL = `${REPO}/releases/tag/latest`

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export default function ShareKit() {
  const [appSettings] = useState(() => loadJSON(SETTINGS_KEY, { lang: 'fa', themeColor: '#00ffa3' }))
  const [activeTab, setActiveTab] = useState('story') // 'story' | 'post'
  const [toast, setToast] = useState('')
  const [apkUrl, setApkUrl] = useState(null)
  const [apkError, setApkError] = useState(false)
  const [apkVersion, setApkVersion] = useState(APP_VERSION)
  const [isDownloading, setIsDownloading] = useState(false)

  const t = (key) => STRINGS[appSettings.lang][key] || key
  const isRtl = appSettings.lang === 'fa'

  useEffect(() => {
    document.body.dir = isRtl ? 'rtl' : 'ltr'
  }, [isRtl])

  // Fetch the latest APK release from GitHub dynamically
  useEffect(() => {
    let cancelled = false
    fetch(LATEST_RELEASE_API)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch release')
        return res.json()
      })
      .then(data => {
        const asset = data.assets
          ?.filter(a => a.name.endsWith('.apk'))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        if (!cancelled) {
          if (asset) {
            setApkUrl(asset.browser_download_url)
            const match = asset.name.match(/FontWoW-v?([\d.]+)\.apk/)
            if (match) {
              setApkVersion(match[1])
            }
          }
          else setApkError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setApkError(true)
      })
    return () => { cancelled = true }
  }, [])

  const shareText = isRtl
    ? `📲 دنبال یه برنامه مثل فونتو (Fonto) یا فونت استوری (FontStory) می‌گردی که بتونی باهاش استوری‌های شیک با فونت فارسی بنویسی؟\n\nبرنامه FontWoW رو امتحان کن! کاملاً رایگان، بدون تبلیغات و بدون نیاز به نصب (تحت وب) با ده‌ها فونت جذاب فارسی:\n🔗 https://fontwow.github.io`
    : `📲 Looking for an app like Fonto or FontStory to design stories with beautiful Persian fonts?\n\nTry FontWoW! 100% free, ad-free, and web-based (no install required) with dozens of gorgeous fonts:\n🔗 https://fontwow.github.io`

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText)
      .then(() => {
        setToast(t('promoCopiedToast') || 'متن معرفی کپی شد!')
        setTimeout(() => setToast(''), 3000)
      })
      .catch(() => {
        setToast(t('copyFailed') || 'کپی ناموفق بود')
        setTimeout(() => setToast(''), 3000)
      })
  }

  // Draw overlays on top of the image in a Canvas and trigger download
  const handleDownload = () => {
    setIsDownloading(true)
    const isStory = activeTab === 'story'
    const imgUrl = isStory ? '/promo-story.jpg' : '/promo-post.jpg'
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imgUrl

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas to high-res dimensions matching the raw images
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      
      ctx.drawImage(img, 0, 0)
      
      if (isStory) {
        // --- Story (9:16, 1080x1920) Text Layout ---
        // Logo
        ctx.fillStyle = '#00ffa3'
        ctx.font = 'bold 74px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('FontWoW', canvas.width / 2, 230)
        
        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = '36px Vazirmatn, system-ui, sans-serif'
        ctx.fillText('طراحی و افکت متن فارسی تحت وب', canvas.width / 2, 300)
        
        // Title: "جایگزین فونتو و فونت استوری"
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 64px Vazirmatn, system-ui, sans-serif'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
        ctx.shadowBlur = 20
        ctx.fillText('جایگزین فونتو و فونت استوری', canvas.width / 2, 700)
        
        // Badge: "برای همیشه رایگان و بدون تبلیغات"
        const badgeText = 'برای همیشه رایگان و بدون تبلیغات'
        ctx.font = '500 36px Vazirmatn, system-ui, sans-serif'
        const badgeWidth = ctx.measureText(badgeText).width + 60
        const badgeHeight = 84
        const badgeX = (canvas.width - badgeWidth) / 2
        const badgeY = 780
        
        ctx.shadowBlur = 15
        ctx.fillStyle = 'rgba(0, 255, 163, 0.15)'
        ctx.strokeStyle = '#00ffa3'
        ctx.lineWidth = 3
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 24)
        } else {
          ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight)
        }
        ctx.fill()
        ctx.stroke()
        
        ctx.shadowBlur = 0
        ctx.fillStyle = '#00ffa3'
        ctx.fillText(badgeText, canvas.width / 2, badgeY + 56)
        
        // Features list
        const features = [
          '✦ ده‌ها فونت فارسی، عربی و انگلیسی شیک',
          '✦ استایل‌های نئون، سایه سه‌بعدی و دورخط',
          '✦ کاربری آسان چندلایه‌ای روی گوشی و سیستم',
          '✦ خروجی فوق‌العاده باکیفیت و بدون واترمارک'
        ]
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '36px Vazirmatn, system-ui, sans-serif'
        features.forEach((feat, idx) => {
          ctx.fillText(feat, canvas.width / 2, 1070 + idx * 80)
        })
        
        // Bottom Project Link
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.font = '600 40px system-ui, -apple-system, sans-serif'
        ctx.fillText('fontwow.github.io', canvas.width / 2, 1720)
      } else {
        // --- Post (1:1, 1080x1080) Text Layout ---
        // Title: "جایگزین رایگان فونتو و فونت استوری"
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 52px Vazirmatn, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
        ctx.shadowBlur = 15
        ctx.fillText('جایگزین رایگان فونتو و فونت استوری', canvas.width / 2, 270)
        
        // Badge: "برای همیشه رایگان و بدون تبلیغات"
        const badgeText = 'برای همیشه رایگان و بدون تبلیغات'
        ctx.font = '500 32px Vazirmatn, system-ui, sans-serif'
        const badgeWidth = ctx.measureText(badgeText).width + 50
        const badgeHeight = 72
        const badgeX = (canvas.width - badgeWidth) / 2
        const badgeY = 330
        
        ctx.shadowBlur = 12
        ctx.fillStyle = 'rgba(0, 255, 163, 0.12)'
        ctx.strokeStyle = '#00ffa3'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 20)
        } else {
          ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight)
        }
        ctx.fill()
        ctx.stroke()
        
        ctx.shadowBlur = 0
        ctx.fillStyle = '#00ffa3'
        ctx.fillText(badgeText, canvas.width / 2, badgeY + 48)
        
        // Features list
        const features = [
          '✓ ده‌ها فونت فارسی و چندزبانه',
          '✓ افکت نئون، سایه عمیق و لایه‌بندی',
          '✓ صددرصد رایگان، بدون تبلیغ و بدون نصب'
        ]
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.font = '32px Vazirmatn, system-ui, sans-serif'
        features.forEach((feat, idx) => {
          ctx.fillText(feat, canvas.width / 2, 700 + idx * 64)
        })
        
        // Bottom Project Link
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.font = '600 36px system-ui, -apple-system, sans-serif'
        ctx.fillText('fontwow.github.io', canvas.width / 2, 990)
      }
      
      const link = document.createElement('a')
      link.download = isStory ? 'fontwow-promo-story.jpg' : 'fontwow-promo-post.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
      setIsDownloading(false)
    }

    img.onerror = () => {
      setToast(t('imageError'))
      setTimeout(() => setToast(''), 3000)
      setIsDownloading(false)
    }
  }

  const FEATURES_LIST = isRtl ? [
    { icon: <I.IconType size={20} />, title: 'ده‌ها فونت فارسی و چندزبانه', text: 'پشتیبانی از ده‌ها فونت شیک فارسی، عربی و انگلیسی با قابلیت بارگذاری فونت دلخواه.' },
    { icon: <I.IconPalette size={20} />, title: 'استایل‌ها و افکت‌های پیشرفته', text: 'افکت نئون درخشان، سایه عمیق، دورخط، جعبه متن، رنگ‌های گرادیان و استایل‌های آماده.' },
    { icon: <I.IconGrid size={20} />, title: 'طراحی چندلایه‌ای ساده', text: 'ویرایش، جابجایی، چرخش و تنظیم آسان لایه‌های متنی و استیکرهای تصویری نامحدود.' },
    { icon: <I.IconSliders size={20} />, title: 'تنظیمات چیدمان و نسبت کادر', text: 'تغییر ابعاد بوم به استوری یا پست، تنظیم فاصله‌گذاری خطوط و حروف و حاشیه‌ها.' },
    { icon: <I.IconDownload size={20} />, title: 'خروجی فوق‌العاده باکیفیت', text: 'ذخیره در گالری با پس‌زمینه شفاف (PNG) با حداکثر کیفیت و بدون واترمارک تبلیغاتی.' }
  ] : [
    { icon: <I.IconType size={20} />, title: 'Dozens of Multilingual Fonts', text: 'Dozens of beautiful Persian, Arabic, and English fonts, plus upload your custom fonts.' },
    { icon: <I.IconPalette size={20} />, title: 'Advanced Style & Text Effects', text: 'Glowing neon, deep shadows, outlines, background boxes, gradients, and layouts.' },
    { icon: <I.IconGrid size={20} />, title: 'Simple Multi-Layer Editing', text: 'Add, rotate, scale, and manage unlimited text and sticker layers on a canvas.' },
    { icon: <I.IconSliders size={20} />, title: 'Layout & Canvas Aspect Control', text: 'Easily set aspect ratios (Story, Post, Custom), letter/line spacing, and margins.' },
    { icon: <I.IconDownload size={20} />, title: 'Watermark-Free Export', text: 'Save PNG files with transparency to your device at maximum resolution without ads.' }
  ]

  // Custom inline SVG icons for app markets
  const IconBazaar = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00C853' }}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )

  const IconMyket = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00E5FF' }}>
      <path d="M12 22l-4-4H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4l-4 4z" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  )

  const IconWebApp = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )

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

      {toast && <div className="sharekit-toast"><I.ToastCheck size={18} /> {toast}</div>}

      <main className="sharekit-content">
        {/* Left Column: Info, Copy Text, Features, and App downloads */}
        <div className="sharekit-info">
          <h1>{t('shareKitTitle')}</h1>
          <p className="sharekit-lead-desc">{t('shareKitDesc')}</p>

          {/* Copyable Share Text */}
          <div className="sharekit-card promo-copy-card">
            <h3>
              <I.IconCopy size={18} /> 
              {t('copyPromoText') || (isRtl ? 'متن آماده اشتراک‌گذاری' : 'Promo Share Text')}
            </h3>
            <div className="promo-text-container">
              <pre>{shareText}</pre>
            </div>
            <button className="promo-copy-btn" onClick={handleCopyText}>
              <I.IconCopy size={16} />
              {isRtl ? 'کپی متن معرفی' : 'Copy Message'}
            </button>
          </div>

          {/* Project Link */}
          <div className="sharekit-card project-link-card">
            <h3><I.IconGithub size={18} /> {t('projectLink') || 'لینک پروژه'}</h3>
            <p className="project-subtext">
              {isRtl 
                ? 'کد منبع این نرم‌افزار به صورت کاملاً متن‌باز (Open Source) در گیت‌هاب در دسترس است. خوشحال می‌شویم به پروژه ستاره دهید!'
                : 'This project is fully open-source on GitHub. Feel free to explore, contribute, or leave a star!'}
            </p>
            <a href={REPO} target="_blank" rel="noreferrer" className="project-github-btn">
              <I.IconGithub size={18} /> GitHub Repository <I.IconExternal size={14} />
            </a>
          </div>

          {/* Market App Downloads */}
          <div className="sharekit-card downloads-card">
            <h3>
              <I.IconDownload size={18} /> 
              {t('downloadAppTitle') || 'دانلود نرم‌افزار از سایت‌های مختلف'}
            </h3>
            <div className="downloads-grid">
              <a
                href={apkUrl || RELEASES_URL}
                target={apkError ? '_blank' : undefined}
                rel={apkError ? 'noreferrer' : undefined}
                className="market-btn apk-btn"
              >
                <I.IconDownload size={18} />
                <div className="market-btn-text">
                  <span className="market-btn-sub">{isRtl ? `دانلود نسخه اندروید (نسخه ${apkVersion})` : `Direct Download (v${apkVersion})`}</span>
                  <span className="market-btn-main">{isRtl ? 'فایل مستقیم APK' : 'APK Package'}</span>
                </div>
              </a>

              <a href="#/app" className="market-btn webapp-btn">
                <IconWebApp />
                <div className="market-btn-text">
                  <span className="market-btn-sub">{isRtl ? 'بدون نیاز به نصب' : 'Run in Browser'}</span>
                  <span className="market-btn-main">{isRtl ? 'نسخه تحت وب (PWA)' : 'PWA Web App'}</span>
                </div>
              </a>

              <div className="market-btn disabled-market-btn">
                <IconBazaar />
                <div className="market-btn-text">
                  <span className="market-btn-sub">{isRtl ? 'به‌زودی در بازار' : 'Coming soon'}</span>
                  <span className="market-btn-main">{isRtl ? 'دریافت از کافه بازار' : 'Cafe Bazaar'}</span>
                </div>
              </div>

              <div className="market-btn disabled-market-btn">
                <IconMyket />
                <div className="market-btn-text">
                  <span className="market-btn-sub">{isRtl ? 'به‌زودی در مایکت' : 'Coming soon'}</span>
                  <span className="market-btn-main">{isRtl ? 'دریافت از مایکت' : 'Myket Store'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* App Options List */}
          <div className="sharekit-card features-card">
            <h2>{t('featuresTitle') || 'امکانات نرم‌افزار'}</h2>
            <div className="features-list">
              {FEATURES_LIST.map((f, i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-icon-wrapper">{f.icon}</div>
                  <div className="feature-item-content">
                    <h4>{f.title}</h4>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Mockup Preview + Download Action */}
        <div className="sharekit-preview-section">
          {/* Tab Selector */}
          <div className="sharekit-tabs">
            <button 
              className={activeTab === 'story' ? 'active' : ''} 
              onClick={() => setActiveTab('story')}
            >
              {t('promoStoryTab') || 'استوری (۹:۱۶)'}
            </button>
            <button 
              className={activeTab === 'post' ? 'active' : ''} 
              onClick={() => setActiveTab('post')}
            >
              {t('promoPostTab') || 'پست (۱:۱)'}
            </button>
          </div>

          {/* Live Preview Card with Overlays */}
          <div className={`sharekit-preview-container ${activeTab}`}>
            <div className="sharekit-preview-decoration" />
            <img 
              src={activeTab === 'story' ? '/promo-story.jpg' : '/promo-post.jpg'} 
              alt="FontWoW Promo Graphic" 
              className="sharekit-preview-img"
            />
            
            {/* Rich CSS text overlay simulating how the output will look */}
            <div className="sharekit-overlay-text">
              {activeTab === 'story' ? (
                <>
                  <div className="overlay-logo">FontWoW</div>
                  <div className="overlay-subtitle">{isRtl ? 'طراحی و افکت متن فارسی تحت وب' : 'Persian Typography Web App'}</div>
                  <div className="overlay-title">{isRtl ? 'جایگزین فونتو و فونت استوری' : 'Alternative to Fonto/FontStory'}</div>
                  <div className="overlay-badge">{isRtl ? 'برای همیشه رایگان و بدون تبلیغات' : '100% Free & Ad-Free'}</div>
                  <div className="overlay-features">
                    <div>✦ {isRtl ? 'ده‌ها فونت فارسی، عربی و انگلیسی شیک' : 'Tens of multilingual fonts'}</div>
                    <div>✦ {isRtl ? 'استایل‌های نئون، سایه سه‌بعدی و دورخط' : 'Neon, shadows & outline effects'}</div>
                    <div>✦ {isRtl ? 'کاربری آسان چندلایه‌ای روی گوشی و سیستم' : 'Easy layering & canvas control'}</div>
                    <div>✦ {isRtl ? 'خروجی فوق‌العاده باکیفیت و بدون واترمارک' : 'Watermark-free high-res export'}</div>
                  </div>
                  <div className="overlay-url">fontwow.github.io</div>
                </>
              ) : (
                <>
                  <div className="overlay-title">{isRtl ? 'جایگزین رایگان فونتو و فونت استوری' : 'Alternative to Fonto/FontStory'}</div>
                  <div className="overlay-badge">{isRtl ? 'برای همیشه رایگان و بدون تبلیغات' : '100% Free & Ad-Free'}</div>
                  <div className="overlay-features">
                    <div>✓ {isRtl ? 'ده‌ها فونت فارسی و چندزبانه شیک' : 'Tens of multilingual fonts'}</div>
                    <div>✓ {isRtl ? 'افکت نئون، سایه عمیق و لایه‌بندی' : 'Neon, shadows & layers'}</div>
                    <div>✓ {isRtl ? 'صددرصد رایگان، بدون تبلیغ و بدون نصب' : 'Free, ad-free, web-based'}</div>
                  </div>
                  <div className="overlay-url">fontwow.github.io</div>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={handleDownload} 
            className="sharekit-download-btn"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <I.IconLoader className="spin" size={20} />
                {isRtl ? 'در حال ساخت تصویر…' : 'Generating image…'}
              </>
            ) : (
              <>
                <I.IconDownload size={20} />
                {t('downloadPromo')}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
