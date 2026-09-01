import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
})

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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </StrictMode>,
)
