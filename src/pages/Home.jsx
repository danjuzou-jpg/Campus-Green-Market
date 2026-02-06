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
  const { listings, categories, language, translations, locations, normalize } = useMarketplace()
  const t = translations[language]
  const [term, setTerm] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [activeLoc, setActiveLoc] = useState('All Locations')

  const filtered = useMemo(() => {
    return listings.filter(item => {
      // 1. SearchMatch: title, description, and locationName
      const q = term.toLowerCase().trim()
      const matchTerm = q.length === 0 ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        (item.locationName || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(q)))
      
      // 2. CategoryMatch
      const matchCat = activeCat === 'All' || item.category === activeCat
      
      // 3. LocationMatch: Use normalize for comparison
      const productLoc = normalize(item.locationName || '')
      const filterLoc = normalize(activeLoc)
      const matchLoc = activeLoc === 'All Locations' || productLoc.includes(filterLoc)
      
      // Filter logic is AND
      return matchTerm && matchCat && matchLoc
    })
  }, [listings, term, activeCat, activeLoc, normalize])

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px-60px)]">
      {/* 区域 A: 商品分类 (Categories) */}
      <div className="w-full md:w-1/4 md:min-w-[200px] bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal flex flex-row md:flex-col scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            className={`relative py-3 md:py-4 px-4 md:px-2 text-xs font-medium transition-colors inline-block md:block ${
              activeCat === cat.key 
                ? 'bg-white text-indigo-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {activeCat === cat.key && (
              <div className="hidden md:block absolute right-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-l" />
            )}
            {activeCat === cat.key && (
              <div className="md:hidden absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-t" />
            )}
            <div className="text-center break-words">
              {language === 'zh' ? cat.zh : cat.en}
            </div>
          </button>
        ))}
      </div>

      {/* 区域 B: 右侧内容 (Content) */}
      <div className="w-full md:flex-1 flex flex-col overflow-hidden bg-white">
        {/* 顶部搜索与位置筛选 */}
        <div className="p-3 border-b border-gray-100 shadow-sm">
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search size={16} />
            </span>
            <input
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-gray-100 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
            <div className="flex gap-2">
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setActiveLoc(loc)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                    activeLoc === loc 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border border-transparent'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 商品列表内容 */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
              {filtered.map(item => (
                <Link to={`/product/${item.id}`} key={item.id} className="block group">
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md h-full">
                    <div className="aspect-[4/3] w-full bg-gray-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-medium text-gray-900 truncate">{item.title}</h3>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-indigo-600 font-bold text-sm">RM {item.price}</span>
                        <span className="text-[9px] text-gray-400">{fmtDate(item.createdAt)}</span>
                      </div>
                      {item.locationName && (
                        <div className="mt-1 text-[9px] text-gray-400 truncate flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {item.locationName}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-xs">{language === 'zh' ? '暂无匹配商品' : 'No matching items'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
