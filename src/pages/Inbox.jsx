import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { MessageSquare, ChevronRight, ArrowLeft } from 'lucide-react'
import { SkeletonInbox } from '../components/Skeleton.jsx'

const Inbox = () => {
  const { conversations, language, translations, loading } = useMarketplace()
  const t = translations[language]
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl min-h-screen pb-20 relative">
      <div className="px-4 pt-6 pb-2 sticky top-0 z-10">
        <div className="bg-white/90 backdrop-blur-xl px-5 py-4 rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-white/60 flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.inbox}</h1>
        </div>
      </div>

      <div className="mt-4 px-4">
        {loading.products ? (
          <SkeletonInbox />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-white/60 rounded-[2rem] shadow-sm flex items-center justify-center text-slate-400 mb-4 border border-white/50">
              <MessageSquare size={36} />
            </div>
            <p className="text-sm font-bold text-slate-500">{t.noMessages}</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-white/60 flex flex-col gap-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-4 p-3 bg-white/40 hover:bg-white rounded-3xl transition-all active:scale-95 text-left border border-white/30 shadow-sm"
              >
                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden bg-slate-50 shrink-0 border border-slate-100 shadow-sm">
                  <img src={conv.productImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-black text-slate-800 text-[15px] truncate">{conv.sellerName}</span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[13px] text-teal-600 font-bold truncate mb-1">{conv.productTitle}</div>
                  <div className="text-[13px] font-medium text-slate-500 truncate">
                    {conv.lastMessage || t.tapToChat}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Inbox
