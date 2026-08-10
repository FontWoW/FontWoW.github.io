import { FONT_GOALS, FONTIRAN_DISCOUNT_PERCENT, getDiscountedFontPrice } from './goals'

const FONTIRAN_URL = 'https://fontiran.com/'
const FONTIRAN_LOGO_URL = 'https://fontiran.com/front/img/logo.svg'

export default function FontGoals({ strings }) {
  return (
    <>
      <a className="fontiran-support" href={FONTIRAN_URL} target="_blank" rel="noreferrer">
        <img src={FONTIRAN_LOGO_URL} alt={strings.fontIranLogoAlt} loading="lazy" />
        <span>
          <strong>{strings.fontIranSupportTitle}</strong>
          <small>{strings.fontIranSupportText}</small>
        </span>
        <b>{FONTIRAN_DISCOUNT_PERCENT.toLocaleString('fa-IR')}٪ {strings.discount}</b>
      </a>

      <div className="landing-goals-list">
        {FONT_GOALS.map((goal, index) => {
          const discountedPrice = getDiscountedFontPrice(goal.price)
          const percent = discountedPrice > 0
            ? Math.min(100, Math.round((goal.raised / discountedPrice) * 100))
            : 0

          return (
            <div className="landing-goal" key={goal.name}>
              <span className="landing-goal-rank">{index + 1}</span>
              <img
                className="landing-goal-img"
                src={goal.image}
                alt={goal.name}
                loading="lazy"
                onError={(event) => { event.currentTarget.src = '/favicon.svg' }}
              />
              <div className="landing-goal-info">
                <div className="landing-goal-head">
                  <h3>
                    {goal.url ? (
                      <a href={goal.url} target="_blank" rel="noreferrer">{goal.name}</a>
                    ) : goal.name}
                  </h3>
                  <span className="landing-goal-prices">
                    <del>{goal.price.toLocaleString('fa-IR')}</del>
                    <strong>{discountedPrice.toLocaleString('fa-IR')} {strings.toman}</strong>
                    <small>({strings.unlimited})</small>
                  </span>
                </div>
                <div className="landing-goal-bar">
                  <div className="landing-goal-bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="landing-goal-foot">
                  <span>
                    {goal.raised.toLocaleString('fa-IR')} {strings.of} {discountedPrice.toLocaleString('fa-IR')} {strings.toman}
                  </span>
                  <span className="landing-goal-percent">{percent.toLocaleString('fa-IR')}٪</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
