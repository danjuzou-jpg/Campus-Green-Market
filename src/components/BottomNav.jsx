import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Plus, User, MessageSquare } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const BottomNav = () => {
  const navigate = useNavigate()
  const { language, translations, conversations } = useMarketplace()
  const t = translations[language]

  // 未读消息计数 — 暂不显示，等后端支持 last_read_at 对比后再启用
  // TODO: 对比 conversation.updated_at 与 buyer/seller_last_read_at 来计算真正的未读数
  const unreadCount = 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
      <div className="mx-auto max-w-md px-4 py-2">
        <div className="grid grid-cols-4 items-end">
          <NavLink to="/home" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Home size={22} />
            <span className="text-[10px] font-bold tracking-tight">{t.home}</span>
          </NavLink>

          <div className="flex flex-col items-center">
            <button
              onClick={() => navigate('/upload')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-3 shadow-xl shadow-emerald-200 active:scale-90 transition-transform -mt-6"
            >
              <Plus size={24} />
            </button>
            <span className="text-[10px] font-bold text-gray-700 mt-1">{t.sell}</span>
          </div>

          <NavLink to="/inbox" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors relative ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className="relative">
              <MessageSquare size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t.inbox}</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
            <User size={22} />
            <span className="text-[10px] font-bold tracking-tight">{t.me}</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export default BottomNav
