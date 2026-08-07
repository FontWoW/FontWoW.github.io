import { useEffect, useState } from 'react'
import * as I from './icons'
import './Landing.css'

const REPO = 'https://github.com/FontWoW/FontWoW.github.io'
const CONTRIBUTORS_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/contributors'
const LATEST_RELEASE_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/releases/tags/latest'
const RELEASES_URL = `${REPO}/releases/tag/latest`
const APP_URL = '#/app'

function detectPlatform() {
  const ua = navigator.userAgent || ''
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  if (isStandalone) return null
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return null
}

const FEATURES = [
  { icon: I.IconType, title: 'ده‌ها فونت چندزبانه', text: 'فارسی، عربی، انگلیسی، ژاپنی، کره‌ای، چینی، روسی، هندی و بیشتر — به‌علاوه‌ی آپلود فونت دلخواه خودت.' },
  { icon: I.IconPalette, title: 'استایل و افکت متن', text: 'بولد، ایتالیک، زیرخط، سایه، دورخط، گرادیان، نئون و جعبه‌های متن آماده.' },
  { icon: I.IconGrid, title: 'قالب‌های آماده', text: 'ترکیب‌های آماده‌ی فونت + رنگ + جعبه + پس‌زمینه + افکت برای شروع سریع.' },
  { icon: I.IconImages, title: 'چند لایه‌ی متن', text: 'افزودن، جابجایی، چرخش و ویرایش چند لایه‌ی متن مستقل روی یک بوم.' },
  { icon: I.IconSliders, title: 'کنترل کامل چیدمان', text: 'اندازه‌ی فونت، فاصله‌ی حروف و خطوط، چیدمان و نسبت ابعاد خروجی.' },
  { icon: I.IconDownload, title: 'خروجی و ذخیره', text: 'خروجی PNG با کیفیت بالا، کپی در کلیپ‌بورد، و ذخیره‌ی طرح‌ها در گالری برنامه.' },
]

export default function Landing() {
  const [contributors, setContributors] = useState(null)
  const [contributorsError, setContributorsError] = useState(false)
  const [apkUrl, setApkUrl] = useState(null)
  const [apkError, setApkError] = useState(false)
  const [platform] = useState(detectPlatform)

  useEffect(() => {
    let cancelled = false
    fetch(CONTRIBUTORS_API)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(data => {
        if (!cancelled) setContributors(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setContributorsError(true)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(LATEST_RELEASE_API)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(data => {
        const asset = data.assets?.find(a => a.name.endsWith('.apk'))
        if (!cancelled) {
          if (asset) setApkUrl(asset.browser_download_url)
          else setApkError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setApkError(true)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="landing" dir="rtl">
      <header className="landing-hero">
        <img src="/favicon.svg" width="64" height="64" alt="FontWoW" className="landing-logo" />
        <h1>FontWoW</h1>
        <p className="landing-tagline">متن‌آرایی آنلاین — بنویس، استایل بده، عکس بگیر ⚡</p>
        <div className="landing-cta">
          <a className="landing-btn landing-btn-primary" href={APP_URL}>
            <I.IconExternal size={16} />
            اجرای برنامه در مرورگر
          </a>
          <a
            className={`landing-btn landing-btn-secondary${!apkUrl ? ' disabled' : ''}`}
            href={apkUrl || RELEASES_URL}
            target={apkError ? '_blank' : undefined}
            rel={apkError ? 'noreferrer' : undefined}
          >
            <I.IconDownload size={16} />
            {apkUrl ? 'دانلود نسخه‌ی اندروید (APK)' : apkError ? 'مشاهده‌ی نسخه‌ها در گیت‌هاب' : 'در حال یافتن آخرین نسخه…'}
          </a>
        </div>
        <p className="landing-note">
          بدون نصب، بدون حساب کاربری، کاملاً رایگان و client-side — هیچ داده‌ای به سرور فرستاده نمی‌شود.
          نسخه‌ی اندروید فعلاً یک build آزمایشی (debug) است؛ ممکن است هنگام نصب هشدار «منبع ناشناس» ببینید.
        </p>
      </header>

      {platform === 'android' && (
        <div className="landing-platform-banner">
          <I.IconDownload size={18} />
          <span>روی اندروید هستی؟ برای تجربه‌ی بهتر و سریع‌تر، نسخه‌ی اپلیکیشن اندروید رو نصب کن.</span>
          <a
            className="landing-btn landing-btn-primary landing-btn-sm"
            href={apkUrl || RELEASES_URL}
            target={apkError ? '_blank' : undefined}
            rel={apkError ? 'noreferrer' : undefined}
          >
            دانلود اپ اندروید
          </a>
        </div>
      )}
      {platform === 'ios' && (
        <div className="landing-platform-banner">
          <I.IconExternal size={18} />
          <span>
            روی آیفون هستی؟ FontWoW رو به‌عنوان اپ نصب کن: دکمه‌ی Share را بزن و «Add to Home Screen» را انتخاب کن.
          </span>
        </div>
      )}

      <section className="landing-screens">
        <img src="/docs/screen-editor.png" alt="ادیتور FontWoW" />
        <img src="/docs/screen-layout.png" alt="تنظیمات چیدمان FontWoW" />
        <img src="/docs/screen-save.png" alt="ذخیره و خروجی FontWoW" />
      </section>

      <section className="landing-features">
        <h2>امکانات</h2>
        <div className="landing-grid">
          {FEATURES.map((f, i) => (
            <div className="landing-card" key={i}>
              <div className="landing-card-icon"><f.icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-contributors">
        <h2>مشارکت‌کنندگان</h2>
        {contributorsError && (
          <p className="landing-contributors-fallback">
            فهرست مشارکت‌کنندگان فعلاً در دسترس نیست — <a href={`${REPO}/graphs/contributors`} target="_blank" rel="noreferrer">مشاهده در گیت‌هاب</a>
          </p>
        )}
        {!contributorsError && !contributors && <p className="landing-contributors-loading">در حال بارگذاری…</p>}
        {contributors && contributors.length > 0 && (
          <div className="landing-contributors-grid">
            {contributors.map(c => (
              <a
                key={c.id}
                className="landing-contributor"
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
              >
                <img src={c.avatar_url} alt={c.login} width="56" height="56" loading="lazy" />
                <span>{c.login}</span>
                <small>{c.contributions} کامیت</small>
              </a>
            ))}
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <a href={REPO} target="_blank" rel="noreferrer">
          <I.IconGithub size={16} /> کد متن‌باز در گیت‌هاب <I.IconExternal size={11} />
        </a>
        <a href="https://fonts.google.com/attribution" target="_blank" rel="noreferrer">
          فونت‌ها از Google Fonts، با لایسنس متن‌باز (عمدتاً SIL OFL) <I.IconExternal size={11} />
        </a>
        <a href="#/share">
          پک رسانه‌ای و اشتراک‌گذاری
        </a>
        <a href={APP_URL}>بازگشت به برنامه</a>
      </footer>
    </div>
  )
}
