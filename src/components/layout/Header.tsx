import { useTournament } from '../../state'
import type { Page } from '../../state'
import { useT } from '../../i18n'
import type { Locale } from '../../i18n'

const navItems: { page: Page; labelKey: string; requiresTournament: boolean }[] = [
  { page: 'setup', labelKey: 'nav.setup', requiresTournament: false },
  { page: 'round', labelKey: 'nav.rounds', requiresTournament: true },
  { page: 'leaderboard', labelKey: 'nav.leaderboard', requiresTournament: true },
  { page: 'simulator', labelKey: 'nav.simulator', requiresTournament: false },
]

export function Header() {
  const { state, dispatch } = useTournament()
  const { t, locale, setLocale } = useT()
  const hasTournament = state.tournament != null

  const toggleLocale = () => setLocale(locale === 'de' ? 'en' : 'de')
  const nextLocale: Locale = locale === 'de' ? 'en' : 'de'

  return (
    <header className="bg-gradient-to-r from-primary to-primary-light text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-lg font-bold tracking-tight">
            {state.tournament?.name ?? t('nav.fallbackTitle')}
          </h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              {navItems.map(item => {
                if (item.requiresTournament && !hasTournament) return null
                const isActive = state.currentPage === item.page
                return (
                  <button
                    key={item.page}
                    onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: item.page } })}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white shadow-[inset_0_-2px_0_white]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                )
              })}
            </nav>
            <button
              onClick={toggleLocale}
              className="ml-1 px-2 py-1 rounded text-xs font-bold bg-white/15 hover:bg-white/25 transition-colors uppercase"
            >
              {nextLocale}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
