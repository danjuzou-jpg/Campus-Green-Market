import React from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const Welcome = () => {
  const navigate = useNavigate()
  const { language, translations } = useMarketplace()
  const t = translations[language]

  const handleStart = () => {
    localStorage.setItem('hasVisited', 'true')
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between px-6">
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-3xl px-4 h-auto mb-6">
          <Logo className="w-full h-full" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          {t.welcomeTitle}
        </h1>
        <p className="text-gray-500 text-center text-lg">
          {t.welcomeSubtitle}
        </p>

        <div className="w-full max-w-sm mt-12 space-y-6">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              🛡️
            </div>
            <div>
              <div className="font-bold text-sm">{t.welcomeFeature1Title}</div>
              <div className="text-xs">{t.welcomeFeature1Desc}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              🌍
            </div>
            <div>
              <div className="font-bold text-sm">{t.welcomeFeature2Title}</div>
              <div className="text-xs">{t.welcomeFeature2Desc}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pb-20">
        <button
          onClick={handleStart}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 text-lg font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-transform"
        >
          {t.getStarted}
        </button>
      </div>
    </div>
  )
}

export default Welcome
