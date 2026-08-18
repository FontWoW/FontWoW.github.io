import { useEffect, useState } from 'react'
import * as I from './icons'
import { FEATURES } from './features'
import { APP_VERSION } from './updates'
import MediaSupporters from './MediaSupporters'
import FontGoals from './FontGoals'
import { FONT_GOALS, getDiscountedFontPrice } from './goals'
import { STRINGS } from './strings'
import './Landing.css'

const REPO = 'https://github.com/FontWoW/FontWoW.github.io'
const REPO_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io'
const CONTRIBUTORS_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/contributors'
const LATEST_RELEASE_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/releases/tags/latest'
const RELEASES_URL = `${REPO}/releases/tag/latest`
const APP_URL = '#/app'
const CRYPTO_DONATE_URL = 'https://pay.oxapay.com/15417059'
const TOMAN_DONATE_URL = 'https://daramet.com/fontwow'
const COFFEE_DAY_COST_TOMAN = 200000
const CAFE_SPONSOR_EXAMPLE_COFFEES = 10
const PAID_APP_MONTHLY_BENCHMARK_TOMAN = 400000
const PAID_APP_DAILY_BENCHMARK_TOMAN = Math.round(PAID_APP_MONTHLY_BENCHMARK_TOMAN / 30)
const CAFE_SPONSOR_CONTACT_URL = `mailto:m4tinbeigi@gmail.com?subject=${encodeURIComponent('پیشنهاد اسپانسری کافه برای FontWoW')}&body=${encodeURIComponent('نام کافه:\nشهر:\nتعداد قهوه‌ای که اسپانسر می‌کنید:\nلینک لوگو یا صفحه‌ی کافه:')}`
const TOTAL_FONT_LICENSE_COST_TOMAN = FONT_GOALS.reduce(
  (sum, goal) => sum + getDiscountedFontPrice(goal.price),
  0,
)

function formatToman(value) {
  return `${Math.round(value).toLocaleString('fa-IR')} تومان`
}

function formatDonationDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function normalizeDonationSummary(data, list) {
  const fallbackTotal = list.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0)
  const fallbackCount = list.length
  return {
    totalAmount: Number(data?.totalAmount) >= 0 ? Number(data.totalAmount) : fallbackTotal,
    donationCount: Number(data?.donationCount) >= 0 ? Number(data.donationCount) : fallbackCount,
    supporterCount: Number(data?.supporterCount) >= 0 ? Number(data.supporterCount) : fallbackCount,
    supporterCountMode: data?.supporterCountMode || 'donations',
    updatedAt: data?.updatedAt || null,
  }
}

function detectPlatform() {
  const ua = navigator.userAgent || ''
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  if (isStandalone) return null
  if (/android/i.test(ua)) return 'android'
  const isIOS = /iphone|ipad|ipod/i.test(ua) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  return null
}

export default function Landing() {
  const [contributors, setContributors] = useState(null)
  const [contributorsError, setContributorsError] = useState(false)
  const [apkUrl, setApkUrl] = useState(null)
  const [apkError, setApkError] = useState(false)
  const [apkVersion, setApkVersion] = useState(APP_VERSION)
  const [platform] = useState(detectPlatform)
  const [donations, setDonations] = useState(null)
  const [donationsError, setDonationsError] = useState(false)
  const [donationSummary, setDonationSummary] = useState(null)
  const [repoStats, setRepoStats] = useState(null)
  const [visitorCount, setVisitorCount] = useState(null)
  const [visitorCountLoading, setVisitorCountLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const isVisited = sessionStorage.getItem('fontwow_visited')
    const url = isVisited 
      ? 'https://countapi.mileshilliard.com/api/v1/get/fontwow_visits'
      : 'https://countapi.mileshilliard.com/api/v1/hit/fontwow_visits'

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(data => {
        if (!cancelled && data && typeof data.value === 'number') {
          setVisitorCount(data.value)
          setVisitorCountLoading(false)
          if (!isVisited) {
            sessionStorage.setItem('fontwow_visited', 'true')
          }
        }
      })
      .catch(() => {
        if (!cancelled) setVisitorCountLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(REPO_API)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(data => {
        if (!cancelled) {
          setRepoStats({
            stars: Number(data.stargazers_count) || 0,
            forks: Number(data.forks_count) || 0,
          })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(CONTRIBUTORS_API)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(data => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : []
          setContributors(list.filter(c => c.login !== 'github-actions[bot]' && c.login !== 'github-actions'))
        }
      })
      .catch(() => {
        if (!cancelled) setContributorsError(true)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadDonations = async () => {
      try {
        const res = await fetch(`/donations.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        const list = Array.isArray(data.donations) ? data.donations : []
        if (!cancelled) {
          setDonations(list)
          setDonationSummary(normalizeDonationSummary(data, list))
          setDonationsError(false)
        }
      } catch {
        if (!cancelled) setDonationsError(true)
      }
    }

    loadDonations()
    const refreshTimer = window.setInterval(loadDonations, 15 * 60 * 1000)
    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(LATEST_RELEASE_API)
      .then(res => {
        if (!res.ok) throw new Error('bad response')
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

  const totalDonations = donationSummary?.totalAmount ?? 0
  const supporterCount = donationSummary?.supporterCount ?? 0
  const averageDonation = supporterCount > 0 ? totalDonations / supporterCount : 0
  const estimatedCollectiveValue = visitorCount !== null
    ? visitorCount * PAID_APP_DAILY_BENCHMARK_TOMAN
    : null
  const fundedCoffeeDays = totalDonations / COFFEE_DAY_COST_TOMAN
  const remainingFontCost = Math.max(TOTAL_FONT_LICENSE_COST_TOMAN - totalDonations, 0)
  const remainingCoffeeDays = Math.ceil(remainingFontCost / COFFEE_DAY_COST_TOMAN)
  const fundingPercent = Math.min(100, (totalDonations / TOTAL_FONT_LICENSE_COST_TOMAN) * 100)
  const supportUnitLabel = donationSummary?.supporterCountMode === 'unique-donors' ? 'حامی' : 'حمایت'

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
            {apkUrl ? `دانلود نسخه‌ی اندروید (نسخه ${apkVersion})` : apkError ? 'مشاهده‌ی نسخه‌ها در گیت‌هاب' : 'در حال یافتن آخرین نسخه…'}
          </a>
        </div>
        <p className="landing-note">
          بدون نصب، بدون حساب کاربری، کاملاً رایگان و client-side — هیچ داده‌ای به سرور فرستاده نمی‌شود.
          نسخه‌ی اندروید فعلاً یک build آزمایشی (debug) است؛ ممکن است هنگام نصب هشدار «منبع ناشناس» ببینید.
        </p>
        <div className="landing-github-stats" aria-label="آمار مخزن FontWoW در گیت‌هاب">
          <div className="landing-github-counts">
            <span><I.IconStar size={17} /> <b>{repoStats ? repoStats.stars.toLocaleString('fa-IR') : '…'}</b> ستاره</span>
            <span><I.IconFork size={17} /> <b>{repoStats ? repoStats.forks.toLocaleString('fa-IR') : '…'}</b> فورک</span>
          </div>
          <p>FontWoW متن‌باز و رایگان است؛ با یک ستاره در گیت‌هاب کمک کنید افراد بیشتری پیدایش کنند.</p>
          <a className="landing-github-star" href={REPO} target="_blank" rel="noreferrer">
            <I.IconStar size={17} /> به FontWoW ستاره بدهید <I.IconExternal size={12} />
          </a>
        </div>

        <div className="landing-stats-card" aria-label="آمار بازدیدکنندگان FontWoW">
          <div className="landing-stats-header-info">
            <I.IconCircle className="pulse-icon" size={12} fill="#10b981" stroke="none" />
            <span>آمار بازدیدهای زنده</span>
          </div>
          <div className="landing-stats-number">
            {visitorCountLoading ? (
              <span className="loading-dots">در حال دریافت…</span>
            ) : visitorCount !== null ? (
              <>
                <span className="stats-count-value">{visitorCount.toLocaleString('fa-IR')}</span>
                <span className="stats-count-label">بازدید کل</span>
              </>
            ) : (
              <span className="stats-error-msg">آمار موقتاً در دسترس نیست</span>
            )}
          </div>
          <p className="landing-stats-desc">تمامی بازدیدها به صورت ناشناس و بدون کوکی ثبت می‌شوند.</p>
          <a className="landing-stats-details-btn" href="#/stats">
            <I.IconSliders size={15} /> مشاهده جزئیات و آمار کامل <I.IconExternal size={11} />
          </a>
        </div>
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
            دانلود اپ اندروید (نسخه {apkVersion})
          </a>
        </div>
      )}
      {platform === 'ios' && (
        <div className="landing-platform-banner">
          <I.IconExternal size={18} />
          <span>
            روی آیفون/آیپد هستی؟ FontWoW رو به‌عنوان اپ نصب کن: دکمه‌ی Share را بزن و «Add to Home Screen» را انتخاب کن.
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
          {FEATURES.map((f, i) => {
            const Icon = I[f.iconName]
            return (
              <div className="landing-card" key={i}>
                <div className="landing-card-icon"><Icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="landing-faq">
        <h2>سوالات متداول</h2>
        <div className="landing-faq-list">
          <details className="landing-faq-item">
            <summary>FontWoW رایگان است؟</summary>
            <p>بله. استفاده از نسخه وب رایگان است و برای ساخت متن، ذخیره تصویر و کپی کردن خروجی نیازی به حساب کاربری نیست.</p>
          </details>
          <details className="landing-faq-item">
            <summary>آیا FontWoW روی موبایل هم خوب کار می‌کند؟</summary>
            <p>بله. رابط کاربری برای موبایل و دسکتاپ طراحی شده و روی Android و iPhone هم قابل استفاده است.</p>
          </details>
          <details className="landing-faq-item">
            <summary>آیا خروجی بدون واترمارک است؟</summary>
            <p>بله. خروجی تصویر بدون واترمارک تبلیغاتی است و می‌توانی آن را با کیفیت بالا ذخیره یا کپی کنی.</p>
          </details>
          <details className="landing-faq-item">
            <summary>آیا نیاز به نصب یا ثبت‌نام دارد؟</summary>
            <p>خیر. نسخه وب مستقیم در مرورگر اجرا می‌شود و بدون نصب یا ساخت حساب کار می‌کند.</p>
          </details>
        </div>
      </section>

      <section className="landing-donate">
        <h2>حمایت مالی</h2>
        <p>
          تمام مبالغی که حمایت مالی می‌شن صرف خرید فونت‌های جدید با لایسنس می‌شه تا رایگان و در دسترس همه توی FontWoW قرار بگیرن.
        </p>
        <div className="landing-donate-buttons">
          <a className="landing-btn landing-btn-primary" href={TOMAN_DONATE_URL} target="_blank" rel="noreferrer">
            <I.IconCreditCard size={17} /> پرداخت تومانی <I.IconExternal size={11} />
          </a>
          <a href={CRYPTO_DONATE_URL} target="_blank" rel="noreferrer">
            <img
              src="https://oxapay.com/donation-buttons/1.png"
              alt="OxaPay Donation Button"
              style={{ width: 185 }}
            />
          </a>
        </div>
      </section>

      <section className="landing-recent-donations">
        <h2>آخرین حمایت‌های مالی</h2>
        <p>مبالغی که به‌تازگی برای پروژه‌ی FontWoW حمایت مالی شده‌اند.</p>
        {donationsError && (
          <p className="landing-recent-donations-fallback">
            فهرست دونیت‌ها فعلاً در دسترس نیست.
          </p>
        )}
        {!donationsError && !donations && <p className="landing-recent-donations-loading">در حال بارگذاری…</p>}
        {donations && donations.length === 0 && !donationsError && (
          <p className="landing-recent-donations-fallback">هنوز دونیتی ثبت نشده — اولین نفر باش!</p>
        )}
        {donations && donations.length > 0 && (
          <ul className="landing-recent-donations-list">
            {donations.map((d, i) => (
              <li key={i} className="landing-recent-donation">
                <I.IconHeart size={14} />
                <span className="landing-recent-donation-amount">{Number(d.amount).toLocaleString('fa-IR')} تومان</span>
                <span className="landing-recent-donation-project">برای FontWoW</span>
                {d.date && <span className="landing-recent-donation-date">{formatDonationDate(d.date)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="landing-impact" aria-labelledby="landing-impact-title">
        <div className="landing-impact-visual">
          <div className="landing-impact-art">
            <img src="/coffee-support.png" alt="فنجان قهوه برای حمایت از FontWoW" />
            <svg className="landing-impact-steam" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <path className="coffee-steam-path coffee-steam-path-one" d="M44 32 C38 27 49 23 43 18 C37 13 50 9 46 3" />
              <path className="coffee-steam-path coffee-steam-path-two" d="M50 32 C44 27 56 23 50 17 C44 11 57 8 52 1" />
              <path className="coffee-steam-path coffee-steam-path-three" d="M56 32 C51 27 62 23 57 18 C52 13 65 9 61 4" />
            </svg>
          </div>
          <span className="landing-impact-visual-caption">یک روز قهوه‌نخوردن: حداقل ۲۰۰٬۰۰۰ تومان</span>
        </div>
        <div className="landing-impact-content">
          <p className="landing-impact-eyebrow">یک روز قهوه‌نخوری چه می‌شود؟</p>
          <h2 id="landing-impact-title">یک قهوه کمتر برای تو؛ یک فونت بیشتر برای همه.</h2>
          <p className="landing-impact-intro">
            هزینه‌ی حداقل یک قهوه، یعنی ۲۰۰٬۰۰۰ تومان، می‌تواند به خرید فونت‌های لایسنس‌دار کمک کند تا FontWoW رایگان بماند. اینجا می‌بینی استفاده‌ها و حمایت‌ها چه اثری ساخته‌اند.
          </p>
          <div className="landing-impact-grid">
            <article className="landing-impact-card">
              <span className="landing-impact-card-label">استفاده‌های ثبت‌شده</span>
              <strong>{visitorCount !== null ? visitorCount.toLocaleString('fa-IR') : '…'}</strong>
              <small>تعداد دفعات بازشدن صفحه؛ تعداد افراد یکتا نیست.</small>
            </article>
            <article className="landing-impact-card">
              <span className="landing-impact-card-label">ارزش تقریبی استفاده‌ی رایگان</span>
              <strong>{estimatedCollectiveValue !== null ? formatToman(estimatedCollectiveValue) : '…'}</strong>
              <small>بر اساس روزانه‌ی {formatToman(PAID_APP_DAILY_BENCHMARK_TOMAN)} برای ابزار مشابه؛ این عدد برآورد است، نه مبلغ دریافت‌شده.</small>
            </article>
            <article className="landing-impact-card landing-impact-card-coffee">
              <span className="landing-impact-card-label">حمایت جمع‌شده</span>
              <strong>{donationSummary ? formatToman(totalDonations) : '…'}</strong>
              <small>
                معادل {fundedCoffeeDays.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} روز قهوه‌نخوردن؛ هر روز حداقل {formatToman(COFFEE_DAY_COST_TOMAN)}.
              </small>
            </article>
          </div>
          <div className="landing-impact-progress" aria-label="پیشرفت تأمین هزینه‌ی فونت‌ها">
            <div className="landing-impact-progress-head">
              <span>پیشرفت خرید فونت‌های بعدی</span>
              <b>{donationSummary ? `${fundingPercent.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪` : '…'}</b>
            </div>
            <div className="landing-impact-progress-track">
              <span style={{ width: `${fundingPercent}%` }} />
            </div>
            <p>
              {donationSummary
                ? `تا تأمین هزینه‌ی همه‌ی ${FONT_GOALS.length} فونت، معادل ${remainingCoffeeDays.toLocaleString('fa-IR')} روز قهوه‌نخوردن فاصله داریم.`
                : 'در حال دریافت آخرین آمار حمایت‌ها…'}
            </p>
          </div>
          <p className="landing-impact-note">
            میانگین هر {supportUnitLabel}: {donationSummary && supporterCount > 0 ? formatToman(averageDonation) : '—'}؛ فقط آمار تجمیعی نمایش داده می‌شود.
          </p>
        </div>
      </section>

      <section className="landing-cafe-sponsor" aria-labelledby="landing-cafe-sponsor-title">
        <div className="landing-cafe-sponsor-copy">
          <p className="landing-impact-eyebrow">پیشنهاد اسپانسری برای کافه‌ها</p>
          <h2 id="landing-cafe-sponsor-title">کافه‌تان می‌تواند حامی قهوه‌های FontWoW باشد.</h2>
          <p>
            مثلاً هزینه‌ی ۱۰ قهوه را اسپانسر کنید. در ادامه، نام و لوگوی کافه‌تان به‌عنوان حامی این سهم‌ها نمایش داده می‌شود و به کاربران می‌گوییم: «هزینه‌ی یک قهوه‌ات با FontWoW.»
          </p>
          <a className="landing-cafe-sponsor-cta" href={CAFE_SPONSOR_CONTACT_URL}>
            پیشنهاد حمایت کافه‌ای
            <I.IconMail size={15} />
          </a>
        </div>
        <div className="landing-cafe-sponsor-flow" aria-label="مراحل حمایت کافه‌ای">
          <div className="landing-cafe-sponsor-example">
            <span>نمونه‌ی قابل اجرا</span>
            <strong>{CAFE_SPONSOR_EXAMPLE_COFFEES.toLocaleString('fa-IR')} قهوه</strong>
            <small>{formatToman(CAFE_SPONSOR_EXAMPLE_COFFEES * COFFEE_DAY_COST_TOMAN)} ارزش حمایت</small>
          </div>
          <ol>
            <li><b>۱</b><span><strong>تعداد قهوه‌های اسپانسری را مشخص کنید</strong><small>مثلاً ۱۰ قهوه</small></span></li>
            <li><b>۲</b><span><strong>هزینه‌ی سهم‌ها را پرداخت کنید</strong><small>برای پشتیبانی از FontWoW</small></span></li>
            <li><b>۳</b><span><strong>نام و لوگوی کافه نمایش داده می‌شود</strong><small>همراه با تعداد قهوه‌های اسپانسرشده</small></span></li>
          </ol>
        </div>
        <div className="landing-cafe-sponsor-showcase">
          <span>حامیان کافه‌ای FontWoW</span>
          <strong>لوگوی کافه‌ی شما اینجا نمایش داده می‌شود</strong>
          <small>بعد از هماهنگی، نام، لوگو و تعداد سهم‌های حمایت در همین بخش اضافه می‌شود.</small>
        </div>
      </section>

      <section className="landing-goals">
        <h2>اهداف بعدی</h2>
        <p>
          فونت‌هایی که در نوبت خریدن هستن، به‌ترتیب اولویت — با کمک شما زودتر آزاد می‌شن.
          قیمت نهایی هر لایسنس نامحدود با تخفیف اختصاصی فونت‌ایران محاسبه شده.
        </p>
        <FontGoals strings={STRINGS.fa} />
      </section>

      <section className="landing-ai-contribute">
        <h2>هوش مصنوعی خودت رو به کمک پروژه بفرست</h2>
        <p>
          FontWoW متن‌بازه و از کمک هر کسی استقبال می‌کنه — حتی اگه خودت وقت کدنویسی نداری. کافیه یک
          دستیار هوش مصنوعی برنامه‌نویسی (مثل Claude Code) رو روی این ریپوی گیت‌هاب اجرا کنی و بهش
          بگی «باگ‌ها رو رفع کن» یا «یه قابلیت جدید اضافه کن». دستیار خودش از بین ایشوهای باز پروژه
          می‌گرده، تشخیص می‌ده کدوم باگه و کدوم قابلیت جدیده، یکی رو انتخاب و پیاده‌سازی می‌کنه و در
          نهایت یک Pull Request می‌زنه تا خودم بررسی و تأیید کنم.
        </p>
        <ol className="landing-ai-contribute-steps">
          <li>اگه اکانت گیت‌هاب نداری، یکی بساز: <a href="https://github.com/signup" target="_blank" rel="noreferrer">github.com/signup</a></li>
          <li>ریپو رو فورک و کلون کن، بعد با <code>gh auth login</code> وارد شو</li>
          <li>به دستیارت بگو «به این پروژه کمک کن» یا صریحاً «باگ‌ها رو رفع کن» / «قابلیت جدید اضافه کن»</li>
          <li>دستیار خودکار ایشو مناسب رو پیدا، پیاده و برات یک PR باز می‌کنه — منتظر تأیید من می‌مونه</li>
        </ol>
        <a className="landing-ai-contribute-link" href={`${REPO}/issues`} target="_blank" rel="noreferrer">
          <I.IconGithub size={16} /> مشاهده ایشوهای باز پروژه <I.IconExternal size={11} />
        </a>
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

      <section className="landing-media-supporters">
        <h2>حامیان رسانه‌ای</h2>
        <p>از همراهانی که FontWoW را به مخاطبان بیشتری معرفی می‌کنند، صمیمانه سپاسگزاریم.</p>
        <MediaSupporters />
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
        <a href={TOMAN_DONATE_URL} target="_blank" rel="noreferrer">
          <I.IconHeart size={16} /> حمایت مالی تومانی <I.IconExternal size={11} />
        </a>
        <a href={CRYPTO_DONATE_URL} target="_blank" rel="noreferrer">
          <I.IconHeart size={16} /> حمایت مالی با کریپتو <I.IconExternal size={11} />
        </a>
        <a href={APP_URL}>بازگشت به برنامه</a>
      </footer>
    </div>
  )
}
