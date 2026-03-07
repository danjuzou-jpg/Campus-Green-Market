import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import Logo from '../components/Logo'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'

const Auth = () => {
    const navigate = useNavigate()
    const { language, translations } = useMarketplace()
    const text = translations[language] || translations['en']

    const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'update'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    React.useEffect(() => {
        // Detect if coming from a password recovery link
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
            setMode('update')
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        setError('')
        setSuccessMessage('')
        setLoading(true)

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                navigate('/home')
            } else if (mode === 'register') {
                // 校园邮箱域名限制：仅允许 .edu.my 邮箱注册
                if (!email.toLowerCase().endsWith('.edu.my')) {
                    throw new Error(text.eduEmailRequired)
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName || email.split('@')[0]
                        }
                    }
                })
                if (error) throw error
                setSuccessMessage(text.registerSuccess)
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth`
                })
                if (error) throw error
                setSuccessMessage(text.resetEmailSent)
            } else if (mode === 'update') {
                const { error } = await supabase.auth.updateUser({ password })
                if (error) throw error
                setSuccessMessage(text.passwordUpdated)
                setTimeout(() => setMode('login'), 2000)
            }
        } catch (err) {
            console.error('Auth error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleGuestBrowse = () => {
        localStorage.setItem('hasVisited', 'true')
        navigate('/home')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
            {/* Top decoration */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4">
                        <Logo />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">
                        {mode === 'login' ? text.loginTitle : mode === 'register' ? text.registerTitle : mode === 'forgot' ? text.resetPasswordTitle : text.newPasswordTitle}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {mode === 'login' ? text.loginSubtitle : mode === 'register' ? text.registerSubtitle : mode === 'forgot' ? text.resetPasswordSubtitle : text.newPasswordSubtitle}
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-sm">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-emerald-500/5 border border-gray-100 p-6 space-y-4">

                        {/* Name field (register only) */}
                        {mode === 'register' && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    {text.fullName}
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder={text.namePlaceholder}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {mode !== 'update' && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    {text.email}
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={text.emailInputPlaceholder}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        {mode !== 'forgot' && (
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    {mode === 'update' ? text.newPasswordTitle : text.password}
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={text.passwordInputPlaceholder}
                                        required
                                        minLength={6}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {mode === 'login' && (
                                    <div className="flex justify-end mt-1">
                                        <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                                            {text.forgotPassword}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-medium px-4 py-3 rounded-xl">
                                {successMessage}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{mode === 'login' ? text.login : mode === 'register' ? text.register : mode === 'forgot' ? text.sendResetLink : text.updatePassword}</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch Mode */}
                    {mode === 'login' || mode === 'register' ? (
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login')
                                setError('')
                                setSuccessMessage('')
                            }}
                            className="w-full text-center text-sm text-emerald-600 font-bold mt-4 py-2 hover:text-emerald-700 transition-colors"
                        >
                            {mode === 'login' ? text.switchToRegister : text.switchToLogin}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setMode('login')
                                setError('')
                                setSuccessMessage('')
                            }}
                            className="w-full text-center text-sm text-emerald-600 font-bold mt-4 py-2 hover:text-emerald-700 transition-colors"
                        >
                            {text.backToLogin}
                        </button>
                    )}

                    {(mode === 'login' || mode === 'register') && (
                        <>
                            {/* Divider */}
                            <div className="flex items-center gap-4 my-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">{text.orContinueWith}</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Guest Mode */}
                            <button
                                onClick={handleGuestBrowse}
                                className="w-full border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                            >
                                {text.guestMode}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom branding */}
            <div className="text-center pb-8">
                <p className="text-[10px] text-gray-300 font-medium">2H Marketplace — 2nd Hand, Made Easy</p>
            </div>
        </div>
    )
}

export default Auth
