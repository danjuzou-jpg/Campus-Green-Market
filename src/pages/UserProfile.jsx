import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { ArrowLeft, CheckCircle, Package } from 'lucide-react'
import { SkeletonCard } from '../components/Skeleton.jsx'
import { getUserDisplayStatus } from '../lib/userStatus.js'

const UserProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { language, translations, session } = useMarketplace()
    const t = translations[language]

    const [profile, setProfile] = useState(null)
    const [displayStatus, setDisplayStatus] = useState('unverified')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // 获取用户资料
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, school, avatar_url, verification_status, created_at')
                    .eq('id', id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setDisplayStatus(getUserDisplayStatus(profileData))
                }

                // 获取该用户发布的商品
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('owner_id', id)
                    .order('created_at', { ascending: false })

                if (productsData) {
                    setProducts(productsData.map(p => ({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        imageUrl: p.images?.[0] || '',
                        category: p.category,
                        currency: p.currency || 'MYR',
                        tags: p.tags || []
                    })))
                }
            } catch (err) {
                console.error('Error fetching user profile:', err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchData()
    }, [id])

    const isMe = session?.user?.id === id

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl min-h-screen pb-24">
                <div className="px-4 pt-6">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-200 rounded-full" />
                            <div className="h-5 bg-slate-200 rounded-xl w-24" />
                        </div>
                        <div className="bg-slate-100 rounded-[2.5rem] h-48 mb-6" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-2xl min-h-screen pb-24">
                <div className="px-4 pt-6">
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-teal-600 transition-colors shadow-sm border border-white/50">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                            <Package size={36} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                            {language === 'zh' ? '用户不存在' : 'User not found'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl min-h-screen pb-24">
            {/* Header */}
            <div className="px-4 pt-6 pb-2 sticky top-0 z-10">
                <div className="bg-white/90 backdrop-blur-xl px-5 py-4 rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-white/60 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">
                        {language === 'zh' ? '用户主页' : 'User Profile'}
                    </h1>
                </div>
            </div>

            {/* Profile Card */}
            <div className="px-4 mt-4">
                <div className="bg-[#00b478] px-6 pt-8 pb-8 rounded-[2.5rem] shadow-[0_12px_30px_rgba(0,180,120,0.25)] relative overflow-hidden">
                    {/* Decorative shapes */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center gap-5 relative z-10">
                        <img
                            src={profile.avatar_url || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80'}
                            alt="avatar"
                            className="w-20 h-20 rounded-full object-cover border-[3px] border-white/80 shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-black text-white truncate drop-shadow-sm">
                                    {profile.full_name || 'User'}
                                </div>
                                {displayStatus === 'verified' && (
                                    <CheckCircle size={20} fill="#fdfbf7" className="text-[#00b478] shrink-0" />
                                )}
                                {displayStatus === 'freshman' && (
                                    <span className="text-lg shrink-0" title="Freshman / 新生">🌱</span>
                                )}
                                {displayStatus === 'stranger' && (
                                    <span className="text-lg shrink-0" title="Stranger / 陌生人">⚠️</span>
                                )}
                            </div>
                            <div className="text-[13px] text-teal-50 font-bold truncate mt-1 opacity-90 drop-shadow-sm">
                                {profile.school || 'University'}
                            </div>

                            {/* Verification Badge */}
                            <div className="mt-4">
                                {displayStatus === 'verified' ? (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 min-w-max text-white border border-white/30 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                                        <span>✅</span>
                                        {language === 'zh' ? '已认证 / Verified' : 'Verified'}
                                    </div>
                                ) : displayStatus === 'freshman' ? (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
                                        <span>🌱</span>
                                        {language === 'zh' ? '新生 / Freshman' : 'Freshman'}
                                    </div>
                                ) : displayStatus === 'pending' || displayStatus === 'pending_offer' ? (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-amber-900 rounded-full text-[11px] font-black shadow-lg shadow-black/5 uppercase tracking-wider">
                                        <span className="animate-pulse">⏳</span>
                                        {language === 'zh' ? '审核中' : 'Pending'}
                                    </div>
                                ) : displayStatus === 'stranger' ? (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-full text-[11px] font-black shadow-lg shadow-black/5 uppercase tracking-wider border border-rose-400">
                                        <span>⚠️</span>
                                        {language === 'zh' ? '陌生人 / Stranger' : 'Stranger'}
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white/70 border border-white/20 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                                        {language === 'zh' ? '未认证' : 'Unverified'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User ID */}
            <div className="px-4 mt-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] px-6 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-white/60">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {language === 'zh' ? '用户 ID' : 'User ID'}
                    </div>
                    <div className="text-xs font-mono text-slate-500 break-all select-all">
                        {profile.id}
                    </div>
                </div>
            </div>

            {/* Published Products */}
            <div className="mt-8 px-4">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Package size={16} className="text-teal-600" />
                    <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">
                        {language === 'zh' ? '发布的商品' : 'Published Items'}
                        {products.length > 0 && (
                            <span className="ml-2 text-teal-600">({products.length})</span>
                        )}
                    </h2>
                </div>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 py-10">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <Package size={24} className="text-slate-300" />
                        </div>
                        <div className="text-xs font-bold">
                            {language === 'zh' ? '暂无发布的商品' : 'No items listed yet'}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {products.map(item => (
                            <Link
                                key={item.id}
                                to={`/product/${item.id}`}
                                className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-white/60 group flex flex-col h-full hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
                            >
                                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 relative mb-3">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22system-ui%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E' }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1 px-1">
                                    <div className="text-[13px] text-slate-800 font-bold leading-snug line-clamp-2 mb-1.5">
                                        {item.title}
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <div className="text-teal-600 font-black text-[15px]">
                                            {item.currency === 'CNY' ? '¥' : 'RM'} {item.price}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {item.category || 'Others'}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserProfile
