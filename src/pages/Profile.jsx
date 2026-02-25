import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { CheckCircle, Trash2, ChevronRight, MessageSquare, UserCircle, X, Mail, FileText, Camera, Edit3 } from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const { listings, favorites, user, language, translations, updateVerificationStatus, uploadAvatar, updateUser, deleteProduct, logoutUser, sendVerificationEmail, uploadVerificationDoc, showToast } = useMarketplace()
  const t = translations[language]
  const [tab, setTab] = useState('my')

  // Profile Edit State
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(user.name || '')
  const [schoolInput, setSchoolInput] = useState(user.school || '')

  // Verification Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('email') // 'email' | 'document'
  const [emailInput, setEmailInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Sync editing inputs when user changes
  useEffect(() => {
    setNameInput(user.name || '')
    setSchoolInput(user.school || '')
  }, [user.name, user.school])

  const myListings = useMemo(() => listings.filter(l => l.owner === 'me'), [listings])
  const favoriteItems = useMemo(() => listings.filter(l => favorites.includes(l.id)), [listings, favorites])

  const handleSaveProfile = () => {
    const name = nameInput.trim()
    const school = schoolInput.trim()
    if (!name || !school) return
    updateUser({ name, school })
    setEditing(false)
  }

  const handleSendCode = async () => {
    if (!emailInput.toLowerCase().endsWith('.edu.my')) {
      showToast('warning', language === 'zh' ? '请输入有效的学校邮箱 (*.edu.my)' : 'Please enter a valid school email (*.edu.my)')
      return
    }
    setSendingCode(true)
    try {
      await sendVerificationEmail(emailInput)
      setCodeSent(true)
      setCountdown(60)
    } catch (err) {
      console.error('Send OTP error:', err)
      showToast('error', err.message || 'Failed to send code')
    } finally {
      setSendingCode(false)
    }
  }

  const handleEmailSubmit = async () => {
    if (!emailInput.toLowerCase().endsWith('.edu.my')) {
      showToast('warning', language === 'zh' ? '请输入有效的学校邮箱 (*.edu.my)' : 'Please enter a valid school email (*.edu.my)')
      return
    }
    if (!codeInput.trim()) {
      showToast('warning', language === 'zh' ? '请输入验证码' : 'Please enter the code')
      return
    }
    setVerifyLoading(true)
    try {
      // Verify OTP with Supabase
      const { error } = await supabase.auth.verifyOtp({ email: emailInput, token: codeInput, type: 'email' })
      if (error) throw error

      await updateVerificationStatus('verified')
      setIsModalOpen(false)
      showToast('success', language === 'zh' ? '认证成功！' : 'Verified successfully!')
    } catch (err) {
      console.error('Verify OTP error:', err)
      showToast('error', err.message || (language === 'zh' ? '验证码错误' : 'Invalid code'))
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDocSubmit = async () => {
    if (!selectedFile) {
      showToast('warning', language === 'zh' ? '请先选择文件' : 'Please select a file first')
      return
    }
    setVerifyLoading(true)
    try {
      await uploadVerificationDoc(selectedFile)
      setIsModalOpen(false)
      showToast('success', language === 'zh' ? '资料已提交，请等待审核' : 'Submitted! Please wait for review.')
    } catch (err) {
      console.error('Upload doc error:', err)
      showToast('error', err.message || (language === 'zh' ? '上传失败' : 'Upload failed'))
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm(t.confirmDelete)) {
      deleteProduct(id)
    }
  }

  const Card = ({ item, isOwner }) => (
    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-100 bg-white relative group">
      <Link to={`/product/${item.id}`} className="block">
        <div className="w-full aspect-[4/3]">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-2">
          <div className="text-sm text-gray-900 truncate font-medium">{item.title}</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-emerald-600 font-bold text-sm">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</div>
            <div className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.category || 'Others'}</div>
          </div>
        </div>
      </Link>
      {isOwner && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${item.id}`) }}
            className="bg-white/90 backdrop-blur-sm text-emerald-500 hover:text-emerald-700 p-1.5 rounded-lg border border-emerald-100 shadow-sm transition-colors"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id) }}
            className="bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-700 p-1.5 rounded-lg border border-red-100 shadow-sm transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )

  const Empty = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center text-gray-400 py-10 w-full col-span-2">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <div className="w-8 h-8 rounded bg-gray-100" />
      </div>
      <div className="text-xs">{text}</div>
    </div>
  )

  const fileRef = useRef(null)

  return (
    <div className="mx-auto max-w-md min-h-screen flex flex-col bg-gray-50 pb-24 relative">
      {/* Area A: Top Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-4 pt-6 pb-6 rounded-b-[32px] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              onClick={() => fileRef.current?.click()}
              src={user.avatar || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80'}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover cursor-pointer border-4 border-white shadow-md"
            />
            <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
              <Camera size={10} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            uploadAvatar(f)
          }} />

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder={t.username}
                  className="w-full px-3 py-2 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/70 text-sm focus:ring-2 focus:ring-white outline-none transition-all"
                />
                <input
                  value={schoolInput}
                  onChange={e => setSchoolInput(e.target.value)}
                  placeholder={t.schoolName}
                  className="w-full px-3 py-2 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/70 text-sm focus:ring-2 focus:ring-white outline-none transition-all"
                />
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2 rounded-xl bg-white text-emerald-600 text-xs font-bold shadow-lg"
                >
                  {t.saveChanges}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-black text-white truncate">{user.name}</div>
                  {user.verificationStatus === 'verified' && <CheckCircle size={18} className="text-white shrink-0" />}
                </div>
                <div className="text-xs text-emerald-50 font-medium truncate mt-0.5">
                  {user.school || 'Universiti Malaya'}
                </div>

                {/* Status Badges or Verify Button */}
                <div className="mt-3">
                  {user.verificationStatus === 'unverified' && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full shadow-md active:scale-95 transition-all"
                    >
                      {t.verifyNow}
                    </button>
                  )}
                  {user.verificationStatus === 'pending' && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-[10px] font-black shadow-sm">
                      <span className="animate-pulse">⏳</span>
                      {t.pendingBadge}
                    </div>
                  )}
                  {user.verificationStatus === 'verified' && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white border border-emerald-400 rounded-full text-[10px] font-black">
                      <span>✅</span>
                      {t.verifiedBadge}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Area B: Menu List */}
      <div className="px-4 mt-6 space-y-3">
        <button
          onClick={() => navigate('/inbox')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageSquare size={20} />
            </div>
            <span className="text-sm font-bold text-gray-700">{t.myInbox}</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => {
            if (editing) {
              setNameInput(user.name)
              setSchoolInput(user.school)
            }
            setEditing(e => !e)
          }}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCircle size={20} />
            </div>
            <span className="text-sm font-bold text-gray-700">{t.editProfile}</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Listings Section */}
      <div className="mt-8 px-4 flex-1">
        <div className="flex gap-4 border-b border-gray-100 px-2">
          <button
            onClick={() => setTab('my')}
            className={`pb-3 text-sm font-black transition-all relative ${tab === 'my' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {t.myListings}
            {tab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />}
          </button>
          <button
            onClick={() => setTab('fav')}
            className={`pb-3 text-sm font-black transition-all relative ${tab === 'fav' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {t.favorites}
            {tab === 'fav' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {tab === 'my' && (myListings.length ? myListings.map(item => (
            <Card key={item.id} item={item} isOwner={true} />
          )) : <Empty text={t.noListings} />)}
          {tab === 'fav' && (favoriteItems.length ? favoriteItems.map(item => (
            <Card key={item.id} item={item} isOwner={false} />
          )) : <Empty text={t.noFavorites} />)}
        </div>
      </div>

      {/* Area C: Bottom Operations */}
      <div className="mt-12 px-4 pb-10">
        <button
          onClick={async () => {
            if (confirm(t.confirmLogout)) {
              await logoutUser()
              navigate('/auth')
            }
          }}
          className="w-full py-4 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
        >
          {t.logout}
        </button>
      </div>

      {/* VERIFICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-50 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-gray-900">{t.verification}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex p-1.5 bg-gray-50 mx-6 mt-6 rounded-2xl">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                <Mail size={14} />
                {t.campusEmail}
              </button>
              <button
                onClick={() => setActiveTab('document')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'document' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                <FileText size={14} />
                {t.uploadIdCard}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pb-10">
              {activeTab === 'email' ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.campusEmail}</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="yourname@student.edu.my"
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      />
                      <button
                        onClick={handleSendCode}
                        disabled={sendingCode || countdown > 0}
                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white text-[10px] font-bold px-4 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingCode ? t.sendingCode : countdown > 0 ? `${t.resendIn} ${countdown}s` : t.sendCode}
                      </button>
                    </div>
                    {codeSent && (
                      <div className="text-[10px] text-emerald-600 font-bold ml-1">{t.codeSent}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.verificationCode}</label>
                    <input
                      type="text"
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none tracking-[0.3em] text-center font-mono"
                    />
                  </div>
                  <button
                    onClick={handleEmailSubmit}
                    disabled={verifyLoading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all mt-2 disabled:opacity-50"
                  >
                    {verifyLoading ? t.loading : t.verifyInstantly}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-100 rounded-[24px] p-10 text-center bg-gray-50 relative group hover:bg-gray-100 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                      </div>
                      <div className="text-[11px] font-black text-gray-600">
                        {selectedFile ? selectedFile.name : t.uploadHint}
                      </div>
                      <p className="text-[10px] text-gray-400 px-4">{t.uploadFormats}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                      {t.reviewHint}
                    </p>
                  </div>
                  <button
                    onClick={handleDocSubmit}
                    disabled={verifyLoading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {verifyLoading ? t.loading : t.submitForReview}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
