import { useEffect, useState } from 'react'
import { FONT_GOALS, FONTIRAN_DISCOUNT_PERCENT, getDiscountedFontPrice } from './goals'
import { rankFontGoals } from './fontRoadmap'
import * as I from './icons'
import { trackFontLike } from './analytics.js'

const FONTIRAN_URL = 'https://fontiran.com/'
const FONTIRAN_LOGO_URL = 'https://fontiran.com/front/img/logo.svg'

function asCount(value) {
  if (value === null || value === undefined || value === '') return null
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : null
}

function readLikedGoals() {
  try {
    const value = JSON.parse(localStorage.getItem('fontwow-roadmap-liked') || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

export default function FontGoals({ strings }) {
  const [roadmapData, setRoadmapData] = useState(null)
  const [likedGoals, setLikedGoals] = useState(readLikedGoals)

  useEffect(() => {
    let cancelled = false
    fetch('/font-roadmap.json', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!cancelled && data && typeof data.fonts === 'object') setRoadmapData(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const goalsWithSnapshot = FONT_GOALS.map(goal => {
    const snapshot = roadmapData?.fonts?.[goal.id]
    if (!snapshot || typeof snapshot !== 'object') return goal
    return {
      ...goal,
      inAppUsageCount: snapshot.inAppUsageCount ?? goal.inAppUsageCount,
      publicPopularityScore: snapshot.publicPopularityScore ?? goal.publicPopularityScore,
      coverageGapScore: snapshot.coverageGapScore ?? goal.coverageGapScore,
      communityLikeCount: snapshot.communityLikeCount ?? goal.communityLikeCount,
    }
  })
  const rankedGoals = rankFontGoals(goalsWithSnapshot)
  const signalLabels = {
    inAppUsage: strings.roadmapInAppUsage,
    publicPopularity: strings.roadmapPublicPopularity,
    coverageGap: strings.roadmapCoverageGap,
    fundingReadiness: strings.roadmapFundingReadiness,
    communityLikes: strings.roadmapCommunityLikes,
  }

  const likeGoal = (id) => {
    if (likedGoals[id] || !trackFontLike(id)) return
    setLikedGoals(previous => {
      const next = { ...previous, [id]: true }
      try { localStorage.setItem('fontwow-roadmap-liked', JSON.stringify(next)) } catch {}
      return next
    })
  }

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

      <div className="landing-roadmap-method">
        <strong>{strings.roadmapMethodTitle}</strong>
        <p>{strings.roadmapMethodText}</p>
        <small>{strings.roadmapMethodHint}</small>
      </div>

      <div className="landing-goals-list" aria-label={strings.roadmapMethodTitle}>
        {rankedGoals.map((goal, index) => {
          const discountedPrice = getDiscountedFontPrice(goal.price)
          const likeCount = asCount(goal.communityLikeCount)
          const isLiked = likedGoals[goal.id] === true
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
                  <span className={`landing-goal-score${goal.roadmap.score === null ? ' is-pending' : ''}`}>
                    {goal.roadmap.score === null
                      ? strings.roadmapAwaitingData
                      : `${strings.roadmapScore} ${goal.roadmap.score.toLocaleString('fa-IR')}`}
                  </span>
                </div>
                <div className="landing-goal-bar">
                  <div className="landing-goal-bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="landing-goal-foot">
                  <span>
                    {goal.raised.toLocaleString('fa-IR')} {strings.of} {discountedPrice.toLocaleString('fa-IR')} {strings.toman}
                  </span>
                  <span className="landing-goal-meta">
                    {goal.roadmap.signals.map(signal => (
                      <span key={signal.key}>{signalLabels[signal.key]}: {signal.value.toLocaleString('fa-IR')}٪</span>
                    ))}
                    {goal.roadmap.missingSignals.length > 0 && (
                      <span>{strings.roadmapMissing}: {goal.roadmap.missingSignals.length.toLocaleString('fa-IR')}</span>
                    )}
                    {likeCount !== null && (
                      <span>{strings.roadmapCommunityLikes}: {likeCount.toLocaleString('fa-IR')}</span>
                    )}
                    <button
                      type="button"
                      className={`landing-goal-like${isLiked ? ' is-liked' : ''}`}
                      onClick={() => likeGoal(goal.id)}
                      disabled={isLiked}
                      aria-pressed={isLiked}
                      title={strings.roadmapLikeHint}
                    >
                      <I.IconHeart size={12} />
                      {isLiked ? strings.roadmapLiked : strings.roadmapLike}
                    </button>
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
