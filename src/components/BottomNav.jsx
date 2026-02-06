import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Plus, User } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const BottomNav = () => {
  const navigate = useNavigate()
  const { language, translations } = useMarketplace()
  const t = translations[language]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="mx-auto max-w-md relative px-8 py-4">
        <div className="flex items-center justify-between text-gray-700">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-black' : 'text-gray-500'}`}>
            <Home size={22} />
            <span className="text-xs">{t.home}</span>
          </NavLink>
          <button onClick={() => navigate('/upload')} className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-500 text-white rounded-full p-4 shadow-lg">
            <Plus size={24} />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-8 text-xs text-gray-700">{t.sell}</span>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center text-gray-500">
            <User size={22} />
            <span className="text-xs">{t.me}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BottomNav
