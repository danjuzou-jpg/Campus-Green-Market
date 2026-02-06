import React, { useMemo, useState } from 'react'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { CheckCircle } from 'lucide-react'

const Profile = () => {
  const { listings, favorites, user, language, translations, verifyStudent, logoutUser } = useMarketplace()
  const t = translations[language]
  const [tab, setTab] = useState('my')
  const [showModal, setShowModal] = useState(false)
  const [verifyMethod, setVerifyMethod] = useState('email')
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const myListings = useMemo(() => listings.filter(l => l.owner === 'me'), [listings])
  const favoriteItems = useMemo(() => listings.filter(l => favorites.includes(l.id)), [listings, favorites])

  const Card = ({ item }) => (
    <div className="rounded-xl shadow-sm overflow-hidden">
      <div className="w-full aspect-[4/3]">
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-2">
        <div className="text-sm text-gray-900">{item.title}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-indigo-600 font-bold">RM {item.price}</div>
          <div className="text-xs text-gray-500">{item.category || 'Others'}</div>
        </div>
      </div>
    </div>
  )

  const Empty = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
      <div className="w-24 h-24 rounded-full bg-gray-100 mb-3" />
      <div className="text-sm">{text}</div>
    </div>
  )

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <div className="flex items-center gap-3">
        <img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80" alt="avatar" className="w-16 h-16 rounded-full object-cover" />
        <div>
          <div className="flex items-center gap-2">
            <div className="text-base font-bold">{user.name}</div>
            {user.verified && <CheckCircle size={16} className="text-green-600" />}
          </div>
          <div className="text-xs text-gray-500">School: Universiti Malaya</div>
          <div className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${user.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {user.verified ? (language === 'zh' ? '已认证 ✅' : 'Verified ✅') : (language === 'zh' ? '未认证' : 'Unverified')}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-100 p-3 text-center">
          <div className="text-lg font-bold">12</div>
          <div className="text-xs text-gray-600">{language === 'zh' ? '已售' : 'Sold'}</div>
        </div>
        <div className="rounded-xl bg-gray-100 p-3 text-center">
          <div className="text-lg font-bold">4.8</div>
          <div className="text-xs text-gray-600">{language === 'zh' ? '评分' : 'Rating'}</div>
        </div>
        <div className="rounded-xl bg-gray-100 p-3 text-center">
          <div className="text-lg font-bold">{myListings.length}</div>
          <div className="text-xs text-gray-600">{language === 'zh' ? '在售' : 'Listings'}</div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-green-500 text-white rounded-xl py-3 text-sm font-medium shadow-sm"
        >
          {t.verifyStudent}
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={() => setTab('my')} className={`px-3 py-1 rounded-full text-xs ${tab === 'my' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{language === 'zh' ? '我发布的' : 'My Listings'}</button>
        <button onClick={() => setTab('fav')} className={`px-3 py-1 rounded-full text-xs ${tab === 'fav' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{language === 'zh' ? '收藏' : 'Favorites'}</button>
      </div>

      <div className="mt-4 columns-2 gap-3">
        {tab === 'my' && (myListings.length ? myListings.map(item => (
          <div key={item.id} className="mb-3 break-inside-avoid">
            <Card item={item} />
          </div>
        )) : <Empty text={language === 'zh' ? '暂无发布的商品' : 'No listings yet'} />)}
        {tab === 'fav' && (favoriteItems.length ? favoriteItems.map(item => (
          <div key={item.id} className="mb-3 break-inside-avoid">
            <Card item={item} />
          </div>
        )) : <Empty text={language === 'zh' ? '暂无收藏的商品' : 'No favorites yet'} />)}
      </div>

      <div className="mt-6">
        <button
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="w-full bg-red-500 text-white rounded-xl py-3 text-sm font-medium shadow-sm"
        >
          {language === 'zh' ? '退出登录' : 'Log Out'}
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm bg-white rounded-2xl shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="text-base font-bold">{language === 'zh' ? '学生认证' : 'Student Verification'}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setVerifyMethod('email')}
                  className={`px-3 py-1 rounded-full text-xs ${verifyMethod === 'email' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'zh' ? '邮箱认证' : 'Email'}
                </button>
                <button
                  onClick={() => setVerifyMethod('file')}
                  className={`px-3 py-1 rounded-full text-xs ${verifyMethod === 'file' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'zh' ? '文件认证' : 'File'}
                </button>
              </div>
            </div>
            <div className="p-4">
              {verifyMethod === 'email' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">{language === 'zh' ? '请输入学生邮箱 (*.edu.my)' : 'Enter student email (*.edu.my)'}</div>
                    <input
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="name@school.edu.my"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {emailError && <div className="mt-1 text-xs text-red-600">{emailError}</div>}
                  </div>
                  {!codeSent && (
                    <button
                      onClick={() => {
                        const ok = emailInput.trim().toLowerCase().endsWith('.edu.my')
                        if (!ok) {
                          setEmailError(language === 'zh' ? '请使用有效的学生邮箱 (*.edu.my)' : 'Please use a valid student email (*.edu.my)')
                          return
                        }
                        setEmailError('')
                        setCodeSent(true)
                        alert('Verification code: 8888')
                      }}
                      className="w-full bg-indigo-600 text-white rounded-xl py-2 text-sm"
                    >
                      {language === 'zh' ? '发送验证码' : 'Send Code'}
                    </button>
                  )}
                  {codeSent && (
                    <div className="space-y-2">
                      <input
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        placeholder={language === 'zh' ? '输入验证码' : 'Enter verification code'}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCodeSent(false)
                          setCodeInput('')
                          setEmailError('')
                        }}
                        className="text-xs text-gray-500 underline"
                      >
                        {language === 'zh' ? '修改邮箱' : 'Change Email'}
                      </button>
                      <button
                        onClick={() => {
                          if (codeInput.trim() === '8888') {
                            verifyStudent()
                            setShowModal(false)
                            setCodeInput('')
                            setEmailInput('')
                            setCodeSent(false)
                          } else {
                            alert(language === 'zh' ? '验证码错误' : 'Incorrect code')
                          }
                        }}
                        className="w-full bg-green-600 text-white rounded-xl py-2 text-sm"
                      >
                        {language === 'zh' ? '完成认证' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {verifyMethod === 'file' && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">{language === 'zh' ? '上传 Offer Letter / 学生证' : 'Upload Offer Letter / Student ID'}</div>
                  <label className="block">
                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-xs">
                      {language === 'zh' ? '点击选择文件' : 'Click to choose file'}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={() => {
                        setUploadProgress(0)
                        setIsUploading(true)
                        const start = Date.now()
                        const progressTimer = setInterval(() => {
                          const elapsed = Date.now() - start
                          const pct = Math.min(100, Math.round((elapsed / 2000) * 100))
                          setUploadProgress(pct)
                          if (pct >= 100) {
                            clearInterval(progressTimer)
                          }
                        }, 100)
                        setTimeout(() => {
                          setIsUploading(false)
                          verifyStudent()
                          alert(language === 'zh' ? '验证成功' : 'Verification Successful')
                          setShowModal(false)
                        }, 2000)
                      }}
                    />
                  </label>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-indigo-600" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  {isUploading && (
                    <button
                      disabled
                      className="w-full bg-indigo-600/60 text-white rounded-xl py-2 text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {language === 'zh' ? '正在上传与审核…' : 'Uploading & Verifying...'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm">
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
