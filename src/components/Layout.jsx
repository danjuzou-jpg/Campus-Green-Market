import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import Logo from './Logo'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const Layout = () => {
  const { language, toggleLanguage } = useMarketplace()
  const label = language === 'zh' ? '🌐 中文 / EN' : '🌐 EN / 中文'
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="mx-auto max-w-md h-16 px-4 flex items-center justify-between">
          <Link to="/" aria-label="Go Home" className="flex items-center">
            <Logo />
          </Link>
          <button onClick={toggleLanguage} className="text-sm px-2 py-1 rounded-md border border-gray-200">{label}</button>
        </div>
      </header>
      <div className="pt-16 pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

export default Layout
