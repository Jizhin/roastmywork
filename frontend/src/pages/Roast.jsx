import UploadForm from '../components/UploadForm'

const POINTS = [
  'Score out of 100 with specific breakdown',
  'Identifies real weaknesses — no sugar-coating',
  'Generates a fixed version of your work',
  'Works on resumes, code, pitch decks, and more',
]

export default function Roast() {
  return (
    <div className="max-w-8xl mx-auto px-6 py-14 lg:py-20">
      <div className="grid lg:grid-cols-[1fr_520px] gap-16 lg:gap-24 items-start">

        {/* Left — hero */}
        <div className="lg:sticky lg:top-24 space-y-8 animate-fade-up">
          <div className="space-y-4">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
              AI Critique
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.07] tracking-tight text-gray-900">
              Brutal honest<br />
              <span className="text-red-500">feedback.</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
              Upload your resume, code, pitch deck, or any professional work. Get a score, honest critique, and a fixed version — in under a minute.
            </p>
          </div>

          <div className="space-y-3.5">
            {POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-600">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">What should we roast?</h2>
            <UploadForm />
          </div>
        </div>

      </div>
    </div>
  )
}
