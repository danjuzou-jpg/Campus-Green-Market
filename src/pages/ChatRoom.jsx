import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { supabase } from '../lib/supabaseClient'
import { ChevronLeft, Send, Flag } from 'lucide-react'
import ReportModal from '../components/ReportModal.jsx'

const ChatRoom = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { conversations, sendMessage, language, translations, getProductById, session, fetchConversations, markConversationRead, createConversationWithMessage } = useMarketplace()
  const t = translations[language]
  const [inputText, setInputText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const scrollRef = useRef(null)

  // 是否是新会话（还未在 DB 中创建）
  const isNewConversation = id === 'new'
  const productIdFromQuery = searchParams.get('productId')

  const conv = isNewConversation ? null : conversations.find(c => c.id === id)
  const [product, setProduct] = useState(null)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [sending, setSending] = useState(false)

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

  // 新会话：获取卖家资料
  useEffect(() => {
    if (isNewConversation && product?.owner_id) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', product.owner_id)
        .single()
        .then(({ data }) => {
          if (data) setSellerProfile(data)
        })
    }
  }, [isNewConversation, product?.owner_id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conv?.messages])

  // 标记已读（仅已存在的会话）
  useEffect(() => {
    if (id && !isNewConversation) markConversationRead(id)
  }, [id, isNewConversation, conv?.messages?.length])

  // Real-time subscription（仅已存在的会话）
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
          fetchConversations(session.user.id)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewConversation, session?.user?.id])

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
      // 延迟创建：第一条消息发送时才创建会话
      setSending(true)
      const realConvId = await createConversationWithMessage(product, inputText)
      setSending(false)
      if (realConvId) {
        setInputText('')
        navigate(`/chat/${realConvId}`, { replace: true })
      }
    } else {
      sendMessage(id, inputText)
      setInputText('')
    }
  }

  return (
    <div className="mx-auto max-w-2xl h-screen h-[100dvh] flex flex-col bg-gray-50 fixed inset-0 z-[60]">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <div
          className="flex-1 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
        >
          <div className="font-bold text-gray-900 leading-tight">{otherName}</div>
          <div className="text-[10px] text-green-500 font-medium">● {t.online}</div>
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
            <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="w-full h-full object-cover" />
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
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'me'
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
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

      {/* Input — 使用 max() 正确处理安全区域 */}
      <form
        onSubmit={handleSend}
        className="bg-white border-t px-4 pt-4 flex gap-2 shrink-0"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        <input
          type="text"
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
