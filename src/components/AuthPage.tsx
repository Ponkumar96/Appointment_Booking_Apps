import React, { useState } from 'react'
import { Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { sendOTP, verifyOTP, createUserProfile } from '../lib/supabase-auth'
import type { User, Clinic } from '../App'

interface AuthPageProps {
  onLogin: (user: User) => void
  handlerPhones: string[]
  clinicMainPhones: string[]
  clinics: Clinic[]
}

export default function AuthPage({ onLogin, handlerPhones, clinicMainPhones, clinics }: AuthPageProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    setError('')

    try {
      // For testing, allow immediate OTP step
      if (phone.includes('98765 43210') || phone === '98765 43210') {
        setStep('otp')
        setLoading(false)
        return
      }

      const result = await sendOTP(phone)
      if (result.success) {
        setStep('otp')
      } else {
        setError('Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return

    setLoading(true)
    setError('')

    try {
      const result = await verifyOTP(phone, otp)
      
      if (result.success) {
        if (result.needsRegistration) {
          setStep('register')
        } else if (result.user) {
          // Convert Supabase user to app user format
          const isClinic = handlerPhones.includes(phone) || clinicMainPhones.includes(phone)
          const clinic = clinics.find(c => c.phone === phone || c.handlers.some(h => h.phone === phone))
          const handler = clinic?.handlers.find(h => h.phone === phone)

          const appUser: User = {
            id: result.user.id,
            phone: result.user.phone,
            name: result.user.name,
            role: isClinic ? 'clinic' : 'user',
            clinicId: clinic?.id,
            isHandler: !!handler,
            handlerName: handler?.name,
            isAdmin: clinic?.phone === phone // Main clinic phone = admin
          }
          
          onLogin(appUser)
        }
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const result = await createUserProfile({
        phone,
        name: name.trim(),
        email: undefined
      })

      if (result.success && result.user) {
        const isClinic = handlerPhones.includes(phone) || clinicMainPhones.includes(phone)
        const clinic = clinics.find(c => c.phone === phone || c.handlers.some(h => h.phone === phone))
        const handler = clinic?.handlers.find(h => h.phone === phone)

        const appUser: User = {
          id: result.user.id,
          phone: result.user.phone,
          name: result.user.name,
          role: isClinic ? 'clinic' : 'user',
          age: age ? parseInt(age) : undefined,
          clinicId: clinic?.id,
          isHandler: !!handler,
          handlerName: handler?.name,
          isAdmin: clinic?.phone === phone
        }
        
        onLogin(appUser)
      } else {
        setError('Failed to create account. Please try again.')
      }
    } catch (err) {
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    
    // Allow completely empty input
    if (input === '') {
      setPhone('')
      return
    }
    
    // Extract only digits from the input
    const digitsOnly = input.replace(/\D/g, '')
    
    // Limit to 10 digits max (for Indian mobile numbers)
    const limitedDigits = digitsOnly.slice(0, 10)
    
    // Format as XXXXX XXXXX for better readability
    if (limitedDigits.length === 0) {
      setPhone('')
    } else if (limitedDigits.length <= 5) {
      setPhone(limitedDigits)
    } else {
      setPhone(`${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-3xl">🏥</div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Appointments</h1>
            <p className="text-muted-foreground">
              {step === 'phone' && 'Enter your phone number to get started'}
              {step === 'otp' && 'Enter the verification code sent to your phone'}
              {step === 'register' && 'Complete your profile to continue'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    className="w-full pl-12 pr-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  For testing, use: 98765 43210 with OTP: 123456
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full py-4 px-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Code sent to {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to phone number
              </button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full py-4 px-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Age (Optional)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="1"
                  max="120"
                  className="w-full py-4 px-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('otp')}
                className="w-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to verification code
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}