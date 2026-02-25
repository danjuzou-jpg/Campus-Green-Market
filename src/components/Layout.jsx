import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import Logo from './Logo'
import { Languages } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import Toast from './Toast.jsx'
import { Search } from 'lucide-react'

const Layout = () => {
  const { language, toggleLanguage, toast, clearToast, user, unreadCount } = useMarketplace()
  const label = language === 'zh' ? '🌐 中文 / EN' : '🌐 EN / 中文'
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dcfcf2] via-[#f0fdf4] to-[#e0f7fa]">
      {/* 极简透明/毛玻璃状态栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-12 pb-2 px-6 bg-gradient-to-b from-[#dcfcf2]/90 to-transparent backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl flex items-center justify-between">

          <div className="flex items-center justify-between w-full">
            {/* Left: Logo */}
            <div className="shrink-0 flex items-center gap-2">
              <Logo />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-slate-500 shadow-sm border border-white/50 text-xs font-bold hover:bg-white hover:text-teal-600 transition-colors"
              >
                {label}
              </button>

              <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-slate-500 shadow-sm border border-white/50 flex items-center justify-center relative hover:bg-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {/* Notification indicator */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-32 max-w-7xl mx-auto">
        <Outlet />
      </div>
      <BottomNav />
      <Toast toast={toast} onClose={clearToast} />
    </div>
  )
}

export default Layout
