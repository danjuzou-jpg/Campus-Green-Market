import React from 'react'

/* ── 基础骨架块 ── */
const Bone = ({ className = '' }) => (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
)

/* ── 商品卡片骨架（首页用）── */
export const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-full flex flex-col">
        <Bone className="aspect-square w-full rounded-none rounded-t-xl" />
        <div className="p-3 space-y-2 flex-1">
            <Bone className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-1">
                <Bone className="h-5 w-16" />
                <Bone className="h-3 w-12" />
            </div>
        </div>
    </div>
)

/* ── 商品详情骨架 ── */
export const SkeletonDetail = () => (
    <div className="min-h-screen bg-white pb-20">
        <div className="mx-auto max-w-6xl md:p-8">
            <div className="md:grid md:grid-cols-2 md:gap-12">
                {/* 图片区 */}
                <div>
                    <Bone className="w-full aspect-square md:rounded-3xl rounded-none" />
                    <div className="flex gap-3 mt-4 px-4 md:px-0 md:justify-center">
                        {[1, 2, 3].map(i => (
                            <Bone key={i} className="w-14 h-14 md:w-16 md:h-16 rounded-xl" />
                        ))}
                    </div>
                </div>
                {/* 信息区 */}
                <div className="p-6 md:p-0 space-y-6">
                    <div className="space-y-3">
                        <Bone className="h-8 w-3/4" />
                        <Bone className="h-8 w-24" />
                        <Bone className="h-6 w-40 rounded-full" />
                    </div>
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                        <Bone className="h-3 w-20" />
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-5/6" />
                        <Bone className="h-4 w-2/3" />
                    </div>
                    <div className="hidden md:block space-y-3 pt-4">
                        <Bone className="h-14 w-full rounded-xl" />
                        <div className="grid grid-cols-2 gap-4">
                            <Bone className="h-12 rounded-xl" />
                            <Bone className="h-12 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

/* ── 消息列表骨架 ── */
export const SkeletonInbox = () => (
    <div className="space-y-0">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
                <Bone className="w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                        <Bone className="h-4 w-24" />
                        <Bone className="h-3 w-10" />
                    </div>
                    <Bone className="h-3 w-32" />
                    <Bone className="h-3 w-48" />
                </div>
            </div>
        ))}
    </div>
)

export default Bone
