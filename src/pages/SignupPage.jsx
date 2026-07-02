import { useState } from 'react'
import AuthForm from '../components/auth/AuthForm.jsx'
import AuthShell from '../components/auth/AuthShell.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { navigateTo } from '../utils/routes.js'
import { getFriendlyError } from '../utils/errorMessages.js'

export default function SignupPage() {
  const { signUp, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!isConfigured) {
      setError('Project Atlas needs its Supabase connection before account creation is available.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await signUp(email, password)
    setLoading(false)

    if (signUpError) {
      setError(getFriendlyError(signUpError, 'Account creation failed. Check the email and password, then try again.'))
      return
    }

    if (data.session) {
      navigateTo('/dashboard')
      return
    }

    setMessage('Signup successful. Check your email to confirm your account before signing in.')
  }

  return (
    <AuthShell
      eyebrow="New workspace access"
      title="Create your Atlas account"
      description="Create protected access for the Project Atlas MVP workspace."
    >
      <EnvironmentBanner className="mb-5" />
      <AuthForm
        mode="signup"
        email={email}
        password={password}
        loading={loading}
        error={error}
        message={message}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button type="button" onClick={() => navigateTo('/login')} className="font-semibold text-accentBlue hover:text-primary">
          Sign in
        </button>
      </p>
    </AuthShell>
  )
}
