import React, { useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const BottomNav = () => {
  const navigate = useNavigate()
  const { language, translations, conversations } = useMarketplace()
  const t = translations[language]

  const location = useLocation()

  // 未读消息
  const unreadCount = 0

  // Hide on detail pages
  const hidePaths = ['/product', '/chat', '/edit']
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path))

  if (shouldHide) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 pointer-events-none pb-4">
      {/* Floating White Capsule */}
      <div className="mx-auto max-w-[360px] bg-white/95 backdrop-blur-md rounded-[3rem] px-4 h-[72px] flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.08)] pointer-events-auto border border-white/60">

        {/* Home */}
        <NavLink to="/home" className="relative flex flex-col items-center flex-1 h-full justify-center group">
          {({ isActive }) => (
            <>
              <div className={`transition-all duration-300 ease-in-out flex items-center justify-center ${isActive ? 'absolute -top-[24px] bg-[#00b478] w-[60px] h-[60px] rounded-full shadow-[0_12px_24px_rgba(0,180,120,0.4)] text-white scale-100' : 'w-10 h-10 bg-transparent text-slate-400 group-hover:text-slate-600 group-active:scale-95'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isActive ? '26' : '22'} height={isActive ? '26' : '22'} viewBox="0 0 24 24" fill={isActive ? 'white' : 'none'} stroke="currentColor" strokeWidth={isActive ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <span className={`text-[10px] font-bold mt-auto pb-[10px] transition-all duration-300 ${isActive ? 'text-teal-600 opacity-100 translate-y-0' : 'text-slate-400 opacity-100 translate-y-1'}`}>{t.home}</span>
            </>
          )}
        </NavLink>

        {/* Messages */}
        <NavLink to="/inbox" className="relative flex flex-col items-center flex-1 h-full justify-center group">
          {({ isActive }) => (
            <>
              <div className={`transition-all duration-300 ease-in-out flex items-center justify-center ${isActive ? 'absolute -top-[24px] bg-[#00b478] w-[60px] h-[60px] rounded-full shadow-[0_12px_24px_rgba(0,180,120,0.4)] text-white scale-100' : 'w-10 h-10 bg-transparent text-slate-400 group-hover:text-slate-600 group-active:scale-95'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isActive ? '24' : '20'} height={isActive ? '24' : '20'} viewBox="0 0 24 24" fill={isActive ? 'white' : 'none'} stroke="currentColor" strokeWidth={isActive ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                {unreadCount > 0 && <span className={`absolute ${isActive ? 'top-1 right-1' : 'top-1.5 right-1.5'} bg-[#ff9871] border-2 border-white text-white text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center`}></span>}
              </div>
              <span className={`text-[10px] font-bold mt-auto pb-[10px] transition-all duration-300 ${isActive ? 'text-teal-600 opacity-100 translate-y-0' : 'text-slate-400 opacity-100 translate-y-1'}`}>{t.inbox}</span>
            </>
          )}
        </NavLink>

        {/* Sell */}
        <NavLink to="/upload" className="relative flex flex-col items-center flex-1 h-full justify-center group">
          {({ isActive }) => (
            <>
              <div className={`transition-all duration-300 ease-in-out flex items-center justify-center ${isActive ? 'absolute -top-[24px] bg-[#00b478] w-[60px] h-[60px] rounded-full shadow-[0_12px_24px_rgba(0,180,120,0.4)] text-white scale-100' : 'w-10 h-10 bg-transparent text-slate-400 group-hover:text-slate-600 group-active:scale-95'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isActive ? '28' : '22'} height={isActive ? '28' : '22'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? '3' : '2'} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </div>
              <span className={`text-[10px] font-bold mt-auto pb-[10px] transition-all duration-300 ${isActive ? 'text-teal-600 opacity-100 translate-y-0' : 'text-slate-400 opacity-100 translate-y-1'}`}>{t.sell}</span>
            </>
          )}
        </NavLink>

        {/* Profile */}
        <NavLink to="/profile" className="relative flex flex-col items-center flex-1 h-full justify-center group">
          {({ isActive }) => (
            <>
              <div className={`transition-all duration-300 ease-in-out flex items-center justify-center ${isActive ? 'absolute -top-[24px] bg-[#00b478] w-[60px] h-[60px] rounded-full shadow-[0_12px_24px_rgba(0,180,120,0.4)] text-white scale-100' : 'w-10 h-10 bg-transparent text-slate-400 group-hover:text-slate-600 group-active:scale-95'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isActive ? '24' : '20'} height={isActive ? '24' : '20'} viewBox="0 0 24 24" fill={isActive ? 'white' : 'none'} stroke="currentColor" strokeWidth={isActive ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <span className={`text-[10px] font-bold mt-auto pb-[10px] transition-all duration-300 ${isActive ? 'text-teal-600 opacity-100 translate-y-0' : 'text-slate-400 opacity-100 translate-y-1'}`}>{t.me}</span>
            </>
          )}
        </NavLink>

      </div>
    </div>
  )
}

export default BottomNav
