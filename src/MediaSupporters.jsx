import { MEDIA_SUPPORTERS } from './mediaSupporterData'
import * as I from './icons'

const SOCIALS = {
  github: { label: 'گیت‌هاب', Icon: I.IconGithub },
  telegram: { label: 'تلگرام', Icon: I.IconTelegram },
  instagram: { label: 'اینستاگرام', Icon: I.IconInstagram },
  instagram2: { label: 'اینستاگرام', Icon: I.IconInstagram },
  instagram3: { label: 'اینستاگرام', Icon: I.IconInstagram },
  twitter: { label: 'توییتر', Icon: I.IconTwitter },
  twitter2: { label: 'توییتر', Icon: I.IconTwitter },
  linkedin: { label: 'لینکدین', Icon: I.IconLinkedin },
  website: { label: 'وب‌سایت', Icon: I.IconGlobe },
  website2: { label: 'وب‌سایت', Icon: I.IconGlobe },
  tiktok: { label: 'تیک‌تاک', Icon: I.IconTiktok },
  youtube: { label: 'یوتیوب', Icon: I.IconYoutube },
  aparat: { label: 'آپارات', Icon: I.IconYoutube },
}

export default function MediaSupporters({ compact = false }) {
  return (
    <div className={`media-supporters-grid${compact ? ' compact' : ''}`}>
      {MEDIA_SUPPORTERS.map((supporter) => {
        const availableSocials = Object.entries(SOCIALS)
          .map(([network, social]) => ({ network, social, account: supporter.socials[network] }))
          .filter((item) => Boolean(item.account))

        return (
          <article className="media-supporter" key={supporter.id}>
            <div className="media-supporter-profile">
              <img
                src={supporter.avatar}
                alt={`تصویر پروفایل ${supporter.name}`}
                width={compact ? '36' : '42'}
                height={compact ? '36' : '42'}
                loading="lazy"
              />
              <div className="media-supporter-meta">
                <h3>{supporter.name}</h3>
                <span dir="ltr">@{supporter.handle}</span>
              </div>
            </div>
            <div className="media-supporter-socials">
              {availableSocials.map(({ network, social, account }) => {
                const SocialIcon = social.Icon
                const label = account?.label || social.label
                const tooltip = `${label}${account.handle ? `: ${account.noAt ? '' : '@'}${account.handle}` : ''}${account.audience ? ` (${account.audience})` : ''}`

                return (
                  <a
                    href={account.url}
                    target="_blank"
                    rel="noreferrer"
                    key={network}
                    className="media-social-btn"
                    title={tooltip}
                    aria-label={`${label} ${supporter.name}`}
                  >
                    <span className={`media-social-icon ${network}`} aria-hidden="true">
                      <SocialIcon size={compact ? 13 : 15} />
                    </span>
                    {account.audience && !compact && (
                      <span className="media-social-audience">{account.audience}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </article>
        )
      })}
    </div>
  )
}
