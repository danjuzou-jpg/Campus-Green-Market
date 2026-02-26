import React, { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { SkeletonCard } from '../components/Skeleton.jsx'
import { Search, Menu, X, LayoutGrid, MonitorSmartphone, Sparkles, Sofa, BookOpen, Gamepad2, Building2, Package } from 'lucide-react'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)

  // Pagination & Backend Fetch States
  const [appliedTerm, setAppliedTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { fetchProducts, session } = useMarketplace()

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
    if (e.key === 'Enter') {
      saveSearchTerm(term.trim())
      setAppliedTerm(term.trim()) // Trigger backend fetch
      setShowSearchPanel(false)
    }
  }

  // Backend Pagination Fetch Effect
  useEffect(() => {
    let mounted = true
    const doFetch = async () => {
      const more = await fetchProducts(session?.user?.id, {
        page: 1,
        searchTerm: appliedTerm,
        categoryFilter: activeCat,
        locationFilter: activeLoc,
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
        maxDistanceKm: distance
      })
      if (mounted) {
        setHasMore(more)
        setPage(1)
      }
    }
    doFetch()
    return () => { mounted = false }
  }, [appliedTerm, activeCat, activeLoc, distance, userLocation, fetchProducts, session])

  const loadMore = async () => {
    if (!hasMore || loading.products) return
    const nextPage = page + 1
    const more = await fetchProducts(session?.user?.id, {
      page: nextPage,
      searchTerm: appliedTerm,
      categoryFilter: activeCat,
      locationFilter: activeLoc,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
      maxDistanceKm: distance
    })
    setHasMore(more)
    setPage(nextPage)
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

  // Filtered is now exactly the listings we fetched
  const filtered = listings

  return (
    <div className="min-h-screen pb-24 relative">

      {/* Search Bar with Menu toggle */}
      <div className="px-6 pt-4 pb-4 flex items-center gap-3 relative z-10">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-12 h-12 shrink-0 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50 flex items-center justify-center text-slate-500 hover:text-teal-600 active:scale-95 transition-all outline-none"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 bg-white/80 backdrop-blur-md shadow-sm border border-white/50 rounded-full flex items-center px-4 py-3 transition-shadow focus-within:shadow-md focus-within:bg-white">
          <Search size={18} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={t.searchPlaceholder || "Search Citrus..."}
            className="bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 font-bold text-[13px] w-full"
          />
        </div>
      </div>

      {/* Categories Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="relative w-72 h-full bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/60 flex flex-col transform transition-transform duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.categories}</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const isSelected = activeCat === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setActiveCat(cat.key)
                        setIsSidebarOpen(false)
                      }}
                      className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all active:scale-95 ${isSelected ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center shadow-sm overflow-hidden ${isSelected ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.key === 'All' && <LayoutGrid size={20} />}
                        {cat.key === 'Digital' && <MonitorSmartphone size={20} />}
                        {cat.key === 'Fashion' && <Sparkles size={20} />}
                        {cat.key === 'Home' && <Sofa size={20} />}
                        {cat.key === 'Learning' && <BookOpen size={20} />}
                        {cat.key === 'Hobbies' && <Gamepad2 size={20} />}
                        {cat.key === 'Rentals' && <Building2 size={20} />}
                        {cat.key === 'Others' && <Package size={20} />}
                      </div>
                      <span className="font-bold text-[14px]">
                        {language === 'zh' ? cat.zh : cat.en}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Location Pills (Simplified) */}
      <div className="px-6 pb-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        <div className="relative shrink-0">
          <select
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5 rounded-full text-xs font-bold bg-white text-slate-500 shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-teal-100 transition-all"
          >
            <option value="Any">{t.distanceAny}</option>
            <option value="1">1km</option>
            <option value="3">3km</option>
            <option value="5">5km</option>
            <option value="10">10km</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
        {locations.map(loc => (
          <button
            key={loc}
            onClick={() => setActiveLoc(loc)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap ${activeLoc === loc
              ? 'bg-[#10b981] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
              : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="px-6">
        {loading.products ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-24">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-6 pb-24">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map(item => (
                <Link to={`/product/${item.id}`} key={item.id} className="block group">
                  <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-3 shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full flex flex-col border border-white/60">
                    {/* Image Container */}
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex flex-col flex-1 px-1">
                      <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1.5">{item.title}</h3>
                      <p className="text-[15px] font-black text-[#10b981] mb-4">{item.currency === 'CNY' ? '¥' : 'RM'} {item.price}</p>

                      {/* Action Row */}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <button className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 rounded-2xl text-[13px] font-bold hover:bg-emerald-100 transition-colors">
                          Buy Now
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(item.id)
                          }}
                          className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl transition-colors ${favorites.includes(item.id) ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasMore ? (
              <button
                onClick={loadMore}
                className="w-full bg-white/60 hover:bg-white backdrop-blur-sm shadow-sm border border-slate-100 text-teal-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                disabled={loading.products}
              >
                {loading.products ? (
                  <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{language === 'zh' ? '加载更多' : 'Load More'}</span>
                )}
              </button>
            ) : (
              <div className="text-center text-slate-400 text-xs font-bold py-6">
                {language === 'zh' ? "没有更多商品了 🍋" : "No more products 🍋"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm font-medium">{t.noItemsFound}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
