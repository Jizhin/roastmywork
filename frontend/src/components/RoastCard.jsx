import ShareButton from './ShareButton'

const WORK_LABELS = {
  resume: 'Resume / CV', code: 'Code', pitch_deck: 'Pitch Deck',
  linkedin: 'LinkedIn', essay: 'Essay', ui_design: 'UI Design',
}

const INTENSITY_LABELS = {
  gentle: 'Gentle', honest: 'Honest',
  gordon_ramsay: 'Gordon Ramsay', simon_cowell: 'Simon Cowell',
}

export default function RoastCard({ submission }) {
  const { id, roast_output, work_type, intensity } = submission

  return (
    <div className="card p-6 space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
            {WORK_LABELS[work_type] || work_type}
          </span>
          <span className="text-[12px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
            {INTENSITY_LABELS[intensity] || intensity} mode
          </span>
        </div>
        <ShareButton roastId={id} />
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">The Roast</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
            {roast_output}
          </p>
        </div>
      </div>
    </div>
  )
}
