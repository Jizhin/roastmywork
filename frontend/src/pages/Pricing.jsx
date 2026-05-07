import { Link } from 'react-router-dom'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Get started and try the product.',
    highlight: false,
    features:  ['5 roasts on sign-up', 'All work types', 'All intensity levels', 'Shareable link'],
    missing:   ['Roast history', 'Priority processing'],
    cta: 'Get Started',
    to: '/',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For individuals who want unlimited access.',
    highlight: true,
    features:  ['Unlimited roasts', 'All work types', 'All intensity levels', 'Shareable link', 'Full roast history', 'Priority processing'],
    missing:   [],
    cta: 'Coming Soon',
    to: '/',
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    desc: 'For teams that want to improve together.',
    highlight: false,
    features:  ['Everything in Pro', 'Up to 5 seats', 'Shared dashboard', 'Bulk upload', 'API access'],
    missing:   [],
    cta: 'Coming Soon',
    to: '/',
  },
]

export default function Pricing() {
  return (
    <div className="max-w-8xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, transparent pricing</h1>
        <p className="text-gray-500 text-lg">Start free. Upgrade when you need more.</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-7 ${
              plan.highlight
                ? 'border-orange-300 bg-orange-50/40 shadow-[0_0_0_1px_theme(colors.orange.300)]'
                : 'border-gray-200 bg-white'
            }`}
            style={plan.highlight ? { boxShadow: '0 4px 24px rgba(249,115,22,0.12)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {plan.highlight && (
              <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                <span className="bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <p className="section-title mb-4">{plan.name}</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-4xl font-extrabold text-gray-900 leading-none">{plan.price}</span>
                <span className="text-gray-400 text-sm mb-1">{plan.period}</span>
              </div>
              <p className="text-gray-500 text-sm">{plan.desc}</p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-green-600">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
              {plan.missing.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-gray-300">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={plan.to}
              className={`text-center py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                plan.highlight ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 text-sm mt-10">
        All plans include SSL encryption and 99.9% uptime. Cancel anytime.
      </p>
    </div>
  )
}
