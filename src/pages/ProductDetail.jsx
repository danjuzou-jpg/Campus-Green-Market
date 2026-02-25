import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MapPin, Phone, MessageSquare, Heart, Lock, Edit3, Flag } from 'lucide-react'
import { SkeletonDetail } from '../components/Skeleton.jsx'
import ReportModal from '../components/ReportModal.jsx'

const ProductDetail = () => {
  const { id } = useParams()
  const { listings, language, translations, startConversation, user, favorites, toggleFavorite, session, loading, showToast } = useMarketplace()
  const navigate = useNavigate()
  const t = translations[language]
  const item = listings.find(l => l.id === id)

  // Hooks must be called before any conditional returns (React Rules of Hooks)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [showReport, setShowReport] = useState(false)

  if (loading.products) return <SkeletonDetail />
  if (!item) return <div className="mx-auto max-w-md px-4 pt-4">{t.noItemsFound}</div>

  const images = item.imageUrls || [item.imageUrl]
  const isOwner = session?.user?.id && session.user.id === item.owner_id

  const handleChat = async () => {
    if (!user || user.verificationStatus !== 'verified') {
      showToast('warning', language === 'zh' ? '请先完成认证' : 'Please verify first')
      navigate('/profile')
      return
    }
    const convId = await startConversation(item)
    if (convId) {
      navigate(`/chat/${convId}`)
    } else {
      showToast('error', language === 'zh' ? '无法开启对话' : 'Failed to start conversation')
    }
  }

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hi, I'm interested in: ${item.title}`)
    const number = item.whatsapp || item.contact || ''
    if (number) window.open(`https://wa.me/${number}?text=${text}`, '_blank')
  }
  const copyWeChat = async () => {
    const wid = item.wechat || ''
    if (!wid) return
    try { await navigator.clipboard.writeText(wid) } catch { }
    showToast('success', t.wechatCopied)
  }

  return (
    <div className="min-h-screen bg-white pb-[80px] md:pb-0">
      <div className="mx-auto max-w-6xl md:p-8">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          {/* Images */}
          <div className="relative group">
            <div className="w-full aspect-square md:rounded-3xl overflow-hidden bg-gray-50 relative">
              <img src={images[activeImageIdx]} alt={item.title} className="w-full h-full object-contain md:object-cover mix-blend-multiply" onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22system-ui%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E' }} />
              <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm md:hidden text-gray-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
              </button>
              {/* Edit button for owner */}
              {isOwner && (
                <button
                  onClick={() => navigate(`/edit/${item.id}`)}
                  className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
              )}
              {!isOwner && session && (
                <button
                  onClick={() => setShowReport(true)}
                  className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Flag size={16} />
                </button>
              )}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 px-4 md:static md:mt-4 md:px-0">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:justify-center">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${activeImageIdx === idx ? 'border-emerald-500 shadow-lg scale-105' : 'border-transparent bg-gray-100 opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="relative -mt-6 bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:mt-0 md:shadow-none md:p-0 md:bg-transparent">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 md:hidden" />
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{item.title}</h1>
                  <div className="text-emerald-600 text-2xl md:text-3xl font-black whitespace-nowrap">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</div>
                </div>
                {item.locationName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                    <MapPin size={14} />
                    <span>{item.locationName}</span>
                  </div>
                )}
              </div>

              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full border border-gray-100 bg-gray-50 text-gray-600 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-colors">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.productDesc}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {item.description || t.noDescription}
                </p>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:block pt-8 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  {user.verificationStatus === 'verified' ? (
                    <>
                      <button onClick={handleChat} className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95">
                        <MessageSquare size={20} />
                        <span>{t.chat}</span>
                      </button>
                      <button onClick={openWhatsApp} disabled={!(item.whatsapp || item.contact)} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${item.whatsapp || item.contact ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        <Phone size={18} /> WhatsApp
                      </button>
                      <button onClick={copyWeChat} disabled={!item.wechat} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${item.wechat ? 'border-blue-500 text-blue-600 hover:bg-blue-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        <MessageSquare size={18} /> WeChat
                      </button>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-3">
                      <button onClick={() => navigate('/profile')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 rounded-xl py-4 font-bold transition-all hover:bg-gray-200">
                        <Lock size={18} />
                        <span>{t.verifyToChat}</span>
                      </button>
                      <div className="flex gap-4 opacity-50 pointer-events-none grayscale">
                        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 border-gray-100 text-gray-300"><Phone size={18} /> WhatsApp</button>
                        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 border-gray-100 text-gray-300"><MessageSquare size={18} /> WeChat</button>
                      </div>
                      <div className="text-center text-[10px] text-orange-500 font-bold bg-orange-50 py-2 rounded-lg">{t.verifyRequired}</div>
                    </div>
                  )}

                  <button onClick={() => toggleFavorite(item.id)} className={`col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${favorites.includes(item.id) ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <Heart size={18} className={favorites.includes(item.id) ? 'fill-red-500' : ''} />
                    <span>{favorites.includes(item.id) ? t.saved : t.addToFavorites}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 md:hidden z-50 flex items-center justify-between gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-medium">{t.price}</span>
          <span className="text-xl font-black text-emerald-600 leading-none">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</span>
        </div>

        {user.verificationStatus === 'verified' ? (
          <div className="flex items-center gap-2">
            <button onClick={openWhatsApp} disabled={!(item.whatsapp || item.contact)} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${item.whatsapp || item.contact ? 'border-green-200 bg-green-50 text-green-600' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
              <Phone size={18} />
            </button>
            <button onClick={copyWeChat} disabled={!item.wechat} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${item.wechat ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
              <MessageSquare size={18} />
            </button>
            <button onClick={handleChat} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 py-2.5 font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2">
              <MessageSquare size={18} />
              <span>{t.chat}</span>
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/profile')} className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2.5 font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <Lock size={16} />
            <span>{t.verifyToContact}</span>
          </button>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          type="product"
          targetId={item.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

export default ProductDetail
