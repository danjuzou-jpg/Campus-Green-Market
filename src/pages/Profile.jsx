import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { CheckCircle, Trash2 } from 'lucide-react'

const Profile = () => {
  const { listings, favorites, user, language, translations, verifyStudent, logoutUser, setUserAvatar, updateUser, deleteProduct } = useMarketplace()
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
  const fileRef = useRef(null)
  
  // Profile Edit State
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(user.name || '')
  const [schoolInput, setSchoolInput] = useState(user.school || '')

  const myListings = useMemo(() => listings.filter(l => l.owner === 'me'), [listings])
  const favoriteItems = useMemo(() => listings.filter(l => favorites.includes(l.id)), [listings, favorites])

  const Card = ({ item, isOwner }) => (
    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-100 bg-white relative group">
      <Link to={`/product/${item.id}`} className="block">
        <div className="w-full aspect-[4/3]">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-2">
          <div className="text-sm text-gray-900 truncate font-medium">{item.title}</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-indigo-600 font-bold text-sm">RM {item.price}</div>
            <div className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.category || 'Others'}</div>
          </div>
        </div>
      </Link>
      {isOwner && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete(item.id);
          }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-700 p-1.5 rounded-lg border border-red-100 shadow-sm transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )

  const handleDelete = (id) => {
    if (window.confirm(language === 'zh' ? '确定下架该商品吗？' : 'Confirm to delete this item?')) {
      deleteProduct(id);
    }
  };

  const Empty = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center text-gray-400 py-10 w-full col-span-2">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <div className="w-8 h-8 rounded bg-gray-100" />
      </div>
      <div className="text-xs">{text}</div>
    </div>
  )

  const handleSaveProfile = () => {
    const name = nameInput.trim()
    const school = schoolInput.trim()
    if (!name || !school) return
    updateUser({ name, school })
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <img 
            onClick={() => fileRef.current?.click()} 
            src={user.avatar || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80'} 
            alt="avatar" 
            className="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-indigo-50" 
          />
          <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full shadow-md">
            <div className="w-3 h-3 flex items-center justify-center text-[8px]">+</div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (!f) return
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result
            if (typeof base64 === 'string') setUserAvatar(base64)
          }
          reader.readAsDataURL(f)
        }} />
        
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input 
                value={nameInput} 
                onChange={e => setNameInput(e.target.value)} 
                placeholder={language === 'zh' ? '用户名' : 'Username'}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
              />
              <input 
                value={schoolInput} 
                onChange={e => setSchoolInput(e.target.value)} 
                placeholder={language === 'zh' ? '学校名称' : 'School Name'}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
              />
              <button
                onClick={handleSaveProfile}
                className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm"
              >
                {language === 'zh' ? '保存修改' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-gray-900 truncate">{user.name}</div>
                {user.verified && <CheckCircle size={18} className="text-green-600 shrink-0" />}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                <span className="shrink-0">{language === 'zh' ? '学校:' : 'School:'}</span>
                <span className="truncate">{user.school || 'Universiti Malaya'}</span>
              </div>
              <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium ${user.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.verified ? (language === 'zh' ? '已通过学生认证 ✅' : 'Verified Student ✅') : (language === 'zh' ? '未认证' : 'Unverified')}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            if (editing) {
              setNameInput(user.name)
              setSchoolInput(user.school)
            }
            setEditing(e => !e)
          }}
          className={`flex-1 rounded-xl py-3 text-sm font-medium shadow-sm transition-colors ${editing ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200 text-gray-900'}`}
        >
          {language === 'zh' ? (editing ? '取消' : '编辑资料') : (editing ? 'Cancel' : 'Edit Profile')}
        </button>
        {!user.verified && (
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-green-500 text-white rounded-xl py-3 text-sm font-medium shadow-sm active:bg-green-600"
          >
            {t.verifyStudent}
          </button>
        )}
      </div>

      <div className="mt-6">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setTab('my')} 
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'my' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            {language === 'zh' ? '我发布的' : 'My Listings'}
            {tab === 'my' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-t" />}
          </button>
          <button 
            onClick={() => setTab('fav')} 
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'fav' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            {language === 'zh' ? '收藏夹' : 'Favorites'}
            {tab === 'fav' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-t" />}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 pb-20">
          {tab === 'my' && (myListings.length ? myListings.map(item => (
            <Card key={item.id} item={item} isOwner={true} />
          )) : <Empty text={language === 'zh' ? '暂无发布的商品' : 'No listings yet'} />)}
          {tab === 'fav' && (favoriteItems.length ? favoriteItems.map(item => (
            <Card key={item.id} item={item} isOwner={false} />
          )) : <Empty text={language === 'zh' ? '暂无收藏的商品' : 'No favorites yet'} />)}
        </div>
      </div>

      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
        <button
          onClick={() => {
            if (confirm(language === 'zh' ? '确定要退出登录吗？' : 'Are you sure to log out?')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
          className="w-full bg-white text-red-500 border border-red-100 rounded-xl py-3 text-sm font-medium shadow-sm active:bg-red-50"
        >
          {t.logout}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="text-xl font-bold text-gray-900">{language === 'zh' ? '学生认证' : 'Student Verification'}</div>
              <div className="mt-4 flex bg-gray-50 p-1 rounded-xl">
                <button
                  onClick={() => setVerifyMethod('email')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${verifyMethod === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                >
                  {language === 'zh' ? '邮箱认证' : 'Email'}
                </button>
                <button
                  onClick={() => setVerifyMethod('file')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${verifyMethod === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                >
                  {language === 'zh' ? '文件认证' : 'File'}
                </button>
              </div>
            </div>
            <div className="p-6">
              {verifyMethod === 'email' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5 ml-1">{language === 'zh' ? '学生邮箱 (*.edu.my)' : 'Student Email (*.edu.my)'}</div>
                    <input
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="name@school.edu.my"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {emailError && <div className="mt-1.5 text-[10px] text-red-500 ml-1">{emailError}</div>}
                  </div>
                  {!codeSent ? (
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
                      className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-indigo-200"
                    >
                      {language === 'zh' ? '发送验证码' : 'Send Code'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        placeholder={language === 'zh' ? '输入验证码' : 'Enter verification code'}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCodeSent(false)
                            setCodeInput('')
                            setEmailError('')
                          }}
                          className="text-[10px] text-gray-400 underline"
                        >
                          {language === 'zh' ? '修改邮箱' : 'Change Email'}
                        </button>
                      </div>
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
                        className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-green-200"
                      >
                        {language === 'zh' ? '完成认证' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {verifyMethod === 'file' && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-500 ml-1">{language === 'zh' ? '上传 Offer Letter / 学生证' : 'Upload Offer Letter / Student ID'}</div>
                  <label className="block">
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="text-2xl mb-2">📄</div>
                      <div className="text-[10px] font-medium">{language === 'zh' ? '点击或拖拽上传' : 'Click or drag to upload'}</div>
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
                          const pct = Math.min(100, Math.round((elapsed / 1500) * 100))
                          setUploadProgress(pct)
                          if (pct >= 100) {
                            clearInterval(progressTimer)
                            setTimeout(() => {
                              verifyStudent()
                              setShowModal(false)
                              setIsUploading(false)
                              setUploadProgress(0)
                            }, 500)
                          }
                        }, 50)
                      }}
                    />
                  </label>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-gray-500 px-1">
                        <span>{language === 'zh' ? '上传中...' : 'Uploading...'}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }} 
                        />
                      </div>
                    </div>
                  )}
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
