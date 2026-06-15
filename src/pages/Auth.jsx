import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MALAYSIAN_UNIVERSITIES, detectSchoolFromEmail, isAllowedStudentEmail } from '../lib/schools.js'
import Logo from '../components/Logo'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, School, ChevronDown } from 'lucide-react'

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

    // 新生注册模式状态
    const [regType, setRegType] = useState('student') // 'student' | 'freshman'
    const [offerFile, setOfferFile] = useState(null)

    // 学校选择状态（注册用）
    const [manualSchool, setManualSchool] = useState('')
    const [showSchoolPicker, setShowSchoolPicker] = useState(false)
    const [customSchoolName, setCustomSchoolName] = useState('')

    React.useEffect(() => {
        // Detect if coming from a password recovery link
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
            setMode('update')
        }
    }, [])

    // 根据邮箱后缀自动检测学校
    const detectedSchool = useMemo(() => {
        if (mode !== 'register' || !email) return null
        return detectSchoolFromEmail(email)
    }, [email, mode])

    // 最终的学校名称（用于注册写入 profiles.school）
    const resolvedSchoolName = useMemo(() => {
        if (detectedSchool) return detectedSchool.en
        if (manualSchool === 'Other') return customSchoolName.trim() || 'Unknown University'
        if (manualSchool) {
            const uni = MALAYSIAN_UNIVERSITIES.find(u => u.key === manualSchool)
            return uni ? uni.en : manualSchool
        }
        return ''
    }, [detectedSchool, manualSchool, customSchoolName])

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
                if (regType === 'student' && !isAllowedStudentEmail(email)) {
                    throw new Error(text.eduEmailRequired)
                }

                // 学校必须确定（自动检测到 或 手动选择了）
                if (!resolvedSchoolName) {
                    throw new Error(language === 'zh'
                        ? '请选择你的学校'
                        : 'Please select your university')
                }

                if (regType === 'freshman' && !offerFile) {
                    throw new Error(language === 'zh' ? '请上传Offer录取通知书图片' : 'Please upload your Offer image')
                }

                let finalOfferUrl = null
                if (regType === 'freshman' && offerFile) {
                    const fileExt = offerFile.name.split('.').pop()
                    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
                    
                    // 因为未登录，传到可匿名写入的 verification-offers 桶
                    const { error: uploadError } = await supabase.storage
                        .from('verification-offers')
                        .upload(fileName, offerFile, { upsert: false })

                    if (uploadError) {
                        throw new Error(language === 'zh' ? `Offer图片上传失败: ${uploadError.message}` : `Failed to upload Offer: ${uploadError.message}`)
                    }
                    finalOfferUrl = fileName
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName || email.split('@')[0],
                            school: resolvedSchoolName,
                            is_freshman: regType === 'freshman',
                            offer_url: finalOfferUrl
                        }
                    }
                })
                if (error) throw error
                if (data?.user && data.user.identities && data.user.identities.length === 0) {
                    throw new Error(language === 'zh' ? '该邮箱已被注册或限流，请直接登录' : 'Email already registered or rate-limited. Please log in.')
                }
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

    // 邮箱后缀无法自动识别或是新生模式时，都需要手动选择学校
    const needsManualSchool = mode === 'register' && (regType === 'freshman' || (email.includes('@') && !detectedSchool && isAllowedStudentEmail(email)))

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
            {/* Top decoration */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4">
                        <Logo className="w-full h-full" />
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

                        {/* Registration Type Toggle */}
                        {mode === 'register' && (
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                                <button
                                    type="button"
                                    onClick={() => setRegType('student')}
                                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${regType === 'student' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {language === 'zh' ? '在校生认证' : 'Student'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegType('freshman')}
                                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${regType === 'freshman' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {language === 'zh' ? '新生Offer认证' : 'Freshman'}
                                </button>
                            </div>
                        )}

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
                                    {mode === 'register'
                                        ? (regType === 'freshman' ? (language === 'zh' ? '个人邮箱' : 'Personal Email') : (language === 'zh' ? '学生邮箱' : 'Student Email'))
                                        : text.email}
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={mode === 'register'
                                            ? (regType === 'freshman' ? (language === 'zh' ? '输入常用的个人邮箱' : 'Enter personal email') : (language === 'zh' ? '输入你的学生邮箱 (.edu.my)' : 'Enter student email (.edu.my)'))
                                            : text.emailInputPlaceholder}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* 自动检测到学校的显示 */}
                                {mode === 'register' && detectedSchool && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 mt-1">
                                        <School size={14} className="text-emerald-600 shrink-0" />
                                        <span className="text-xs font-bold text-emerald-700">
                                            {language === 'zh' ? detectedSchool.zh : detectedSchool.en}
                                        </span>
                                        <span className="text-[10px] text-emerald-500 ml-auto">
                                            {language === 'zh' ? '✓ 自动识别' : '✓ Auto-detected'}
                                        </span>
                                    </div>
                                )}

                                {/* 手动选择学校（邮箱后缀匹配不到已知学校时） */}
                                {needsManualSchool && (
                                    <div className="space-y-2 mt-1">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                            <School size={14} className="text-amber-600 shrink-0" />
                                            <span className="text-[11px] font-medium text-amber-700">
                                                {language === 'zh'
                                                    ? '未能自动识别学校，请手动选择'
                                                    : 'School not auto-detected. Please select manually'}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={manualSchool}
                                                onChange={(e) => {
                                                    setManualSchool(e.target.value)
                                                    if (e.target.value !== 'Other') setCustomSchoolName('')
                                                }}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none font-medium"
                                            >
                                                <option value="">
                                                    {language === 'zh' ? '— 选择学校 —' : '— Select University —'}
                                                </option>
                                                {MALAYSIAN_UNIVERSITIES.map(uni => (
                                                    <option key={uni.key} value={uni.key}>
                                                        {language === 'zh' ? uni.zh : uni.en}
                                                    </option>
                                                ))}
                                                <option value="Other">
                                                    {language === 'zh' ? '其他 / Other' : 'Other'}
                                                </option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                        </div>

                                        {/* 选择 Other 时手动输入学校名 */}
                                        {manualSchool === 'Other' && (
                                            <input
                                                type="text"
                                                value={customSchoolName}
                                                onChange={(e) => setCustomSchoolName(e.target.value)}
                                                placeholder={language === 'zh' ? '输入你的学校全名' : 'Enter your university name'}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Freshman Offer Upload */}
                                {mode === 'register' && regType === 'freshman' && (
                                    <div className="space-y-2 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <label className="block text-[11px] font-bold text-amber-800">
                                            {language === 'zh' ? '上传 Offer / 录取通知书' : 'Upload Offer Letter'}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setOfferFile(e.target.files[0])}
                                            className="w-full text-[11px] text-amber-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 file:transition-colors file:cursor-pointer"
                                        />
                                    </div>
                                )}
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
