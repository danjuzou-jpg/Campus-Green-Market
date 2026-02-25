import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { supabase } from '../lib/supabaseClient'
import { ChevronLeft, Send, Flag } from 'lucide-react'
import ReportModal from '../components/ReportModal.jsx'

const ChatRoom = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { conversations, sendMessage, language, translations, listings, session, fetchConversations, markConversationRead } = useMarketplace()
  const t = translations[language]
  const [inputText, setInputText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const scrollRef = useRef(null)

  const conv = conversations.find(c => c.id === id)
  const product = listings.find(l => l.id === conv?.productId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conv?.messages])

  // 标记已读
  useEffect(() => {
    if (id) markConversationRead(id)
  }, [id, conv?.messages?.length])

  // Real-time subscription
  useEffect(() => {
    if (!id || !session?.user) return
    const channel = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const msg = payload.new
        // 只更新当前会话，不需要重新拉取全部会话
        if (msg.sender_id !== session.user.id) {
          // 只处理对方发的消息，自己的已由 optimistic update 处理
          fetchConversations(session.user.id)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, session, fetchConversations])

  if (!conv) return <div className="p-4">{t.noMessages}</div>

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    sendMessage(id, inputText)
    setInputText('')
  }

  return (
    <div className="mx-auto max-w-2xl h-screen flex flex-col bg-gray-50 fixed inset-0 z-[60]">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="font-bold text-gray-900 leading-tight">{conv.sellerName}</div>
          <div className="text-[10px] text-green-500 font-medium">● {t.online}</div>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag size={16} />
        </button>
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

        {conv.messages.map((msg) => (
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
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t p-4 flex gap-2 shrink-0 pb-safe pb-8">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.typeMessage}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg shadow-emerald-200 active:scale-90 transition-all">
          <Send size={18} />
        </button>
      </form>

      {/* Report Modal */}
      {showReport && (
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
