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
    <div className="mx-auto max-w-md min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="p-1 -ml-1 text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t.inbox}</h1>
      </div>

      <div className="mt-2">
        {loading.products ? (
          <SkeletonInbox />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-gray-500">{t.noMessages}</p>
          </div>
        ) : (
          <div className="bg-white">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-4 p-4 border-b active:bg-gray-50 transition-colors text-left"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                  <img src={conv.productImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-gray-900 truncate">{conv.sellerName}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium truncate mb-1">{conv.productTitle}</div>
                  <div className="text-sm text-gray-400 truncate">
                    {conv.lastMessage || t.tapToChat}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Inbox
