import React from 'react'
import { useParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MapPin, Phone, MessageSquare, Instagram } from 'lucide-react'
import { useState } from 'react'

const ProductDetail = () => {
  const { id } = useParams()
  const { listings, language, translations } = useMarketplace()
  const t = translations[language]
  const item = listings.find(l => l.id === id)
  if (!item) return <div className="mx-auto max-w-md px-4 pt-4">Not found</div>
  const [toast, setToast] = useState('')

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hi, I'm interested in: ${item.title}`)
    const number = item.whatsapp || item.contact || ''
    if (number) window.open(`https://wa.me/${number}?text=${text}`, '_blank')
  }
  const openInstagram = () => {
    const handle = (item.instagram || '').replace(/^@/, '')
    if (handle) window.open(`https://instagram.com/${handle}`, '_blank')
  }
  const copyWeChat = async () => {
    const id = item.wechat || ''
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      setToast(language === 'zh' ? '微信号已复制' : 'WeChat ID Copied')
    } catch {
      setToast(language === 'zh' ? '微信号已复制' : 'WeChat ID Copied')
    }
    setTimeout(() => setToast(''), 1500)
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="w-full">
        <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover rounded-xl shadow-sm" />
      </div>
      <div className="px-4 pt-3 pb-24">
        <div className="text-lg font-semibold text-gray-900">{item.title}</div>
        <div className="text-indigo-600 font-bold mt-1">RM {item.price}</div>
        {item.locationName && (
          <div className="mt-2 flex items-center text-gray-700 text-sm">
            <MapPin size={16} className="mr-1 text-gray-600" />
            <span>{item.locationName}</span>
          </div>
        )}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">#{tag}</span>
            ))}
          </div>
        )}
        <div className="text-sm text-gray-700 mt-3">{item.description}</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={openWhatsApp} disabled={!(item.whatsapp || item.contact)} className={`flex items-center justify-center gap-1 rounded-full py-2 text-sm ${item.whatsapp || item.contact ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <Phone size={16} />
            <span>WhatsApp</span>
          </button>
          <button onClick={copyWeChat} disabled={!item.wechat} className={`flex items-center justify-center gap-1 rounded-full py-2 text-sm ${item.wechat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <MessageSquare size={16} />
            <span>WeChat</span>
          </button>
          <button onClick={openInstagram} disabled={!item.instagram} className={`flex items-center justify-center gap-1 rounded-full py-2 text-sm ${item.instagram ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            <Instagram size={16} />
            <span>Instagram</span>
          </button>
        </div>
      </div>
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 bg-black/80 text-white text-xs px-3 py-2 rounded-full">
          {toast}
        </div>
      )}
    </div>
  )
}

export default ProductDetail
