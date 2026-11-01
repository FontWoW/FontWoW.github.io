export const ROADMAP_WEIGHTS = {
  inAppUsage: 0.5,
  publicPopularity: 0.25,
  coverageGap: 0.1,
  fundingReadiness: 0.1,
  communityLikes: 0.05,
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function asNonNegativeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function asScore(value) {
  const score = asNonNegativeNumber(value)
  return score === null ? null : clamp(score)
}

function normalize(values) {
  const available = values.filter(value => value !== null)
  if (available.length === 0) return values.map(() => null)

  const min = Math.min(...available)
  const max = Math.max(...available)
  if (min === max) return values.map(value => value === null ? null : 50)

  return values.map(value => value === null ? null : clamp(((value - min) / (max - min)) * 100))
}

function fundingRemainder(goal) {
  const target = asNonNegativeNumber(goal.price)
  const raised = asNonNegativeNumber(goal.raised)
  if (target === null || target === 0 || raised === null || raised === 0) return null

  return Math.max(0, target - raised)
}

function calculateFundingReadiness(goals) {
  const remainders = goals.map(fundingRemainder)
  const available = remainders.filter(value => value !== null)
  if (available.length === 0) return remainders.map(() => null)

  const largestRemainder = Math.max(...available)
  return remainders.map(value => {
    if (value === null) return null
    if (largestRemainder === 0) return 100
    // This is deliberately a small execution signal based on the absolute
    // amount left to fund, not on the font price or funding percentage.
    return clamp(((largestRemainder - value) / largestRemainder) * 100)
  })
}

function compareRoadmapEntries(a, b) {
  if (a.roadmap.score === null && b.roadmap.score !== null) return 1
  if (a.roadmap.score !== null && b.roadmap.score === null) return -1
  return (b.roadmap.score ?? 0) - (a.roadmap.score ?? 0)
    || a.roadmap.originalIndex - b.roadmap.originalIndex
}

/**
 * Rank font goals with real, available signals only.
 *
 * The primary signal is usage inside FontWoW. Public popularity and the
 * coverage gap are secondary product signals. Funding readiness and community
 * likes are small supporting signals; funding uses the absolute amount
 * remaining after real support, while likes come from a shared snapshot.
 */
export function rankFontGoals(goals) {
  const inAppUsage = normalize(goals.map(goal => asNonNegativeNumber(goal.inAppUsageCount)))
  const publicPopularity = normalize(goals.map(goal => asScore(goal.publicPopularityScore)))
  const coverageGap = normalize(goals.map(goal => asScore(goal.coverageGapScore)))
  const fundingReadiness = calculateFundingReadiness(goals)
  const communityLikes = normalize(goals.map(goal => asNonNegativeNumber(goal.communityLikeCount)))

  return goals
    .map((goal, index) => {
      const candidateSignals = [
        { key: 'inAppUsage', value: inAppUsage[index], weight: ROADMAP_WEIGHTS.inAppUsage },
        { key: 'publicPopularity', value: publicPopularity[index], weight: ROADMAP_WEIGHTS.publicPopularity },
        { key: 'coverageGap', value: coverageGap[index], weight: ROADMAP_WEIGHTS.coverageGap },
        { key: 'fundingReadiness', value: fundingReadiness[index], weight: ROADMAP_WEIGHTS.fundingReadiness },
        { key: 'communityLikes', value: communityLikes[index], weight: ROADMAP_WEIGHTS.communityLikes },
      ]
      const signals = candidateSignals.filter(signal => signal.value !== null)
      const missingSignals = candidateSignals
        .filter(signal => signal.value === null)
        .map(signal => signal.key)
      // Keep the configured weights fixed. Otherwise a minor signal such as
      // likes or funding could become the whole score when primary data is missing.
      const score = signals.length > 0
        ? signals.reduce((sum, signal) => sum + signal.value * signal.weight, 0)
        : null

      return {
        ...goal,
        roadmap: {
          score: score === null ? null : Math.round(score),
          signals: signals.map(signal => ({ key: signal.key, value: Math.round(signal.value) })),
          missingSignals,
          originalIndex: index,
        },
      }
    })
    .sort(compareRoadmapEntries)
}
