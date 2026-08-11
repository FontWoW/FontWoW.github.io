const LOGS_KEY = 'fontwow_logs_v1'
const MAX_LOGS = 150

class CentralLogger {
  constructor() {
    this.logs = []
    this.isInitialized = false
    this.listeners = new Set()
  }

  init() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Load persisted logs
    try {
      const stored = localStorage.getItem(LOGS_KEY)
      this.logs = stored ? JSON.parse(stored) : []
      if (!Array.isArray(this.logs)) this.logs = []
    } catch {
      this.logs = []
    }

    // Capture console methods
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const safeStringify = (obj) => {
      if (obj instanceof Error) return obj.stack || obj.message;
      try {
        return JSON.stringify(obj);
      } catch {
        return String(obj);
      }
    };

    console.log = (...args) => {
      originalLog.apply(console, args)
      this.addLog('info', args.map(a => typeof a === 'object' && a !== null ? safeStringify(a) : String(a)).join(' '))
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      this.addLog('warn', args.map(a => typeof a === 'object' && a !== null ? safeStringify(a) : String(a)).join(' '))
    }

    console.error = (...args) => {
      originalError.apply(console, args)
      this.addLog('error', args.map(a => typeof a === 'object' && a !== null ? safeStringify(a) : String(a)).join(' '))
    }

    // Capture global errors
    window.onerror = (message, source, lineno, colno, error) => {
      const details = `${source || 'unknown'}:${lineno || 0}:${colno || 0}${error ? `\nStack: ${error.stack}` : ''}`
      this.addLog('error', `Global Error: ${message}`, details, 'System')
      return false
    }

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      const message = reason?.message || String(reason || 'Unhandled Rejection')
      const details = reason?.stack || 'No stack trace'
      this.addLog('error', `Unhandled Rejection: ${message}`, details, 'System')
    })

    this.info('System', 'Central logger initialized.')
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener([...this.logs])
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach(l => l([...this.logs]))
  }

  addLog(level, message, details = '', action = '') {
    const entry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      level,
      message,
      details,
      action
    }
    this.logs.unshift(entry)
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }
    this.persist()
    this.notify()
  }

  info(action, message, details = '') {
    this.addLog('info', message, details, action)
  }

  warn(action, message, details = '') {
    this.addLog('warn', message, details, action)
  }

  error(action, message, details = '') {
    this.addLog('error', message, details, action)
  }

  persist() {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs))
    } catch {
      // LocalStorage might be full
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.persist()
    this.notify()
    this.info('System', 'Logs cleared by user.')
  }

  checkHealth() {
    const issues = []
    const status = {
      localStorage: 'green',
      network: 'green',
      customFonts: 'green',
      customTemplates: 'green',
      browserCapabilities: 'green',
    }

    // Check LocalStorage keys integrity
    const keys = [
      { key: 'fontwow_saved_v1', type: 'array' },
      { key: 'fontwow_settings_v1', type: 'object' },
      { key: 'fontwow_custom_fonts_v1', type: 'array' },
      { key: 'fontwow_custom_templates_v1', type: 'array' },
      { key: 'fontwow_app_settings_v1', type: 'object' }
    ]

    let totalSize = 0
    keys.forEach(({ key, type }) => {
      const val = localStorage.getItem(key)
      if (val) {
        totalSize += val.length * 2
        try {
          const parsed = JSON.parse(val)
          if (type === 'array' && !Array.isArray(parsed)) throw new Error('Should be array')
          if (type === 'object' && (typeof parsed !== 'object' || parsed === null)) throw new Error('Should be object')
        } catch {
          status.localStorage = 'red'
          issues.push({
            id: 'corrupt_ls_' + key,
            type: 'localStorage',
            severity: 'high',
            message: `دیتای کلید ${key} در حافظه مرورگر خراب است و نیاز به بازسازی دارد.`,
            messageEn: `LocalStorage key ${key} data is corrupted and needs reset.`,
            recoverable: true,
            actionKey: key
          })
        }
      }
    })

    const totalMB = totalSize / (1024 * 1024)
    if (totalMB > 4.0) {
      status.localStorage = status.localStorage === 'red' ? 'red' : 'yellow'
      issues.push({
        id: 'ls_almost_full',
        type: 'localStorage',
        severity: 'medium',
        message: `حافظه مرورگر تقریباً پر است (${totalMB.toFixed(2)} MB استفاده شده از ۵ MB)`,
        messageEn: `LocalStorage is almost full (${totalMB.toFixed(2)} MB used out of 5 MB)`,
        recoverable: true,
        actionKey: 'prune'
      })
    }

    // Check custom fonts integrity
    try {
      const customFontsVal = localStorage.getItem('fontwow_custom_fonts_v1')
      if (customFontsVal) {
        const fonts = JSON.parse(customFontsVal)
        if (Array.isArray(fonts)) {
          const invalidFonts = fonts.filter(f => !f.family || !f.dataUrl)
          if (invalidFonts.length > 0) {
            status.customFonts = 'yellow'
            issues.push({
              id: 'invalid_custom_fonts',
              type: 'customFonts',
              severity: 'medium',
              message: `${invalidFonts.length} فونت سفارشی نامعتبر شناسایی شد.`,
              messageEn: `${invalidFonts.length} invalid custom fonts found.`,
              recoverable: true,
              actionKey: 'fonts'
            })
          }
        }
      }
    } catch {}

    // Check Network
    if (!navigator.onLine) {
      status.network = 'yellow'
      issues.push({
        id: 'network_offline',
        type: 'network',
        severity: 'low',
        message: 'اینترنت قطع است. برخی امکانات مثل جستجوی فونت‌های گوگل موقتاً غیرفعال است.',
        messageEn: 'No internet connection. Some options like Google Fonts search are disabled.',
        recoverable: false
      })
    }

    // Check browser capability (Clipboard Write API)
    const clipboardSupported = navigator.clipboard && typeof navigator.clipboard.write === 'function'
    if (!clipboardSupported) {
      status.browserCapabilities = 'yellow'
      issues.push({
        id: 'clipboard_unsupported',
        type: 'browserCapabilities',
        severity: 'medium',
        message: 'مرورگر شما از کپی مستقیم تصویر در کلیپ‌بورد پشتیبانی نمی‌کند.',
        messageEn: 'Your browser does not support direct image copying to clipboard.',
        recoverable: false
      })
    }

    return {
      status,
      issues,
      hasError: issues.some(i => i.severity === 'high'),
      hasWarning: issues.some(i => i.severity === 'medium' || i.severity === 'low')
    }
  }

  autoFix() {
    const health = this.checkHealth()
    const fixed = []

    health.issues.forEach(issue => {
      if (!issue.recoverable) return

      if (issue.id.startsWith('corrupt_ls_')) {
        const key = issue.actionKey
        const defaultVal = key.endsWith('settings_v1') ? '{}' : '[]'
        try {
          localStorage.setItem(key, defaultVal)
          fixed.push(issue.messageEn + ' (Reset to default)')
          this.info('AutoFix', `کلید خراب شده ${key} بازنشانی شد.`)
        } catch (e) {
          this.error('AutoFix', `خطا در بازسازی کلید ${key}: ${e.message}`)
        }
      }

      if (issue.id === 'ls_almost_full') {
        try {
          const logsStored = localStorage.getItem(LOGS_KEY)
          if (logsStored) {
            localStorage.setItem(LOGS_KEY, '[]')
            this.logs = []
            fixed.push('Cleared system logs')
          }
          const savedVal = localStorage.getItem('fontwow_saved_v1')
          if (savedVal) {
            const saved = JSON.parse(savedVal)
            if (Array.isArray(saved) && saved.length > 5) {
              localStorage.setItem('fontwow_saved_v1', JSON.stringify(saved.slice(0, 5)))
              fixed.push('Pruned app gallery to latest 5 items')
            }
          }
          this.info('AutoFix', 'حافظه مرورگر پاکسازی و بهینه‌سازی شد.')
        } catch (e) {
          this.error('AutoFix', `خطا در آزادسازی حافظه: ${e.message}`)
        }
      }

      if (issue.id === 'invalid_custom_fonts') {
        try {
          const customFontsVal = localStorage.getItem('fontwow_custom_fonts_v1')
          if (customFontsVal) {
            const fonts = JSON.parse(customFontsVal)
            if (Array.isArray(fonts)) {
              const validFonts = fonts.filter(f => f.family && f.dataUrl)
              localStorage.setItem('fontwow_custom_fonts_v1', JSON.stringify(validFonts))
              fixed.push('Removed invalid custom fonts')
              this.info('AutoFix', 'فونت‌های سفارشی نامعتبر با موفقیت پاک شدند.')
            }
          }
        } catch (e) {
          this.error('AutoFix', `خطا در اصلاح فونت‌های سفارشی: ${e.message}`)
        }
      }
    })

    return fixed
  }

  preflightCheck(action) {
    this.info('Preflight', `شروع پیش‌بررسی برای عملیات: ${action}`)
    const health = this.checkHealth()
    
    // Auto-fix critical LocalStorage errors before proceeding
    const criticalLocalStorageIssues = health.issues.filter(
      i => i.type === 'localStorage' && i.severity === 'high' && i.recoverable
    )

    if (criticalLocalStorageIssues.length > 0) {
      this.warn('Preflight', 'مشکل بحرانی در حافظه شناسایی شد. اجرای خودکار رفع مشکل...')
      this.autoFix()
      return this.checkHealth()
    }

    return health
  }
}

const logger = new CentralLogger()
export default logger
