import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MapPin, Phone, MessageSquare, Heart, Lock, Edit3, Flag, ExternalLink, ChevronRight, Building2, Calendar, Send, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { SkeletonDetail } from '../components/Skeleton.jsx'
import ReportModal from '../components/ReportModal.jsx'
import { getUserDisplayStatus } from '../lib/userStatus.js'

const ProductDetail = () => {
  const { id } = useParams()
  const { getProductById, language, translations, findConversation, user, favorites, toggleFavorite, session, showToast } = useMarketplace()
  const navigate = useNavigate()
  const t = translations[language]

  const [item, setItem] = useState(null)
  const [loadingItem, setLoadingItem] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoadingItem(true)
    getProductById(id, session?.user?.id).then(res => {
      if (mounted) {
        setItem(res)
        setLoadingItem(false)
      }
    })
    return () => { mounted = false }
  }, [id, getProductById, session?.user?.id])

  // Hooks must be called before any conditional returns (React Rules of Hooks)
  const [showReport, setShowReport] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [sellerProfile, setSellerProfile] = useState(null)

  // Comments state (for rental posts)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (item?.owner_id) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url, school, verification_status, created_at')
        .eq('id', item.owner_id)
        .single()
        .then(({ data }) => {
          if (data) {
            data.displayStatus = getUserDisplayStatus(data)
            setSellerProfile(data)
          }
        })
    }
  }, [item?.owner_id])

  // Fetch comments for rental-type listings
  useEffect(() => {
    if (!item || item.listingType !== 'rental') return
    setLoadingComments(true)
    supabase
      .from('comments')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('product_id', item.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments(data || [])
        setLoadingComments(false)
      })
  }, [item?.id, item?.listingType])

  const handleAddComment = async () => {
    if (!commentText.trim() || !session?.user?.id) return
    setSubmittingComment(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ product_id: item.id, user_id: session.user.id, content: commentText.trim() })
      .select('*, profiles:user_id(full_name, avatar_url)')
      .single()
    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
    setSubmittingComment(false)
  }

  const handleDeleteComment = async (commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  if (loadingItem) return <SkeletonDetail />
  if (!item) return <div className="mx-auto max-w-md px-4 pt-4">{t.noItemsFound}</div>

  const images = item.imageUrls || [item.imageUrl]
  const isOwner = session?.user?.id && session.user.id === item.owner_id

  const handleScroll = (e) => {
    if (!e.target) return
    const scrollLeft = e.target.scrollLeft
    const width = e.target.clientWidth
    if (width > 0) {
      const idx = Math.round(scrollLeft / width)
      if (idx !== activeImageIdx) {
        setActiveImageIdx(idx)
      }
    }
  }

  const handleChat = async () => {
    if (!user || user.verificationStatus !== 'verified') {
      showToast('warning', language === 'zh' ? '请先完成认证' : 'Please verify first')
      navigate('/profile')
      return
    }
    // 查找已有会话
    const existingId = await findConversation(item.id)
    if (existingId) {
      navigate(`/chat/${existingId}`)
    } else {
      // 没有已有会话 → 跳转到新聊天页面（不创建 DB 记录）
      navigate(`/chat/new?productId=${item.id}`)
    }
  }

  const openWhatsApp = async () => {
    const text = encodeURIComponent(`Hi, I'm interested in: ${item.title}`)
    const number = item.whatsapp || item.contact || ''
    if (!number) return
    try { await navigator.clipboard.writeText(number) } catch { }
    showToast('success', t.whatsappRedirect)
    setTimeout(() => {
      window.open(`https://wa.me/${number}?text=${text}`, '_blank')
    }, 1500)
  }
  const copyWeChat = async () => {
    const wid = item.wechat || ''
    if (!wid) return
    try { await navigator.clipboard.writeText(wid) } catch { }
    showToast('success', t.wechatCopied || (language === 'zh' ? '微信号已复制到剪贴板，请在微信粘贴使用粘贴添加' : 'WeChat ID copied to clipboard. Please paste in WeChat to add.'))
  }

  return (
    <div className="min-h-screen pb-[140px] md:pb-0">
      <div className="mx-auto max-w-6xl md:p-8">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          {/* Images */}
          <div className="relative group w-full aspect-square md:rounded-[3rem] overflow-hidden bg-white/50 backdrop-blur-sm shadow-sm border border-white/60">
            {/* Scrollable Images Container */}
            <div
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
              onScroll={handleScroll}
            >
              {images.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                  <img src={img} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-contain md:object-cover mix-blend-multiply" onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22system-ui%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E' }} />
                </div>
              ))}
            </div>

            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm md:hidden text-gray-700 z-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            </button>
            {/* Edit button for owner */}
            {isOwner && (
              <button
                onClick={() => navigate(`/edit/${item.id}`)}
                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md text-emerald-600 hover:bg-emerald-50 transition-colors z-10"
              >
                <Edit3 size={18} />
              </button>
            )}
            {!isOwner && session && (
              <button
                onClick={() => setShowReport(true)}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors hidden md:block z-10"
              >
                <Flag size={16} />
              </button>
            )}
            {/* Mobile Favorite Button */}
            {!isOwner && (
              <button
                onClick={() => toggleFavorite(item.id)}
                className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-sm md:hidden text-slate-300 transition-all border border-white/50 z-10 active:scale-95"
              >
                <Heart size={20} className={favorites.includes(item.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
              </button>
            )}

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 pointer-events-none">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === activeImageIdx ? 'bg-white scale-125' : 'bg-black/30'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="relative -mt-8 bg-white/90 backdrop-blur-xl rounded-t-[3rem] rounded-b-[2rem] mx-2 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white/50 md:mt-0 md:bg-white/80 md:rounded-[3rem] md:p-8">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{item.title}</h1>
                  <div className="text-teal-600 text-3xl font-black whitespace-nowrap">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</div>
                </div>
                {item.locationName && (
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(item.locationName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[13px] font-bold hover:bg-teal-100 active:scale-95 transition-all cursor-pointer"
                  >
                    <MapPin size={16} />
                    <span>{item.locationName}</span>
                    <ExternalLink size={12} className="text-teal-400 ml-0.5" />
                  </a>
                )}
              </div>

              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="px-4 py-1.5 rounded-full border border-slate-100 bg-white shadow-sm text-slate-500 text-[13px] font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition-colors">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Product Description */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t.productDesc}</h3>
                <p className="text-[15px] font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.description || t.noDescription}
                </p>
              </div>

              {/* Seller Profile Row */}
              {sellerProfile && (
                <div
                  onClick={() => navigate(`/user/${item.owner_id}`)}
                  className="pt-6 border-t border-slate-100 cursor-pointer group"
                >
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all group-hover:bg-teal-50 group-hover:border-teal-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <img src={sellerProfile.avatar_url || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80'} alt="Seller Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-slate-800 leading-tight">{sellerProfile.full_name}</span>
                          {sellerProfile.displayStatus === 'verified' && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-[#00b478] text-white rounded-full text-[10px] shadow-sm transform -translate-y-0.5" title="Verified / 已认证">✓</span>
                          )}
                          {sellerProfile.displayStatus === 'freshman' && (
                            <span className="text-sm transform -translate-y-0.5" title="Freshman / 新生">🌱</span>
                          )}
                          {sellerProfile.displayStatus === 'stranger' && (
                            <span className="text-sm transform -translate-y-0.5" title="Stranger / 陌生人">⚠️</span>
                          )}
                        </div>
                        <span className="text-[12px] text-slate-500">{sellerProfile.school || 'Universiti Malaya (UM)'}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-teal-600 transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              )}

              {/* Rental-specific: Room Type + Available From */}
              {item.listingType === 'rental' && (item.roomType || item.availableFrom) && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                  {item.roomType && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100/50">
                      <Building2 size={14} className="text-amber-600" />
                      <span className="text-[12px] font-bold text-amber-700">
                        {language === 'zh'
                          ? { single: '单间', master: '主卧', middle: '中房', small: '小房', studio: '开间', whole: '整套' }[item.roomType] || item.roomType
                          : { single: 'Single Room', master: 'Master Room', middle: 'Middle Room', small: 'Small Room', studio: 'Studio', whole: 'Whole Unit' }[item.roomType] || item.roomType}
                      </span>
                    </div>
                  )}
                  {item.availableFrom && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100/50">
                      <Calendar size={14} className="text-blue-600" />
                      <span className="text-[12px] font-bold text-blue-700">
                        {language === 'zh' ? '可入住: ' : 'Available: '}{new Date(item.availableFrom).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rental Tips */}
              {item.listingType === 'rental' && (
                <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚠️</span>
                    <span className="text-sm font-black text-amber-700">
                      {language === 'zh' ? '温馨提示' : 'Friendly Reminders'}
                    </span>
                  </div>
                  <ul className="space-y-2 text-[12px] font-medium text-amber-800/80 leading-relaxed">
                    <li className="flex gap-2"><span className="shrink-0">1.</span><span>{language === 'zh' ? '异性合租需谨慎' : 'Be cautious with co-ed sharing arrangements'}</span></li>
                    <li className="flex gap-2"><span className="shrink-0">2.</span><span>{language === 'zh' ? '没完成合同之前不要交任何费用' : 'Do NOT pay any fees before completing a contract'}</span></li>
                    <li className="flex gap-2"><span className="shrink-0">3.</span><span>{language === 'zh' ? '点击头像可查看用户发布的内容或者举报 TA' : 'Tap on the user avatar to view their posts or report them'}</span></li>
                    <li className="flex gap-2"><span className="shrink-0">4.</span><span>{language === 'zh' ? '转租房帖子下方有留言处，大家都可见' : 'Comments on rental posts are visible to everyone'}</span></li>
                    <li className="flex gap-2"><span className="shrink-0">5.</span><span>{language === 'zh' ? '谨防被骗，都是学生，要互帮互助！共同营造更和谐安全的留学生活' : "Stay alert against scams — we are all students, let's help each other build a safer community!"}</span></li>
                  </ul>
                </div>
              )}

              {/* Public Comments (Rental only) */}
              {item.listingType === 'rental' && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    {language === 'zh' ? '公开留言' : 'Public Comments'} ({comments.length})
                  </h3>
                  {/* Comment list */}
                  <div className="space-y-3 mb-4">
                    {loadingComments ? (
                      <div className="text-center py-4 text-slate-400 text-sm">Loading...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        {language === 'zh' ? '暂无留言，来说两句吧' : 'No comments yet. Be the first!'}
                      </div>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="flex gap-3 group">
                          <div
                            className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white shadow-sm cursor-pointer"
                            onClick={() => navigate(`/user/${c.user_id}`)}
                          >
                            <img src={c.profiles?.avatar_url || '/default-avatar.svg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[12px] font-bold text-slate-700">{c.profiles?.full_name || 'User'}</span>
                              <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                              {c.user_id === session?.user?.id && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-0.5"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-[13px] text-slate-600 font-medium mt-0.5 break-words">{c.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Comment input */}
                  {session?.user && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        placeholder={language === 'zh' ? '写留言...' : 'Write a comment...'}
                        className="flex-1 bg-white/60 border border-slate-100 rounded-2xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all font-medium"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={submittingComment || !commentText.trim()}
                        className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-40"
                      >
                        {submittingComment ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Actions */}
              <div className="hidden md:block pt-8 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {user.verificationStatus === 'verified' ? (
                    <>
                      <button onClick={handleChat} className="col-span-2 flex items-center justify-center gap-2 bg-[#00b478] hover:bg-[#009c69] text-white rounded-2xl py-4 font-bold shadow-[0_8px_20px_rgba(0,180,120,0.3)] transition-all active:scale-95">
                        <MessageSquare size={20} />
                        <span>{t.chat}</span>
                      </button>
                      <button onClick={openWhatsApp} disabled={!(item.whatsapp || item.contact)} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${item.whatsapp || item.contact ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                        WhatsApp
                      </button>
                      <button onClick={copyWeChat} disabled={!item.wechat} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${item.wechat ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8.497 2.1c4.542 0 8.225 3.125 8.225 6.98 0 3.854-3.683 6.98-8.225 6.98-1.503 0-2.913-.338-4.148-.936L1.134 16.96l1.246-3.877C.885 11.516 0 9.351 0 9.08c0-3.854 3.682-6.98 8.497-6.98Zm12.062 6.556c4.54 0 8.223 3.125 8.223 6.979 0 3.854-3.682 6.979-8.223 6.979-1.503 0-2.913-.338-4.147-.936l-3.216 1.836 1.246-3.877c-1.495-1.566-2.38-3.731-2.38-4.002 0-3.854 3.681-6.979 8.497-6.979Z" /></svg>
                        WeChat
                      </button>
                    </>
                  ) : (
                    <div className="col-span-2 space-y-3">
                      <button onClick={() => navigate('/profile')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 rounded-xl py-4 font-bold transition-all hover:bg-gray-200">
                        <Lock size={18} />
                        <span>{t.verifyToChat}</span>
                      </button>
                      <div className="flex gap-4 opacity-50 pointer-events-none grayscale">
                        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 border-gray-100 text-gray-300">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                          WhatsApp
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 border-gray-100 text-gray-300">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8.497 2.1c4.542 0 8.225 3.125 8.225 6.98 0 3.854-3.683 6.98-8.225 6.98-1.503 0-2.913-.338-4.148-.936L1.134 16.96l1.246-3.877C.885 11.516 0 9.351 0 9.08c0-3.854 3.682-6.98 8.497-6.98Zm12.062 6.556c4.54 0 8.223 3.125 8.223 6.979 0 3.854-3.682 6.979-8.223 6.979-1.503 0-2.913-.338-4.147-.936l-3.216 1.836 1.246-3.877c-1.495-1.566-2.38-3.731-2.38-4.002 0-3.854 3.681-6.979 8.497-6.979Z" /></svg>
                          WeChat
                        </button>
                      </div>
                      <div className="text-center text-[10px] text-orange-500 font-bold bg-orange-50 py-2 rounded-lg">{t.verifyRequired}</div>
                    </div>
                  )}

                  <button onClick={() => toggleFavorite(item.id)} className={`col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-2 transition-all ${favorites.includes(item.id) ? 'border-amber-200 text-amber-500 bg-amber-50' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <Heart size={18} className={favorites.includes(item.id) ? 'fill-amber-400 text-amber-400' : ''} />
                    <span>{favorites.includes(item.id) ? t.saved : t.addToFavorites}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-4 flex items-center justify-between gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60">
          <div className="flex flex-col px-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t.price}</span>
            <span className="text-2xl font-black text-teal-600 leading-none">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</span>
          </div>

          {user.verificationStatus === 'verified' ? (
            <div className="flex items-center gap-2">
              <button onClick={openWhatsApp} disabled={!(item.whatsapp || item.contact)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${item.whatsapp || item.contact ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-300'}`}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
              </button>
              <button onClick={copyWeChat} disabled={!item.wechat} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${item.wechat ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-300'}`}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.497 2.1c4.542 0 8.225 3.125 8.225 6.98 0 3.854-3.683 6.98-8.225 6.98-1.503 0-2.913-.338-4.148-.936L1.134 16.96l1.246-3.877C.885 11.516 0 9.351 0 9.08c0-3.854 3.682-6.98 8.497-6.98Zm12.062 6.556c4.54 0 8.223 3.125 8.223 6.979 0 3.854-3.682 6.979-8.223 6.979-1.503 0-2.913-.338-4.147-.936l-3.216 1.836 1.246-3.877c-1.495-1.566-2.38-3.731-2.38-4.002 0-3.854 3.681-6.979 8.497-6.979Z" /></svg>
              </button>
              <button onClick={handleChat} className="bg-[#00b478] hover:bg-[#009c69] text-white rounded-full px-8 py-3.5 font-bold shadow-[0_8px_20px_rgba(0,180,120,0.3)] active:scale-95 transition-all text-[15px]">
                {t.chat}
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/profile')} className="flex-1 bg-slate-800 text-white rounded-full px-6 py-3.5 font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <Lock size={18} />
              <span>{t.verifyToContact}</span>
            </button>
          )}
        </div>
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
