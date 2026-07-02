import { useState } from 'react'
import AuthForm from '../components/auth/AuthForm.jsx'
import AuthShell from '../components/auth/AuthShell.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { navigateTo } from '../utils/routes.js'
import { getFriendlyError } from '../utils/errorMessages.js'

export default function LoginPage() {
  const { signIn, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isConfigured) {
      setError('Project Atlas needs its Supabase connection before sign in is available.')
      return
    }

    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError(getFriendlyError(signInError, 'Sign in failed. Check the email and password, then try again.'))
      return
    }

    navigateTo('/dashboard')
  }

  return (
    <AuthShell
      eyebrow="Secure access"
      title="Sign in to the Atlas dashboard"
      description="Access the protected Project Atlas workspace for catalog review and AR-CERT-PRO DOCX generation."
    >
      <EnvironmentBanner className="mb-5" />
      <AuthForm
        mode="login"
        email={email}
        password={password}
        loading={loading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />
      <p className="mt-6 text-center text-sm text-slate-600">
        Need an account?{' '}
        <button type="button" onClick={() => navigateTo('/signup')} className="font-semibold text-accentBlue hover:text-primary">
          Create one
        </button>
      </p>
    </AuthShell>
  )
}
