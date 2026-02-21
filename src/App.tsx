import { TournamentProvider } from './state/TournamentContext'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { I18nProvider } from './i18n'

export function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <TournamentProvider>
          <AppShell />
        </TournamentProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
