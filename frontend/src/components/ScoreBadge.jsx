export default function ScoreBadge({ score }) {
  if (score == null) return null

  const color =
    score >= 80 ? 'text-emerald-400 ring-emerald-500/30 bg-emerald-500/10' :
    score >= 60 ? 'text-amber-400   ring-amber-500/30   bg-amber-500/10'   :
    score >= 40 ? 'text-orange-400  ring-orange-500/30  bg-orange-500/10'  :
                  'text-red-400     ring-red-500/30     bg-red-500/10'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ring-1 px-2.5 py-1 rounded-full ${color}`}>
      {score}<span className="font-normal opacity-60">/100</span>
    </span>
  )
}
