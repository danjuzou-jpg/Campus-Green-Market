import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { POPULAR_LOCATIONS } from '../lib/locations.js'
import { detectSchoolFromEmail } from '../lib/schools.js'
import { getUserDisplayStatus } from '../lib/userStatus.js'

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

// 纯函数：将数据库商品记录映射为前端对象（模块级，无组件依赖）
const mapDBProduct = (p, currentUserId) => ({
  id: p.id,
  title: p.title,
  price: p.price,
  imageUrl: p.images?.[0] || '',
  imageUrls: p.images || [],
  description: p.description,
  createdAt: new Date(p.created_at).getTime(),
  contact: p.contact_info?.whatsapp || '',
  whatsapp: p.contact_info?.whatsapp || '',
  wechat: p.contact_info?.wechat || '',
  instagram: p.contact_info?.instagram || '',
  locationName: p.location_name,
  lat: p.lat,
  lng: p.lng,
  category: p.category,
  tags: p.tags || [],
  currency: p.currency || 'MYR',
  owner: currentUserId && currentUserId === p.owner_id ? 'me' : 'others',
  owner_id: p.owner_id,
  listingType: p.listing_type || 'idle',
  roomType: p.room_type || null,
  availableFrom: p.available_from || null
})

export const MarketplaceProvider = ({ children }) => {
  const [listings, setListings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('app_language', language)
  }, [language])
  const [session, setSession] = useState(null)
  const [user, setUser] = useState({
    name: 'Guest User',
    school: 'Universiti Malaya (UM)',
    verified: false,
    verificationStatus: 'unverified',
    avatar: '/default-avatar.svg'
  })
  // POPULAR_LOCATIONS 已统一至 src/lib/locations.js 管理

  const [locations, setLocations] = useState(POPULAR_LOCATIONS)

  // 从 DB 动态获取所有地点 (现已简化为静态官方位置列表)
  const fetchLocations = useCallback(async () => {
    // 不再动态请求，避免用户乱填的位置污染首页侧拉分类栏。
  }, [])

  // POPULAR_LOCATIONS 为模块级常量，直接引用无需 useMemo
  const uniqueLocations = POPULAR_LOCATIONS

  const [conversations, setConversations] = useState([])
  const [userLocation, setUserLocation] = useState(null)

  // ── 3.1 Loading 状态 ──
  const [loading, setLoading] = useState({ products: true, profile: false })
  const [authLoading, setAuthLoading] = useState(true)

  // ── 3.2 Toast 通知状态 ──
  const [toast, setToast] = useState(null)
  const showToast = useCallback((type, message, duration = 3000) => {
    setToast({ type, message, duration })
  }, [])
  const clearToast = useCallback(() => setToast(null), [])

  const normalize = useCallback((str) => str.toLowerCase().replace(/[^a-z0-9]/g, ''), []);

  // Lock to prevent red dot "resurrection" during marking read
  const markingReadRef = useRef(new Set())

  const translations = useMemo(() => ({
    en: {
      // 导航
      home: 'Home',
      sell: 'Sell',
      inbox: 'Inbox',
      me: 'Me',
      // 通用
      price: 'Price',
      description: 'Description',
      contact: 'Contact',
      searchPlaceholder: 'Search products, brands, keywords',
      logout: 'Log Out',
      chat: 'Chat',
      send: 'Send',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      noItemsFound: 'No items found',
      noItemsHint: 'Try changing your search or filters',
      // Welcome 页
      welcomeTitle: 'Campus Second-Hand Market',
      welcomeSubtitle: 'Safe, Green, Convenient',
      welcomeFeature1Title: 'Verified Students',
      welcomeFeature1Desc: 'Trade only with verified campus members',
      welcomeFeature2Title: 'Eco-Friendly',
      welcomeFeature2Desc: 'Give your pre-loved items a second life',
      getStarted: 'Get Started',
      // 认证
      verifyStudent: 'Verify Student ID',
      verified: 'Verified',
      verifiedStudent: 'Verified Student',
      verificationPending: 'Verification Pending',
      verifyNow: 'Verify Now',
      verification: 'Verification',
      campusEmail: 'Campus Email',
      verificationCode: 'Code',
      sendCode: 'Send',
      verifyInstantly: 'Verify Instantly',
      uploadIdCard: 'ID Card',
      uploadHint: 'Upload Student ID / Letter',
      uploadFormats: 'Supported formats: JPG, PNG, PDF (Max 5MB)',
      reviewHint: '💡 Manual review usually takes 24 hours. You will receive a notification once verified.',
      submitForReview: 'Submit for Review',
      sendingCode: 'Sending...',
      codeSent: 'Code sent! Check your email.',
      resendIn: 'Resend in',
      unverifiedBanner: 'You are unverified. Verification is required to chat.',
      goVerify: 'Verify',
      verifyToChat: 'Verify to Chat',
      verifyToContact: 'Verify to Contact',
      verifyRequired: 'Verification required to view contact info',
      verifiedBadge: 'Verified',
      pendingBadge: 'Pending',
      // 商品
      productDesc: 'Description',
      noDescription: 'No description provided',
      // 首页
      categories: 'Categories',
      distanceAny: 'Distance: Any',
      demoMode: 'Demo Mode: Verification status simulated as unverified',
      // 发布
      sellItem: 'Sell Item',
      productImages: 'Product Images (Max 9)',
      addPhoto: 'Add Photo',
      title: 'Title',
      titlePlaceholder: 'e.g., Nike Dunk Low',
      currency: 'Currency',
      currencyMYR: 'Malaysian Ringgit (RM)',
      currencyCNY: 'Chinese Yuan (¥)',
      category: 'Category',
      selectCategory: 'Select',
      descriptionLabel: 'Description',
      descPlaceholder: 'Describe your item...',
      tags: 'Tags',
      location: 'Location',
      locationPlaceholder: 'e.g., South Link, UM Library',
      contactMethods: 'Contact Methods (Min 1)',
      listItem: 'List Item',
      tapToPickLocation: 'Tap to pick location',
      tagNegotiable: 'Negotiable',
      tagUrgent: 'Urgent',
      tagNew: 'New',
      tagDelivery: 'Delivery',
      maxImages: 'You can upload up to 9 images',
      titleRequired: 'Title is required',
      priceRequired: 'Price is required',
      categoryRequired: 'Please select a category',
      locationRequired: 'Please enter location name',
      contactRequired: 'At least one contact method is required!',
      publishFailed: 'Failed to publish. Please try again.',
      // 商品详情
      saved: 'Saved',
      addToFavorites: 'Add to Favorites',
      wechatCopied: 'WeChat ID copied to clipboard. Please paste in WeChat to add.',
      whatsappRedirect: 'WhatsApp ID copied to clipboard. Redirecting to WhatsApp...',
      viewItem: 'View Item',
      // 个人中心
      myInbox: 'My Inbox',
      editProfile: 'Edit Profile',
      myListings: 'My Listings',
      favorites: 'Favorites',
      noListings: 'No listings yet',
      noFavorites: 'No favorites yet',
      confirmDelete: 'Confirm to delete this item?',
      confirmLogout: 'Are you sure to log out?',
      username: 'Username',
      schoolName: 'School Name',
      saveChanges: 'Save Changes',
      // 消息
      noMessages: 'No messages yet',
      tapToChat: 'Tap to start chatting',
      typeMessage: 'Type a message...',
      safetyTip: 'Verify student status before trading',
      online: 'Online',
      // 编辑商品
      editProduct: 'Edit Product',
      updateProduct: 'Update Product',
      editSuccess: 'Product updated successfully',
      // 搜索
      searchHistory: 'Recent Searches',
      clearHistory: 'Clear',
      hotTags: 'Popular Tags',
      // 首页卡片
      wantIt: 'I Want It',
      // Auth 页
      loginTitle: 'Welcome Back',
      registerTitle: 'Create Account',
      loginSubtitle: 'Sign in to your 2H account',
      registerSubtitle: 'Join the 2H campus marketplace',
      email: 'Email',
      password: 'Password',
      fullName: 'Your Name',
      login: 'Sign In',
      register: 'Sign Up',
      switchToRegister: "Don't have an account? Sign Up",
      switchToLogin: 'Already have an account? Sign In',
      emailInputPlaceholder: 'Enter your email',
      passwordInputPlaceholder: 'Password (min 6 characters)',
      namePlaceholder: 'Enter your name',
      registerSuccess: 'Registration successful! Please check your email to verify.',
      orContinueWith: 'or',
      guestMode: 'Browse as Guest',
      forgotPassword: 'Forgot Password?',
      resetPasswordTitle: 'Reset Password',
      resetPasswordSubtitle: 'Enter your email to receive a reset link',
      sendResetLink: 'Send Reset Link',
      backToLogin: 'Back to Login',
      resetEmailSent: 'Password reset link sent! Please check your email.',
      newPasswordTitle: 'Set New Password',
      newPasswordSubtitle: 'Please enter your new password',
      updatePassword: 'Update Password',
      passwordUpdated: 'Password updated successfully! Please log in.',
      eduEmailRequired: 'Only verified student emails are allowed. Please use your university campus email.',
    },
    zh: {
      // 导航
      home: '首页',
      sell: '卖闲置',
      inbox: '消息',
      me: '我的',
      // 通用
      price: '价格',
      description: '详情',
      contact: '联系卖家',
      searchPlaceholder: '搜索商品、品牌、关键词',
      logout: '退出登录',
      chat: '私聊',
      send: '发送',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      loading: '加载中...',
      noItemsFound: '没有找到商品',
      noItemsHint: '试试换个搜索条件或筛选',
      // Welcome 页
      welcomeTitle: '校园二手市场',
      welcomeSubtitle: '安全 · 环保 · 便捷',
      welcomeFeature1Title: '学生认证',
      welcomeFeature1Desc: '仅与已认证的校园成员交易',
      welcomeFeature2Title: '绿色环保',
      welcomeFeature2Desc: '让闲置物品焕发新生',
      getStarted: '开始使用',
      // 认证
      verifyStudent: '认证学生身份',
      verified: '已认证',
      verifiedStudent: '已认证学生',
      verificationPending: '审核中',
      verifyNow: '立即认证',
      verification: '身份认证',
      campusEmail: '校园邮箱',
      verificationCode: '验证码',
      sendCode: '发送',
      verifyInstantly: '立即验证',
      uploadIdCard: '证件上传',
      uploadHint: '上传学生证 / 在读证明',
      uploadFormats: '支持格式：JPG、PNG、PDF（最大5MB）',
      reviewHint: '💡 人工审核通常需要24小时，审核通过后会通知你。',
      submitForReview: '提交审核',
      sendingCode: '发送中...',
      codeSent: '验证码已发送！请查看邮箱。',
      resendIn: '重新发送',
      unverifiedBanner: '您尚未完成学生认证，无法联系卖家',
      goVerify: '去认证',
      verifyToChat: '认证后开启聊天',
      verifyToContact: '认证后联系',
      verifyRequired: '为保护隐私，请先完成学生认证',
      verifiedBadge: '已认证 / Verified',
      pendingBadge: '审核中 / Pending',
      // 商品
      productDesc: '商品描述',
      noDescription: '暂无描述',
      // 首页
      categories: '分类',
      distanceAny: '距离: 不限',
      demoMode: '正在演示模式：认证状态已模拟为 unverified',
      // 发布
      sellItem: '发布闲置',
      productImages: '商品图片 (最多9张)',
      addPhoto: '添加图片',
      title: '标题',
      titlePlaceholder: '如：Nike Dunk Low',
      currency: '货币',
      currencyMYR: '马币 (RM)',
      currencyCNY: '人民币 (¥)',
      category: '分类',
      selectCategory: '选择分类',
      descriptionLabel: '描述',
      descPlaceholder: '描述一下你的宝贝...',
      tags: 'Tags / 标签',
      location: '交易地点',
      locationPlaceholder: '如：South Link, UM Library',
      contactMethods: '联系方式 (至少填一项)',
      listItem: '发布商品',
      tapToPickLocation: '点击地图选择位置',
      tagNegotiable: '可小刀',
      tagUrgent: '急出',
      tagNew: '全新',
      tagDelivery: '可邮寄',
      maxImages: '最多只能上传9张图片',
      titleRequired: '标题不能为空',
      priceRequired: '价格不能为空',
      categoryRequired: '请选择分类',
      locationRequired: '请输入地点名称',
      contactRequired: '必须填写至少一种联系方式！',
      publishFailed: '发布失败，请重试',
      // 商品详情
      saved: '已收藏',
      addToFavorites: '收藏',
      wechatCopied: '微信号已复制到剪贴板，请在微信粘贴使用粘贴添加',
      whatsappRedirect: 'WhatsApp账号已复制到剪贴板，即将直接跳转到whatsapp页面',
      viewItem: '查看商品',
      // 个人中心
      myInbox: '我的消息',
      editProfile: '编辑资料',
      myListings: '我发布的',
      favorites: '收藏夹',
      noListings: '暂无发布的商品',
      noFavorites: '暂无收藏的商品',
      confirmDelete: '确定下架该商品吗？',
      confirmLogout: '确定要退出登录吗？',
      username: '用户名',
      schoolName: '学校名称',
      saveChanges: '保存修改',
      // 消息
      noMessages: '暂无消息',
      tapToChat: '点击开始聊天',
      typeMessage: '输入消息...',
      safetyTip: '交易前请先核实对方学生身份',
      online: '在线',
      // 编辑商品
      editProduct: '编辑商品',
      updateProduct: '更新商品',
      editSuccess: '商品更新成功',
      // 搜索
      searchHistory: '最近搜索',
      clearHistory: '清空',
      hotTags: '热门标签',
      // 首页卡片
      wantIt: '我想要',
      // Auth 页
      loginTitle: '欢迎回来',
      registerTitle: '创建账号',
      loginSubtitle: '登录你的 2H 账号',
      registerSubtitle: '加入 2H 校园二手市场',
      email: '邮箱地址',
      password: '密码',
      fullName: '你的昵称',
      login: '登录',
      register: '注册',
      switchToRegister: '没有账号？去注册',
      switchToLogin: '已有账号？去登录',
      emailInputPlaceholder: '输入你的邮箱',
      passwordInputPlaceholder: '输入密码（最少6位）',
      namePlaceholder: '输入你的昵称',
      registerSuccess: '注册成功！请检查邮箱完成验证。',
      orContinueWith: '或者',
      guestMode: '先逗逗（游客模式）',
      forgotPassword: '忘记密码？',
      resetPasswordTitle: '重置密码',
      resetPasswordSubtitle: '输入你的邮箱，我们将发送重置链接',
      sendResetLink: '发送重置链接',
      backToLogin: '返回登录',
      resetEmailSent: '重置密码链接已发送至您的邮箱！请查收。',
      newPasswordTitle: '设置新密码',
      newPasswordSubtitle: '请输入您的新密码',
      updatePassword: '更新密码',
      passwordUpdated: '密码更新成功，请使用新密码登录！',
      eduEmailRequired: '仅限学生邮箱注册，请使用你的大学校园邮箱。',
    }
  }), [])

  // 1. Auth & Initial Data Fetch
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      fetchLocations()
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchFavorites(session.user.id)
        fetchConversations(session.user.id)
        fetchProducts(session.user.id).finally(() => setAuthLoading(false))
      } else {
        fetchProducts(null).finally(() => setAuthLoading(false))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchFavorites(session.user.id)
        fetchConversations(session.user.id)
        fetchProducts(session.user.id) // 重新 fetch 以更新 owner 标记
      } else {
        // Reset to Guest
        setUser({
          name: 'Guest User',
          school: 'Universiti Malaya (UM)',
          verified: false,
          verificationStatus: 'unverified',
          avatar: '/default-avatar.svg'
        })
        setFavorites([])
        setConversations([])
        fetchProducts(null) // 登出后重新 fetch，清除 owner 标记
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 更新 last_seen_at：登录时、切回标签页时、每5分钟定时触发
  useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id
    const doUpdate = () => {
      supabase.from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
        .then()
    }
    doUpdate()
    const handleVisibility = () => { if (!document.hidden) doUpdate() }
    document.addEventListener('visibilitychange', handleVisibility)
    const interval = setInterval(doUpdate, 5 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [session?.user?.id])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        // Auto-fill school from email if profile has no school set
        const schoolName = data.school || detectSchoolFromEmail(data.email)?.en || 'Unknown University'
        if (!data.school && schoolName !== 'Unknown University') {
          // Background update: fill in school for existing users
          supabase.from('profiles').update({ school: schoolName }).eq('id', userId).then()
        }
        const computedStatus = getUserDisplayStatus(data)
        setUser({
          id: data.id,
          name: data.full_name || data.email?.split('@')[0] || 'User',
          school: schoolName,
          verified: computedStatus === 'verified',
          verificationStatus: data.verification_status || 'unverified',
          displayStatus: computedStatus,
          createdAt: data.created_at,
          avatar: data.avatar_url || '/default-avatar.svg',
          email: data.email
        })
      } else if (error && (error.code === 'PGRST116' || error.details?.includes('0 rows'))) {
        // Profile doesn't exist, create it
        // Use user_metadata from signUp (school, full_name) if available
        const userMeta = session?.user?.user_metadata || {}
        const schoolFromMeta = userMeta.school || detectSchoolFromEmail(session?.user?.email)?.en || 'Unknown University'
        const nameFromMeta = userMeta.full_name || session?.user?.email?.split('@')[0] || 'User'

        const insertStatus = userMeta.is_freshman ? 'pending_offer' : 'unverified'
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: session?.user?.email,
            full_name: nameFromMeta,
            school: schoolFromMeta,
            verification_status: insertStatus
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else if (newProfile) {
          const computedStatus = getUserDisplayStatus(newProfile)
          setUser({
            id: newProfile.id,
            name: newProfile.full_name,
            school: newProfile.school,
            verified: computedStatus === 'verified',
            verificationStatus: newProfile.verification_status || 'unverified',
            displayStatus: computedStatus,
            createdAt: newProfile.created_at,
            avatar: newProfile.avatar_url || '/default-avatar.svg',
            email: newProfile.email
          })
        }
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err)
      // ⚠️ 安全修复 (P0-3): 完全移除 localStorage 认证状态回退。
      // 旧逻辑允许用户通过 DevTools 手动伪造 verification_fallback_xxx 来
      // 解锁联系方式，违反了平台的学生认证保护。
      // 如果 Supabase 请求失败，用户保持 unverified 状态，待下次刷新后重试。
    }
  }

  const getProductById = useCallback(async (id, currentUserId = null) => {
    // 1. 先在内存中找
    const local = listings.find(l => l.id === id)
    if (local) return local

    // 2. 否则向 Supabase 单独请求
    try {
      const { data: p, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error || !p) return null
      return mapDBProduct(p, currentUserId)
    } catch (err) {
      console.error('Error fetching product by id:', err)
      return null
    }
  }, [listings])

  // mapDBProduct 已提升至模块级（文件顶部），这里不再重复定义

  // Home Page Paged Search
  const fetchProducts = useCallback(async (currentUserId = null, {
    page = 1,
    limit = 20,
    searchTerm = '',
    categoryFilter = 'All',
    locationFilter = 'All Locations',
    userLat = null,
    userLng = null,
    maxDistanceKm = null,
    schoolFilter = null,
    listingTypeFilter = null  // 'idle' | 'rental' | null (all)
  } = {}) => {
    setLoading(prev => ({ ...prev, products: true }))
    try {
      // If school filter is active, first get matching user IDs
      let schoolOwnerIds = null
      if (schoolFilter) {
        const { data: schoolProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('school', schoolFilter)
        schoolOwnerIds = (schoolProfiles || []).map(p => p.id)
        if (schoolOwnerIds.length === 0) {
          // No users from this school → empty result
          setListings(prev => page === 1 ? [] : prev)
          return false
        }
      }

      const { data, error } = await supabase.rpc('search_products', {
        search_term: searchTerm,
        category_filter: categoryFilter,
        location_filter: locationFilter,
        user_lat: userLat,
        user_lng: userLng,
        max_distance_km: maxDistanceKm === 'Any' ? null : (Number(maxDistanceKm) || null),
        listing_type_filter: listingTypeFilter,
        page_limit: limit,
        page_offset: (page - 1) * limit
      })

      if (error) {
        // Fallback to basic fetch if RPC is not created yet
        console.warn('RPC failed, falling back to basic query', error)
        let q = supabase.from('products').select('*').order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
        if (categoryFilter !== 'All') q = q.eq('category', categoryFilter)

        // School filter: restrict to owners from selected school
        if (schoolOwnerIds) {
          q = q.in('owner_id', schoolOwnerIds)
        }

        // Listing type filter (idle vs rental)
        if (listingTypeFilter === 'rental') {
          q = q.eq('listing_type', 'rental')
        } else if (listingTypeFilter === 'idle') {
          // idle: where listing_type is 'idle' OR listing_type is null (legacy items)
          q = q.or('listing_type.eq.idle,listing_type.is.null')
        }

        // Multi-keyword fuzzy search fallback
        if (searchTerm) {
          const keywords = searchTerm.trim().split(/\s+/).filter(Boolean)
          const escapePostgrest = (str) => str.replace(/[%_,.]/g, '\\$&')
          keywords.forEach(kw => {
            const safeKw = escapePostgrest(kw)
            q = q.or(`title.ilike.%${safeKw}%,description.ilike.%${safeKw}%,location_name.ilike.%${safeKw}%`)
          })
        }

        const { data: fallbackData, error: fbError } = await q
        if (fbError) throw fbError

        const mapped = fallbackData.map(p => mapDBProduct(p, currentUserId))

        setListings(prev => page === 1 ? mapped : [...prev, ...mapped.filter(n => !prev.some(o => o.id === n.id))])
        return fallbackData.length >= limit
      }

      let filtered = data
      // Post-filter by school if RPC doesn't support it
      if (schoolOwnerIds) {
        filtered = filtered.filter(p => schoolOwnerIds.includes(p.owner_id))
      }
      // Post-filter by listing type
      if (listingTypeFilter === 'rental') {
        filtered = filtered.filter(p => p.listing_type === 'rental')
      } else if (listingTypeFilter === 'idle') {
        filtered = filtered.filter(p => !p.listing_type || p.listing_type === 'idle')
      }

      const mapped = filtered.map(p => mapDBProduct(p, currentUserId))
      setListings(prev => page === 1 ? mapped : [...prev, ...mapped.filter(n => !prev.some(o => o.id === n.id))])
      return data.length >= limit
    } catch (err) {
      console.error('Error fetching products:', err)
      return false
    } finally {
      setLoading(prev => ({ ...prev, products: false }))
    }
  }, [])

  // Profile specific fetchers
  const fetchUserProducts = useCallback(async (userId) => {
    const { data } = await supabase.from('products').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
    return (data || []).map(p => mapDBProduct(p, userId))
  }, [])

  const fetchFavoriteProducts = useCallback(async (userId) => {
    const { data } = await supabase.from('favorites').select('products(*)').eq('user_id', userId)
    return (data || []).map(f => mapDBProduct(f.products, userId)).sort((a, b) => b.createdAt - a.createdAt)
  }, [])

  const fetchFavorites = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId)

      if (data) {
        setFavorites(data.map(f => f.product_id))
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
    }
  }, [])

  const fetchConversations = useCallback(async (userId) => {
    // This is a simplified fetch. In a real app, you might join with profiles/products.
    // For now, we assume 'conversations' table has cached info or we fetch it.
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(
            id,
            content,
            sender_id,
            created_at,
            is_withdrawn
          )
        `)
        // Limit to 50 latest messages to prevent memory overflow.
        // For full pagination, ChatRoom should fetch more via an RPC.
        .order('created_at', { foreignTable: 'messages', ascending: false })
        .limit(50, { foreignTable: 'messages' })
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (data) {
        const mapped = data.map(c => {
          const isBuyer = c.buyer_id === userId
          const otherName = isBuyer ? c.seller_name : c.buyer_name
          const lastReadAt = isBuyer ? c.buyer_last_read_at : c.seller_last_read_at
          const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0

          const unreadMsgs = c.messages.filter(m =>
            m.sender_id !== userId && new Date(m.created_at).getTime() > lastReadTime
          )

          return {
            id: c.id,
            productId: c.product_id,
            productTitle: c.product_title,
            productImage: c.product_image,
            sellerName: otherName || 'User',
            otherUserId: isBuyer ? c.seller_id : c.buyer_id,
            messages: c.messages.map(m => ({
              id: m.id,
              text: m.is_withdrawn ? '' : m.content,
              sender: m.sender_id === userId ? 'me' : 'other',
              timestamp: new Date(m.created_at).getTime(),
              is_withdrawn: m.is_withdrawn || false
            })).sort((a, b) => a.timestamp - b.timestamp),
            lastMessage: c.last_message,
            lastTimestamp: new Date(c.updated_at).getTime(),
            // 🟢 Fix: respect the marking-read lock to prevent red dot resurrection
            unreadCount: markingReadRef.current.has(c.id) ? 0 : unreadMsgs.length
          }
        })
        setConversations(mapped)
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    }
  }, [])

  const addListing = useCallback(async ({ title, price, images, description, whatsapp, wechat, instagram, locationName, lat, lng, category, tags = [], currency = 'MYR', listingType = 'idle', roomType = null, availableFrom = null }) => {
    if (!session?.user) {
      showToast('error', language === 'zh' ? '请先登录' : 'Please login first')
      return null
    }

    try {
      // 1. Upload Images
      const uploadedUrls = []
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        // 安全修复 (P0-2): 在文件路径中加入 userId 作为文件夹前缀，
        // 配合 Storage RLS 策略中的 storage.foldername(name)[1] = auth.uid()::text
        // 使得只有文件所有者可以删除/更新自己的图片
        const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          showToast('error', language === 'zh' ? `图片上传失败: ${uploadError.message}` : `Image upload failed: ${uploadError.message}`)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      // 2. Insert into DB
      const locationPoint = (lat && lng) ? `POINT(${lng} ${lat})` : null
      const payload = {
        title,
        price: Number(price),
        currency,
        description,
        images: uploadedUrls,
        category,
        tags,
        location_name: locationName,
        location: locationPoint,
        lat,
        lng,
        owner_id: session.user.id,
        contact_info: { whatsapp, wechat, instagram },
        listing_type: listingType,
        room_type: roomType,
        available_from: availableFrom
      }

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('DB insert error:', error)
        showToast('error', language === 'zh' ? `发布失败: ${error.message}` : `Product publish failed: ${error.message}`)
        throw error
      }

      // Refresh listings and locations
      fetchProducts(session.user.id)
      fetchLocations()
      return data.id

    } catch (err) {
      console.error('Error adding listing:', err)
      if (!err.message) {
        showToast('error', language === 'zh' ? '发布失败，请重试' : 'Failed to publish. Please try again.')
      }
      return null
    }
  }, [session, language, showToast])

  const deleteListing = useCallback(async (id) => {
    if (!session?.user) {
      showToast('error', language === 'zh' ? '请先登录' : 'Please login first')
      return false
    }
    try {
      // 1. 强制从数据库直接获取当前商品的最新图片列表 (不受前端组件状态影响)
      const { data: productData, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', id)
        .single()

      // 2. 遍历删除 Storage 中的文件
      if (!fetchError && productData?.images?.length) {
        for (const url of productData.images) {
          if (!url) continue
          const fileName = url.split('/').pop()?.split('?')[0]
          if (fileName) {
            await supabase.storage.from('product-images').remove([fileName])
          }
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('owner_id', session.user.id) // RLS 额外保障，与 updateListing 一致
      if (error) throw error
      setListings(prev => prev.filter(l => l.id !== id))
      fetchLocations() // 同步更新地点列表
      showToast('success', language === 'zh' ? '商品已删除' : 'Item deleted')
      return true
    } catch (err) {
      console.error('Error deleting:', err)
      showToast('error', language === 'zh' ? '删除失败' : 'Failed to delete')
      return false
    }
  }, [session, language, showToast, fetchLocations])

  const deleteProduct = useCallback((id) => deleteListing(id), [deleteListing])

  const toggleFavorite = useCallback(async (productId) => {
    if (!session?.user) {
      showToast('warning', language === 'zh' ? '请先登录' : 'Please login first')
      return
    }

    const isFav = favorites.includes(productId)
    try {
      if (isFav) {
        await supabase.from('favorites').delete().match({ user_id: session.user.id, product_id: productId })
        setFavorites(prev => prev.filter(id => id !== productId))
      } else {
        await supabase.from('favorites').insert({ user_id: session.user.id, product_id: productId })
        setFavorites(prev => [...prev, productId])
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }, [session, favorites, language, showToast])

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'))
  }, [])

  const updateVerificationStatus = useCallback(async (status) => {
    if (!session?.user) return

    // 1. Immediate Local Update (UI First)
    setUser(prev => ({
      ...prev,
      verificationStatus: status,
      verified: status === 'verified'
    }))

    // 2. Immediate Local Persistence
    try {
      localStorage.setItem(`verification_fallback_${session.user.id}`, JSON.stringify({
        status,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.error('LocalStorage persistence failed:', e)
    }

    // 3. Background Sync (Fire-and-forget)
    (async () => {
      try {
        // Ensure Profile Exists
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id', ignoreDuplicates: true })

        if (upsertError) console.warn('Background upsert warning:', upsertError)

        // Update Status
        const { error } = await supabase
          .from('profiles')
          .update({ verification_status: status })
          .eq('id', session.user.id)
          .select()
          .single()

        if (error) throw error

        localStorage.removeItem(`verification_fallback_${session.user.id}`)
      } catch (err) {
        console.warn('Background sync failed:', err)
      }
    })()

    return true
  }, [session])

  // 发送 edu.my 邮箱验证码（用于永久替换用户邮箱）
  const sendVerificationEmail = async (email) => {
    if (!email.toLowerCase().endsWith('.edu.my')) {
      throw new Error('Invalid email domain')
    }
    const { error } = await supabase.auth.updateUser({
      email: email
    })
    if (error) throw error
    // 同时记录认证邮箱到 profile 的冗余字段，方便快速查询
    if (session?.user) {
      await supabase.from('profiles')
        .update({ verification_email: email })
        .eq('id', session.user.id)
    }
    return true
  }

  // 上传认证证件到 Storage
  const uploadVerificationDoc = async (file) => {
    if (!session?.user) throw new Error('Not logged in')
    const fileExt = file.name.split('.').pop()
    const fileName = `verify_${session.user.id}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 记录文件路径到 profile（Private bucket 不生成 publicUrl）
    await supabase.from('profiles')
      .update({
        verification_doc_url: fileName,
        verification_status: 'pending'
      })
      .eq('id', session.user.id)

    setUser(prev => ({ ...prev, verificationStatus: 'pending' }))
    return true
  }

  const updateListing = useCallback(async (id, { title, price, description, whatsapp, wechat, instagram, locationName, lat, lng, category, tags = [], currency = 'MYR', newImages = [], retainedImages = [], deletedImages = [] }) => {
    if (!session?.user) return null
    try {
      // 1. Delete removed images from storage
      for (const url of deletedImages) {
        if (!url) continue;
        const fileName = url.split('/').pop()?.split('?')[0]
        if (fileName) {
          const { error } = await supabase.storage.from('product-images').remove([fileName])
          if (error) console.error('Failed to remove old image:', error)
        }
      }

      // 2. Upload new images
      const newUrls = []
      for (const file of newImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        newUrls.push(publicUrl)
      }

      const finalImages = [...retainedImages, ...newUrls]

      const payload = {
        title,
        price: Number(price),
        currency,
        description,
        category,
        tags,
        location_name: locationName,
        lat,
        lng,
        contact_info: { whatsapp, wechat, instagram },
        updated_at: new Date().toISOString()
      }

      if (finalImages.length > 0) {
        payload.images = finalImages
      }

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .eq('owner_id', session.user.id) // RLS 额外保障
        .select()
        .single()

      if (error) throw error

      // 刷新列表
      fetchProducts(session.user.id)
      return data.id
    } catch (err) {
      console.error('Error updating listing:', err)
      return null
    }
  }, [session, fetchProducts])

  // 标记会话已读
  const markConversationRead = useCallback(async (conversationId) => {
    if (!session?.user) return
    try {
      // 🟢 Fix: Add to lock set to prevent red dot resurrection
      markingReadRef.current.add(conversationId)

      // Optimistic UI Update: 立即在本地清除未读数，让小红点瞬间消失
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ))

      const { data: convData } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single()

      if (!convData) return

      const isBuyer = convData.buyer_id === session.user.id
      const field = isBuyer ? 'buyer_last_read_at' : 'seller_last_read_at'

      await supabase
        .from('conversations')
        .update({ [field]: new Date().toISOString() })
        .eq('id', conversationId)

      // Release lock after DB confirmed
      markingReadRef.current.delete(conversationId)
    } catch (err) {
      console.error('Error marking conversation read:', err)
      markingReadRef.current.delete(conversationId)
    }
  }, [session])


  const logoutUser = useCallback(async () => {
    await supabase.auth.signOut()
    // State clearing is handled by onAuthStateChange
  }, [])

  // setUserAvatar 已移除，头像上传统一使用 uploadAvatar(file)

  // Helper to upload avatar file directly (called from Profile.jsx ideally)
  const uploadAvatar = async (file) => {
    if (!session?.user) return
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar_${session.user.id}_${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (error) {
      console.error('Avatar upload error:', error)
      showToast('error', language === 'zh' ? '头像上传失败' : 'Avatar upload failed')
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id)
    setUser(prev => ({ ...prev, avatar: publicUrl }))
    showToast('success', language === 'zh' ? '头像已更新' : 'Avatar updated')
  }

  const updateUser = async ({ name, school }) => {
    if (!session?.user) return
    try {
      await supabase
        .from('profiles')
        .update({ full_name: name, school })
        .eq('id', session.user.id)
      setUser(prev => ({ ...prev, name, school }))
    } catch (err) {
      console.error('Update user error:', err)
    }
  }



  // 3.6 举报功能
  const reportContent = useCallback(async (type, targetId, reason, details = '') => {
    if (!session?.user) {
      showToast('error', language === 'zh' ? '请先登录' : 'Please login first')
      return
    }
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      report_type: type,
      target_id: targetId,
      reason,
      details
    })
    if (error) throw error
  }, [session, language, showToast])

  // 删除会话
  const deleteConversation = useCallback(async (conversationId) => {
    if (!session?.user) return
    try {
      // 先删除该会话下所有消息
      await supabase.from('messages').delete().eq('conversation_id', conversationId)
      // 再删除会话本身
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId)
      if (error) throw error
      // Optimistic: 立即从本地状态移除
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      showToast('success', language === 'zh' ? '会话已删除' : 'Conversation deleted')
    } catch (err) {
      console.error('Error deleting conversation:', err)
      showToast('error', language === 'zh' ? '删除失败' : 'Failed to delete')
    }
  }, [session, language, showToast])

  const sendMessage = useCallback(async (conversationId, text) => {
    if (!session?.user) return
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content: text
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      // Update conversation updated_at and last_message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message: text
        })
        .eq('id', conversationId)

      if (updateError) console.error('Error updating conversation timestamp:', updateError)

      // Optimistic update
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, {
              id: data?.id || Date.now(),
              text,
              sender: 'me',
              timestamp: Date.now()
            }],
            lastMessage: text,
            lastTimestamp: Date.now()
          }
        }
        return conv
      }))
    } catch (err) {
      console.error('Error sending message:', err)
      showToast('error', language === 'zh' ? '消息发送失败' : 'Failed to send message')
    }
  }, [session, language, showToast])

  // 只查找已有会话，不创建新会话
  const findConversation = useCallback(async (productId) => {
    if (!session?.user) return null

    // 1. Check local state
    const existing = conversations.find(c => c.productId === productId)
    if (existing) return existing.id

    try {
      // 2. Check DB to be safe
      const { data: existingRemote } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', session.user.id)
        .maybeSingle()

      return existingRemote?.id || null
    } catch (err) {
      console.error('Error finding conversation:', err)
      return null
    }
  }, [session, conversations])

  // 原子地创建会话并发送第一条消息（延迟创建：只有发消息时才建会话）
  const createConversationWithMessage = useCallback(async (product, messageText) => {
    if (!session?.user) return null

    // 防止自己给自己发消息
    if (product.owner_id === session.user.id) {
      showToast('warning', language === 'zh' ? '不能给自己的商品发消息' : 'Cannot message your own product')
      return null
    }

    try {
      // 再次检查是否已存在（防止并发重复）
      const { data: existingRemote } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', session.user.id)
        .maybeSingle()

      let convId = existingRemote?.id

      if (!convId) {
        // 获取卖家真实昵称
        let sellerRealName = 'Seller'
        try {
          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', product.owner_id)
            .single()
          if (sellerProfile?.full_name) sellerRealName = sellerProfile.full_name
        } catch (e) {
          console.warn('Could not fetch seller name:', e)
        }

        // 创建会话
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            product_id: product.id,
            buyer_id: session.user.id,
            seller_id: product.owner_id,
            product_title: product.title,
            product_image: product.imageUrls?.[0] || product.imageUrl,
            seller_name: sellerRealName,
            buyer_name: user.name,
            last_message: messageText,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (convError) throw convError
        convId = convData.id
      }

      // 发送第一条消息
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: session.user.id,
          content: messageText
        })
        .select()
        .single()

      if (msgError) throw msgError

      // 更新 conversation 的 last_message
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString(), last_message: messageText })
        .eq('id', convId)

      // 添加到本地状态
      const newConv = {
        id: convId,
        productId: product.id,
        productTitle: product.title,
        productImage: product.imageUrls?.[0] || product.imageUrl,
        sellerName: 'Seller',
        otherUserId: product.owner_id,
        messages: [{
          id: msgData?.id || Date.now(),
          text: messageText,
          sender: 'me',
          timestamp: Date.now()
        }],
        lastMessage: messageText,
        lastTimestamp: Date.now(),
        unreadCount: 0
      }
      setConversations(prev => {
        // 避免重复
        const filtered = prev.filter(c => c.id !== convId)
        return [newConv, ...filtered]
      })

      return convId
    } catch (err) {
      console.error('Error creating conversation with message:', err)
      showToast('error', language === 'zh' ? '发送失败' : 'Failed to send')
      return null
    }
  }, [session, user.name, language, showToast])

  // 实时新消息：只追加到对应会话，避免全量 fetchConversations
  const addIncomingMessage = useCallback((conversationId, rawMsg) => {
    // If _update flag is set, replace existing message in-place (e.g. for withdrawal)
    if (rawMsg._update) {
      setConversations(prev => prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m => m.id === rawMsg.id
            ? {
              ...m,
              text: rawMsg.content || '',
              is_withdrawn: rawMsg.is_withdrawn || false
            }
            : m
          )
        }
      }))
      return
    }

    const newMsg = {
      id: rawMsg.id,
      text: rawMsg.content,
      sender: 'other',
      timestamp: new Date(rawMsg.created_at).getTime(),
      is_withdrawn: rawMsg.is_withdrawn || false
    }
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c
      return {
        ...c,
        messages: [...c.messages, newMsg],
        lastMessage: rawMsg.is_withdrawn ? (rawMsg.sender_id === session?.user?.id ? '你撤回了一条消息' : '消息已撤回') : rawMsg.content,
        lastTimestamp: new Date(rawMsg.created_at).getTime(),
        unreadCount: markingReadRef.current.has(conversationId) ? 0 : (c.unreadCount || 0) + 1
      }
    }))
  }, [session?.user?.id])

  const unreadCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
  }, [conversations])

  const value = useMemo(() => ({
    listings,
    favorites,
    addListing,
    updateListing,
    deleteListing,
    toggleFavorite,
    language,
    translations,
    categories: CATEGORY_DEF,
    user,
    session,
    toggleLanguage,
    updateVerificationStatus,
    sendVerificationEmail,
    uploadVerificationDoc,
    logoutUser,
    uploadAvatar,
    updateUser,
    locations: uniqueLocations,
    fetchLocations,
    normalize,
    deleteProduct,
    conversations,
    sendMessage,
    findConversation,
    createConversationWithMessage,
    markConversationRead,
    fetchConversations,
    deleteConversation,
    addIncomingMessage,
    userLocation,
    setUserLocation,
    // New Fetchers for Pagination
    getProductById,
    fetchProducts,
    fetchUserProducts,
    fetchFavoriteProducts,
    // 3.1 Loading
    loading,
    // 安全修复 (P0-1): authLoading 加入 context value，
    // 使 RequireAuth 路由守卫能正确显示加载动画，防止刷新时闪屏跳转
    authLoading,
    // 3.2 Toast
    toast,
    showToast,
    clearToast,
    // 3.6 Report
    reportContent,
    unreadCount
  }), [listings, favorites, language, user, session, uniqueLocations, conversations, userLocation, loading, authLoading, toast, unreadCount,
    // useCallback-stabilized functions
    addListing, updateListing, deleteListing, toggleFavorite, toggleLanguage, logoutUser,
    normalize, sendMessage, findConversation, createConversationWithMessage, markConversationRead, fetchConversations,
    deleteConversation, addIncomingMessage, reportContent, showToast, clearToast, translations,
    getProductById, fetchProducts, fetchUserProducts, fetchFavoriteProducts])
  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}

export const useMarketplace = () => useContext(MarketplaceContext)
