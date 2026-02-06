import React from 'react'
import { useParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const ProductDetail = () => {
  const { id } = useParams()
  const { listings, language, translations } = useMarketplace()
  const t = translations[language]
  const item = listings.find(l => l.id === id)
  if (!item) return <div className="mx-auto max-w-md px-4 pt-4">Not found</div>

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hi, I'm interested in: ${item.title}`)
    window.open(`https://wa.me/${item.contact}?text=${text}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="w-full">
        <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover rounded-xl shadow-sm" />
      </div>
      <div className="px-4 pt-3 pb-24">
        <div className="text-lg font-semibold text-gray-900">{item.title}</div>
        <div className="text-indigo-600 font-bold mt-1">RM {item.price}</div>
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">#{tag}</span>
            ))}
          </div>
        )}
        <div className="text-sm text-gray-700 mt-3">{item.description}</div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 px-4">
        <button onClick={openWhatsApp} className="w-full bg-green-500 text-white rounded-full py-3 text-base font-medium shadow-md">
          {language === 'zh' ? `${t.contact} (WhatsApp)` : `WhatsApp ${t.contact}`}
        </button>
      </div>
    </div>
  )
}

export default ProductDetail
