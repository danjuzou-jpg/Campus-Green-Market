import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { Search, MapPin, Navigation, ChevronLeft, ChevronRight, Heart, ShieldAlert, Clock, X } from 'lucide-react'
import { SkeletonCard } from '../components/Skeleton.jsx'

const fmtDate = (ts, lang) => {
  const d = new Date(ts)
  const now = Date.now()
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60) return lang === 'zh' ? '刚刚' : 'Just now'
  if (diff < 3600) return lang === 'zh' ? `${Math.floor(diff / 60)} 分钟前` : `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return lang === 'zh' ? `${Math.floor(diff / 3600)} 小时前` : `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

const SEARCH_HISTORY_KEY = '2nh_search_history'
const MAX_HISTORY = 8

const Home = () => {
  const { listings, categories, language, translations, locations, normalize, setUserLocation, userLocation, favorites, toggleFavorite, user, loading } = useMarketplace()
  const t = translations[language]
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [activeLoc, setActiveLoc] = useState('All Locations')
  const [distance, setDistance] = useState('Any')
  const [toast, setToast] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showSearchPanel, setShowSearchPanel] = useState(false)

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    } catch { return [] }
  })

  const saveSearchTerm = (q) => {
    if (!q.trim()) return
    const updated = [q, ...searchHistory.filter(h => h !== q)].slice(0, MAX_HISTORY)
    setSearchHistory(updated)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }

  // 热门标签
  const hotTags = useMemo(() => {
    const tagCount = {}
    listings.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag)
  }, [listings])

  const handleSearch = (e) => {
    if (e.key === 'Enter' && term.trim()) {
      saveSearchTerm(term.trim())
      setShowSearchPanel(false)
    }
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      setToast('Geolocation not supported')
      return
    }

    setToast(language === 'zh' ? '正在获取位置...' : 'Acquiring location...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setToast(language === 'zh' ? '位置已获取' : 'Location Acquired')
        setTimeout(() => setToast(''), 2000)
      },
      (err) => {
        setToast(language === 'zh' ? '获取位置失败' : 'Failed to get location')
        setTimeout(() => setToast(''), 2000)
      }
    )
  }

  const filtered = useMemo(() => {
    return listings.filter(item => {
      const q = term.toLowerCase().trim()
      const matchTerm = q.length === 0 ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        (item.locationName || '').toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(q)))

      const matchCat = activeCat === 'All' || item.category === activeCat

      const productLoc = normalize(item.locationName || '')
      const filterLoc = normalize(activeLoc)
      const matchLoc = activeLoc === 'All Locations' || productLoc.includes(filterLoc)

      let matchDist = true
      if (distance !== 'Any' && userLocation && item.lat && item.lng) {
        const d = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng)
        const limit = parseInt(distance)
        matchDist = d <= limit
      }

      return matchTerm && matchCat && matchLoc && matchDist
    })
  }, [listings, term, activeCat, activeLoc, normalize, distance, userLocation])

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px-60px)] bg-gray-50/50">
      {/* 区域 A: 商品分类 */}
      <div className={`bg-white border-b md:border-b-0 md:border-r border-gray-100 overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal flex flex-row md:flex-col scrollbar-hide z-20 md:h-[calc(100vh-64px)] md:sticky md:top-[64px] transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-64' : 'w-full md:w-16'}`}>
        <div className="p-4 md:p-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:flex items-center justify-between">
          {isSidebarOpen && t.categories}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            className={`relative py-2 md:py-3 px-5 md:px-6 text-xs font-bold transition-all inline-block md:flex md:items-center rounded-full md:rounded-none md:rounded-r-full mr-2 md:mr-4 md:ml-0 my-1 md:my-0.5 ${activeCat === cat.key
              ? 'bg-emerald-600 text-white md:bg-emerald-50 md:text-emerald-600 md:border-l-4 md:border-emerald-500 shadow-md md:shadow-none'
              : 'text-gray-500 hover:bg-gray-50 md:hover:bg-gray-50'
              }`}
            title={language === 'zh' ? cat.zh : cat.en}
          >
            <div className={`text-center truncate w-full md:text-left ${!isSidebarOpen && 'md:hidden'}`}>
              {language === 'zh' ? cat.zh : cat.en}
            </div>
            {!isSidebarOpen && (
              <div className="hidden md:flex justify-center w-full">
                <span className="text-lg leading-none">•</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 区域 B: 右侧内容 */}
      <div className="w-full md:flex-1 flex flex-col overflow-hidden relative">
        {/* Guest Banner */}
        {!user.id && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-center text-xs font-bold text-blue-700">
            {t.demoMode}
          </div>
        )}
        {/* Verification Banner */}
        {user.verificationStatus !== 'verified' && (
          <div className="bg-orange-50 border-b border-orange-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-700">
              <ShieldAlert size={16} className="shrink-0" />
              <span className="text-xs font-bold">{t.unverifiedBanner}</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-[10px] bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-black hover:bg-orange-200 transition-colors"
            >
              {t.goVerify}
            </button>
          </div>
        )}

        {/* 搜索栏 */}
        <div className="sticky top-0 z-30 p-4 pb-2 bg-gradient-to-b from-gray-50 via-gray-50 to-transparent">
          <div className="bg-white rounded-full shadow-lg shadow-emerald-500/5 border border-emerald-100 flex items-center p-1.5 transition-all hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="flex-1 flex items-center px-4 h-12">
              <Search size={18} className="text-emerald-500 mr-3" />
              <input
                value={term}
                onChange={e => setTerm(e.target.value)}
                onFocus={() => setShowSearchPanel(true)}
                onKeyDown={handleSearch}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              {term && (
                <button onClick={() => { setTerm(''); setShowSearchPanel(false) }} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={handleGeoLocation}
              className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-emerald-100"
            >
              <Navigation size={18} />
            </button>
          </div>

          {/* 搜索建议面板 */}
          {showSearchPanel && !term && (
            <div className="absolute left-4 right-4 top-[72px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-40">
              {searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">{t.searchHistory}</span>
                    <button onClick={clearHistory} className="text-[10px] text-gray-400 hover:text-red-500">{t.clearHistory}</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => { setTerm(h); setShowSearchPanel(false) }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <Clock size={10} />
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {hotTags.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">{t.hotTags}</span>
                  <div className="flex flex-wrap gap-2">
                    {hotTags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => { setTerm(tag); setShowSearchPanel(false) }}
                        className="px-3 py-1.5 bg-emerald-50 rounded-full text-xs text-emerald-600 font-medium hover:bg-emerald-100 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchHistory.length === 0 && hotTags.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-4">{t.noItemsHint}</div>
              )}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide mt-3 px-1 pb-2">
            <div className="shrink-0 relative">
              <select
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className={`appearance-none pl-8 pr-4 py-1.5 rounded-full text-[10px] font-bold border shadow-sm transition-all cursor-pointer ${distance !== 'Any'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200'
                  }`}
              >
                <option value="Any">{t.distanceAny}</option>
                <option value="1">1km</option>
                <option value="3">3km</option>
                <option value="5">5km</option>
                <option value="10">10km</option>
              </select>
              <MapPin size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 ${distance !== 'Any' ? 'text-white' : 'text-emerald-500'}`} />
            </div>

            <div className="w-px h-4 bg-gray-300 shrink-0 mx-1" />

            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setActiveLoc(loc)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border shadow-sm ${activeLoc === loc
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* 点击其他区域关闭搜索面板 */}
        {showSearchPanel && (
          <div className="fixed inset-0 z-20" onClick={() => setShowSearchPanel(false)} />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-900/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full z-[100] animate-in slide-in-from-top-4 shadow-xl">
            {toast}
          </div>
        )}

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {loading.products ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-24">
              {filtered.map(item => (
                <Link to={`/product/${item.id}`} key={item.id} className="block group">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 h-full flex flex-col">
                    <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22system-ui%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E' }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full">
                        {fmtDate(item.createdAt, language)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(item.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm active:scale-90"
                      >
                        <Heart size={16} className={favorites.includes(item.id) ? 'fill-red-500 text-red-500' : ''} />
                      </button>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-emerald-600 font-bold text-lg">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</span>
                        {item.locationName && (
                          <div className="flex items-center text-gray-400 text-xs">
                            <MapPin size={10} className="mr-0.5" />
                            <span className="max-w-[60px] truncate">{item.locationName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                <Search size={24} />
              </div>
              <p className="text-sm font-medium">{t.noItemsFound}</p>
              <p className="text-xs text-gray-300 mt-1">{t.noItemsHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
