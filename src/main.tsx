import '@fontsource/nunito/500.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { idbStorage } from '@/lib/idb'
import './styles/tokens.css'
import './styles/globals.css'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AppShell } from '@/app/AppShell'
import { Guard } from '@/app/Guard'
import { RedirectIfAuthed } from '@/app/RedirectIfAuthed'
import { TAB_ROUTES } from '@/app/routes'
import { Login } from '@/screens/auth/Login'
import { SignUp } from '@/screens/auth/SignUp'
import { Onboarding } from '@/screens/onboarding/Onboarding'

/** How long the offline mirror stays usable without a successful sync. */
const PERSIST_MAX_AGE = 30 * 24 * 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: {
    // gcTime must outlive maxAge or queries get collected before they can persist
    queries: { retry: 1, refetchOnWindowFocus: true, gcTime: PERSIST_MAX_AGE },
  },
})

const persister = createAsyncStoragePersister({ storage: idbStorage })

function OnboardingRoute() {
  const navigate = useNavigate()
  const client = useQueryClient()
  return (
    <Onboarding
      onDone={async () => {
        await client.invalidateQueries({ queryKey: ['bootstrap'] })
        navigate('/hoje', { replace: true })
      }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/entrar"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/criar-conta"
              element={
                <RedirectIfAuthed>
                  <SignUp />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/inicio"
              element={
                <Guard>
                  <OnboardingRoute />
                </Guard>
              }
            />
            <Route
              element={
                <Guard>
                  <AppShell />
                </Guard>
              }
            >
              {TAB_ROUTES.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>
            <Route path="*" element={<Navigate to="/hoje" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)
