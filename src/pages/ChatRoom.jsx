import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { supabase } from '../lib/supabaseClient'
import { ChevronLeft, Send, Flag, RotateCcw } from 'lucide-react'
import ReportModal from '../components/ReportModal.jsx'

const WITHDRAW_LIMIT_MS = 2 * 60 * 1000 // 2 minutes

const ChatRoom = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { conversations, sendMessage, language, translations, getProductById, session, fetchConversations, markConversationRead, createConversationWithMessage, addIncomingMessage, showToast } = useMarketplace()
  const t = translations[language]
  const [inputText, setInputText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const scrollRef = useRef(null)

  // 撤回菜单状态
  const [withdrawMenuId, setWithdrawMenuId] = useState(null)
  const longPressTimer = useRef(null)

  // 是否是新会话（还未在 DB 中创建）
  const isNewConversation = id === 'new'
  const productIdFromQuery = searchParams.get('productId')

  const conv = isNewConversation ? null : conversations.find(c => c.id === id)
  const [product, setProduct] = useState(null)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [sending, setSending] = useState(false)
  const [otherLastSeen, setOtherLastSeen] = useState(null)

  // 格式化上次活跃时间
  const formatLastSeen = (date) => {
    if (!date) return ''
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (diff < 300) return language === 'zh' ? '🟢 在线' : '🟢 Online'
    if (diff < 3600) return language === 'zh' ? `${Math.floor(diff / 60)} 分钟前活跃` : `Active ${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return language === 'zh' ? `${Math.floor(diff / 3600)} 小时前活跃` : `Active ${Math.floor(diff / 3600)}h ago`
    return language === 'zh' ? `${Math.floor(diff / 86400)} 天前活跃` : `Active ${Math.floor(diff / 86400)}d ago`
  }

  // 获取商品数据
  useEffect(() => {
    const pid = isNewConversation ? productIdFromQuery : conv?.productId
    if (pid) {
      getProductById(pid, session?.user?.id).then(p => {
        if (p) setProduct(p)
        else if (conv) setProduct({ id: conv.productId, title: t.deletedProduct || 'Deleted Product', imageUrl: conv.productImage, price: 'N/A' })
      })
    }
  }, [isNewConversation, productIdFromQuery, conv?.productId, getProductById, session, conv?.productImage])

  // 新会话：获取卖家资料 + last_seen_at
  useEffect(() => {
    if (isNewConversation && product?.owner_id) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url, last_seen_at')
        .eq('id', product.owner_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSellerProfile(data)
            setOtherLastSeen(data.last_seen_at)
          }
        })
    }
  }, [isNewConversation, product?.owner_id])

  // 已有会话：获取对方 last_seen_at
  useEffect(() => {
    const otherId = conv?.otherUserId
    if (!isNewConversation && otherId) {
      supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', otherId)
        .single()
        .then(({ data }) => {
          if (data?.last_seen_at) setOtherLastSeen(data.last_seen_at)
        })
    }
  }, [isNewConversation, conv?.otherUserId])

  // Fix 1-4: Viewport Height Fix for mobile keyboards
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [vp, setVp] = useState({
    top: window.visualViewport?.offsetTop ?? 0,
    height: window.visualViewport?.height ?? window.innerHeight
  })

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768)
      const vv = window.visualViewport
      setVp({
        top: vv ? vv.offsetTop : 0,
        height: vv ? vv.height : window.innerHeight
      })
    }
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // 消息更新 或 键盘弹起时滚底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conv?.messages, vp.height])

  // 标记已读
  useEffect(() => {
    if (id && !isNewConversation) markConversationRead(id)
  }, [id, isNewConversation, conv?.messages?.length])

  // Real-time subscription: INSERT + UPDATE (for withdraw)
  useEffect(() => {
    if (!id || isNewConversation || !session?.user) return
    const channel = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const msg = payload.new
        if (msg.sender_id !== session.user.id) {
          addIncomingMessage(id, msg)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const updated = payload.new
        // Apply ALL updates in-place for BOTH sender and receiver (cross-device withdrawal sync)
        addIncomingMessage(id, { ...updated, _update: true })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewConversation, session?.user?.id, addIncomingMessage])

  // 关闭撤回菜单的全局点击
  useEffect(() => {
    if (!withdrawMenuId) return
    const close = () => setWithdrawMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [withdrawMenuId])

  // 撤回消息
  const handleWithdraw = async (msg) => {
    setWithdrawMenuId(null)
    const { error } = await supabase
      .from('messages')
      .update({ is_withdrawn: true, content: '' })
      .eq('id', msg.id)
      .eq('sender_id', session.user.id) // 安全：仅能撤回自己的
    if (error) {
      showToast('error', language === 'zh' ? '撤回失败' : 'Withdraw failed')
    } else {
      // Optimistic UI update
      addIncomingMessage(id, { ...msg, is_withdrawn: true, content: '', _update: true })
    }
  }

  // 长按开始/结束
  const onTouchStart = (msg) => {
    if (msg.sender !== 'me' || msg.is_withdrawn) return
    const elapsed = Date.now() - new Date(msg.timestamp).getTime()
    if (elapsed > WITHDRAW_LIMIT_MS) return
    longPressTimer.current = setTimeout(() => {
      setWithdrawMenuId(msg.id)
    }, 600) // 600ms 长按触发
  }
  const onTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 新会话且缺少 productId 参数 → 无效访问
  if (isNewConversation && !productIdFromQuery) {
    return <div className="p-4">{t.noMessages}</div>
  }

  // 已有会话但找不到 → 显示提示
  if (!isNewConversation && !conv) {
    return <div className="p-4">{t.noMessages}</div>
  }

  // 确定对方名字和对方 ID
  const otherName = isNewConversation
    ? (sellerProfile?.full_name || 'Seller')
    : (conv?.sellerName || 'User')
  const otherUserId = isNewConversation
    ? product?.owner_id
    : conv?.otherUserId

  const messages = conv?.messages || []

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    if (isNewConversation && product) {
      setSending(true)
      const realConvId = await createConversationWithMessage(product, inputText)
      setSending(false)
      if (realConvId) {
        setInputText('')
        navigate(`/chat/${realConvId}`, { replace: true })
      } else {
        showToast('error', language === 'zh' ? '发送失败，请重试' : 'Failed to send. Please try again.')
      }
    } else {
      sendMessage(id, inputText)
      setInputText('')
    }
  }

  const formatMessageTime = (ts) => {
    if (!ts) return ''
    const date = new Date(ts)
    const now = new Date()

    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    const isYesterday = date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isToday) return timeStr
    if (isYesterday) return language === 'zh' ? `昨天 ${timeStr}` : `Yesterday ${timeStr}`

    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day} ${timeStr}`
  }

  // 检查消息是否可撤回（自己的消息且在2分钟内）
  const canWithdraw = (msg) => {
    if (msg.sender !== 'me' || msg.is_withdrawn) return false
    return (Date.now() - new Date(msg.timestamp).getTime()) <= WITHDRAW_LIMIT_MS
  }

  return (
    <div
      className="mx-auto max-w-2xl flex flex-col bg-gray-50 fixed z-[60] md:relative md:inset-auto md:h-[85vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border md:border-gray-200"
      style={isMobile ? { top: vp.top, left: 0, right: 0, height: vp.height } : {}}
    >
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div
          className="flex-1 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
        >
          <div className="font-bold text-gray-900 leading-tight">{otherName}</div>
          <div className="text-[10px] text-gray-400 font-medium">
            {otherLastSeen ? formatLastSeen(otherLastSeen) : ''}
          </div>
        </div>
        {!isNewConversation && (
          <button
            onClick={() => setShowReport(true)}
            className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Flag size={16} />
          </button>
        )}
      </div>

      {/* Product Info */}
      {product && (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
            <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">{product.title}</div>
            <div className="text-xs text-indigo-600 font-bold">{product.currency === 'CNY' ? '¥' : 'RM'} {product.price}</div>
          </div>
          <button onClick={() => navigate(`/product/${product.id}`)} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">
            {t.viewItem}
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center">
          <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-full uppercase tracking-wider">
            {t.safetyTip}
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} relative`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative ${
                msg.is_withdrawn
                  ? 'bg-gray-100 text-gray-400 italic border border-gray-200'
                  : msg.sender === 'me'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}
              onTouchStart={() => onTouchStart(msg)}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
              onContextMenu={(e) => {
                if (canWithdraw(msg)) {
                  e.preventDefault()
                  setWithdrawMenuId(msg.id)
                }
              }}
            >
              {msg.is_withdrawn ? (
                <span className="flex items-center gap-1.5">
                  <RotateCcw size={12} />
                  {language === 'zh' ? '该消息已撤回' : 'This message was withdrawn'}
                </span>
              ) : (
                msg.text
              )}
              {!msg.is_withdrawn && (
                <div className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {formatMessageTime(msg.timestamp)}
                </div>
              )}
            </div>

            {/* Withdraw popup menu */}
            {withdrawMenuId === msg.id && canWithdraw(msg) && (
              <div
                className={`absolute ${msg.sender === 'me' ? 'right-0' : 'left-0'} bottom-full mb-2 z-50`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleWithdraw(msg)}
                  className="flex items-center gap-2 bg-white shadow-lg border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  <RotateCcw size={14} />
                  {language === 'zh' ? '撤回' : 'Withdraw'}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* 新会话提示 */}
        {isNewConversation && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400 font-medium">
              {language === 'zh' ? '发送第一条消息开始对话' : 'Send a message to start the conversation'}
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="bg-white border-t px-4 pt-4 flex gap-2 shrink-0 z-10"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        <input
          name="chat_message_input"
          id="chat_message_input"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.typeMessage}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg shadow-emerald-200 active:scale-90 transition-all"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Report Modal */}
      {showReport && conv && (
        <ReportModal
          type="user"
          targetId={conv.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

export default ChatRoom
