import * as I from '../shared/icons'
import '../landing/Landing.css'

export default function StatsDashboard() {
  return (
    <div className="stats-dashboard" dir="rtl">
      <header className="stats-header">
        <div className="stats-header-content">
          <a href="#/" className="stats-back-btn" aria-label="بازگشت به صفحه اصلی">
            <I.IconX size={18} />
            <span>بازگشت</span>
          </a>
          <div className="stats-title-group">
            <h1>آمار بازدیدکنندگان FontWoW</h1>
            <p>جزئیات ترافیک، کشورها، صفحات محبوب، دستگاه‌ها و مرورگرهای کاربران</p>
          </div>
        </div>
      </header>

      <main className="stats-main">
        <div className="stats-iframe-container">
          <iframe
            src="https://counter.dev/dashboard.html?user=matinbeigiwp&token=WnLRlPO9LRk%3D"
            title="Counter.dev Web Analytics"
            className="stats-iframe"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>
      </main>
    </div>
  )
}
