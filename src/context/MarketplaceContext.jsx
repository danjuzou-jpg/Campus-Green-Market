import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const MarketplaceContext = createContext(null)

const CATEGORY_DEF = [
  { key: 'All', en: 'All', zh: '全部' },
  { key: 'Digital', en: 'Digital', zh: '数码电子' },
  { key: 'Fashion', en: 'Fashion', zh: '时尚美妆' },
  { key: 'Home', en: 'Home', zh: '生活家居' },
  { key: 'Learning', en: 'Learning', zh: '学习资源' },
  { key: 'Hobbies', en: 'Hobbies', zh: '兴趣娱乐' },
  { key: 'Rentals', en: 'Rentals', zh: '租房找室友' },
  { key: 'Others', en: 'Others', zh: '其他' }
]

const defaultProducts = [
  {
    id: 'cam-1',
    title: 'Mirrorless Camera',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
    description: 'Well-maintained mirrorless camera, includes kit lens.',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    contact: '60123456789',
    category: 'Digital',
    owner: 'others'
  },
  {
    id: 'sne-1',
    title: 'Sneakers',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    description: 'Comfortable sneakers, lightly used.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    contact: '60123456789',
    category: 'Fashion',
    owner: 'others'
  },
  {
    id: 'hp-1',
    title: 'Headphones',
    price: 250,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    description: 'Noise-cancelling over-ear headphones.',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    contact: '60123456789',
    category: 'Digital',
    owner: 'others'
  },
  {
    id: 'fur-1',
    title: 'Minimalist Chair',
    price: 320,
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80',
    description: 'Minimalist chair, solid wood with modern design.',
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    contact: '60123456789',
    category: 'Home',
    owner: 'others'
  },
  {
    id: 'watch-1',
    title: 'Classic Watch',
    price: 560,
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80',
    description: 'Elegant classic watch, works perfectly.',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    contact: '60123456789',
    category: 'Digital',
    owner: 'others'
  },
  {
    id: 'guitar-1',
    title: 'Acoustic Guitar',
    price: 400,
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80',
    description: 'Warm tone acoustic guitar, great for beginners.',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    contact: '60123456789',
    category: 'Learning',
    owner: 'others'
  }
]

export const MarketplaceProvider = ({ children }) => {
  const STORAGE_KEY = 'marketplace_data_v2'
  const [listings, setListings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [language, setLanguage] = useState('zh')
  const [user, setUser] = useState({ name: 'Guest User', school: 'Universiti Malaya (UM)', verified: false })

  const translations = useMemo(() => ({
    en: {
      home: 'Home',
      sell: 'Sell',
      me: 'Me',
      price: 'Price',
      description: 'Description',
      contact: 'Contact',
      searchPlaceholder: 'Search products, brands, keywords',
      verifyStudent: 'Verify Student ID',
      verified: 'Verified',
      verifiedStudent: 'Verified Student',
      logout: 'Log Out'
    },
    zh: {
      home: '首页',
      sell: '卖闲置',
      me: '我的',
      price: '价格',
      description: '详情',
      contact: '联系卖家',
      searchPlaceholder: '搜索商品、品牌、关键词',
      verifyStudent: '认证学生身份',
      verified: '已认证',
      verifiedStudent: '已认证学生',
      logout: '退出登录'
    }
  }), [])
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setListings(parsed)
        } else {
          setListings(Array.isArray(parsed?.listings) ? parsed.listings : defaultProducts)
          setFavorites(Array.isArray(parsed?.favorites) ? parsed.favorites : [])
          setLanguage(parsed?.language === 'en' ? 'en' : 'zh')
          setUser(parsed?.user && typeof parsed.user === 'object' ? parsed.user : { name: 'Guest User', school: 'Universiti Malaya (UM)', verified: false })
        }
      } catch {
        setListings(defaultProducts)
        setFavorites([])
        setLanguage('zh')
        setUser({ name: 'Guest User', school: 'Universiti Malaya (UM)', verified: false })
      }
    } else {
      setListings(defaultProducts)
      setFavorites([])
      setLanguage('zh')
      setUser({ name: 'Guest User', school: 'Universiti Malaya (UM)', verified: false })
    }
  }, [])

  useEffect(() => {
    const payload = { listings, favorites, language, user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [listings, favorites, language, user])

  const addListing = ({ title, price, imageFile, imageDataUrl, description, contact, category, tags = [] }) => {
    const id = `${Date.now()}`
    const imageUrl = imageDataUrl || (imageFile ? URL.createObjectURL(imageFile) : '')
    const createdAt = Date.now()
    const next = [{ id, title, price: Number(price), imageUrl, description: description || '', createdAt, contact: contact || '60123456789', category, tags, owner: 'me' }, ...listings]
    setListings(next)
    return id
  }

  const deleteListing = (id) => {
    setListings(listings.filter(l => l.id !== id))
    setFavorites(favorites.filter(fid => fid !== id))
  }

  const toggleFavorite = (id) => {
    setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'))
  }

  const verifyStudent = () => {
    setUser(prev => ({ ...prev, verified: true }))
  }

  const logoutUser = () => {
    setUser({ name: 'Guest User', school: 'Universiti Malaya (UM)', verified: false })
  }

  const value = useMemo(() => ({
    listings,
    favorites,
    addListing,
    deleteListing,
    toggleFavorite,
    language,
    translations,
    categories: CATEGORY_DEF,
    user,
    toggleLanguage,
    verifyStudent,
    logoutUser
  }), [listings, favorites, language, user])
  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}

export const useMarketplace = () => useContext(MarketplaceContext)
