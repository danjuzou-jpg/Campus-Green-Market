import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { Search } from 'lucide-react'

const fmtDate = (ts) => {
  const d = new Date(ts)
  const now = Date.now()
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return d.toLocaleDateString()
}

const Home = () => {
  const { listings, categories, language, translations } = useMarketplace()
  const t = translations[language]
  const [term, setTerm] = useState('')
  const [activeCat, setActiveCat] = useState('All')

  const filtered = useMemo(() => {
    return listings.filter(item => {
      const q = term.toLowerCase().trim()
      const matchTerm = q.length === 0 ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(q)))
      const matchCat = activeCat === 'All' || item.category === activeCat
      return matchTerm && matchCat
    })
  }, [listings, term, activeCat])
  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <div className="mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Search size={18} />
          </span>
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-gray-100 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mt-3 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCat(cat.key)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeCat === cat.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {language === 'zh' ? cat.zh : cat.en}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="columns-2 gap-3">
        {filtered.map(item => (
          <Link to={`/product/${item.id}`} key={item.id} className="mb-3 break-inside-avoid block">
            <div className="rounded-xl shadow-sm overflow-hidden">
              <div className="w-full aspect-[4/3]">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm text-gray-900">{item.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-indigo-600 font-bold">RM {item.price}</div>
                  <div className="text-xs text-gray-500">{fmtDate(item.createdAt)}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
