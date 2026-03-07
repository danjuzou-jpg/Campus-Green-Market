# 2NH Marketplace — 项目全面分析报告

> **文档用途**：任何 AI 助手（Claude、GPT、Gemini 等）在接手本项目时，只需先阅读本文档，即可快速了解项目全貌。
> **撰写时间**：2026-02-22

---

## 一、项目是什么？

**2NH Marketplace** 是一个面向**马来西亚大学生**（目前以 Universiti Malaya 为主）的**校园二手交易平台**。

### 核心想法

- 学生可以发布自己不需要的二手物品（数码、时尚、书籍等）
- 其他学生可以浏览、搜索、按分类/位置筛选这些商品
- 通过站内聊天或 WhatsApp / 微信 / Instagram 联系卖家
- 需要**学生身份认证**后才能联系卖家，保障交易安全
- 支持中英文双语切换
- 支持地图选点标记交易位置

### 产品定位

校园封闭社区 + 二手交易 + 学生认证信任体系

---

## 二、技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 18 | 单页应用（SPA） |
| **构建工具** | Vite 5 | 快速开发服务器 |
| **样式** | TailwindCSS 3 | 工具类 CSS |
| **路由** | react-router-dom 6 | 客户端路由 |
| **后端 / 数据库** | Supabase | PostgreSQL + Auth + Storage + Realtime |
| **地图** | Leaflet + react-leaflet | 交易地点选取 |
| **图标** | lucide-react | 矢量图标库 |

### 项目文件结构

```
secondhand_market_2nh/
├── index.html                    # 入口 HTML
├── package.json                  # 依赖声明
├── vite.config.js                # Vite 配置
├── tailwind.config.js            # TailwindCSS 配置
├── postcss.config.js             # PostCSS 配置
└── src/
    ├── main.jsx                  # ★ 应用入口 + 路由配置
    ├── index.css                 # 全局样式
    ├── assets/
    │   └── logo.png              # 品牌 Logo
    ├── lib/
    │   └── supabaseClient.js     # ★ Supabase 连接配置
    ├── context/
    │   └── MarketplaceContext.jsx # ★ 全局状态管理（核心文件）
    ├── components/
    │   ├── Layout.jsx            # 页面布局（顶栏 + 底栏）
    │   ├── BottomNav.jsx         # 底部导航栏
    │   └── Logo.jsx              # Logo 组件
    └── pages/
        ├── Welcome.jsx           # 首次访问欢迎页
        ├── Home.jsx              # ★ 首页（商品列表 + 搜索 + 筛选）
        ├── ProductDetail.jsx     # ★ 商品详情页
        ├── Upload.jsx            # ★ 发布商品页（含地图选点）
        ├── Profile.jsx           # ★ 个人中心（认证、编辑资料）
        ├── Inbox.jsx             # 消息收件箱
        └── ChatRoom.jsx          # 聊天室
```

> 标记 ★ 的是核心文件，逻辑最复杂、代码量最大。

### 数据流架构

```
用户操作 → React 组件 → MarketplaceContext（调用 Supabase API）→ 数据库
                ↑                                                      ↓
              UI 更新 ← ─────── 状态更新（useState）← ───── 返回数据
```

### Supabase 依赖的数据库表（根据代码推断）

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `profiles` | 用户资料 | id, full_name, email, school, avatar_url, verification_status |
| `products` | 商品信息 | id, title, price, currency, description, images, category, tags, location_name, lat, lng, owner_id, contact_info, created_at |
| `favorites` | 收藏关系 | user_id, product_id |
| `conversations` | 会话 | id, product_id, buyer_id, seller_id, product_title, product_image, seller_name, buyer_name, last_message, updated_at |
| `messages` | 聊天消息 | id, conversation_id, sender_id, content, created_at |

> **Storage Buckets**：`product-images`（商品图片）、`avatars`（用户头像）

---

## 三、已完成的功能（现状）

| 功能模块 | 完成度 | 说明 |
|----------|--------|------|
| 首次访问欢迎页 | ✅ 90% | 功能完整，但文案全英文，缺少中文 |
| 商品列表 / 首页 | ✅ 85% | 搜索、分类筛选、位置筛选、距离筛选、收藏 均已实现 |
| 发布商品 | ✅ 80% | 多图上传、分类、标签、地图选点、多种联系方式 |
| 商品详情 | ✅ 85% | 多图切换、联系按钮、收藏、桌面和移动端双布局 |
| 个人中心 | ✅ 75% | 学生认证（邮箱 / 证件上传）、编辑资料、我的发布 / 收藏 |
| 消息系统 | ✅ 60% | 会话列表、聊天室、实时消息订阅 |
| 中英双语 | ✅ 70% | 核心 UI 支持，但有大量硬编码英文文案未纳入翻译体系 |
| 用户认证系统 | ⚠️ 50% | Supabase Auth 已接入，但登录/注册 UI 完全缺失 |
| 头像上传 | ⚠️ 30% | `uploadAvatar` 函数已写好，但 Profile 页面仍在用 base64，未对接 |

---

## 四、Bug 清单

### 🔴 严重 Bug（影响核心功能）

#### Bug 1：没有登录 / 注册页面

**问题**：代码中集成了 Supabase Auth（`getSession`、`onAuthStateChange`），但整个项目**没有任何登录/注册的 UI**。用户永远处于"未登录"状态，无法发布商品、收藏、聊天等。

**影响**：几乎所有需要登录的功能全部不可用。

**位置**：全局问题——缺少 `Login.jsx` / `Register.jsx` 页面。

---

#### Bug 2：Supabase API Key 直接硬编码在代码中

**问题**：`src/lib/supabaseClient.js` 第 4-5 行，Supabase URL 和 anon key 直接写在代码里，没有使用环境变量。虽然 anon key 本身是公开的，但这不是最佳实践，且项目也没有 `.gitignore` 文件（或至少没有检测到），key 会被提交到 Git。

**位置**：`src/lib/supabaseClient.js`

---

#### Bug 3：距离筛选无法工作

**问题**：`Home.jsx` 第 185-188 行，距离选项的 value 是 `"1km"`、`"3km"` 等带单位的字符串，但第 78 行 `parseInt(distance)` 只会解析出数字部分。虽然 `parseInt("1km")` 在 JS 中确实返回 `1`，所以这个 bug 实际上不会报错——但这是一个脆弱的写法。更严重的问题是：距离筛选依赖 `userLocation` 和商品的 `lat/lng`，而**大多数商品可能没有经纬度数据**（数据库里可能为空），导致距离筛选形同虚设。

**位置**：`src/pages/Home.jsx` 第 76-80, 184-188 行

---

#### Bug 4：头像上传功能断裂

**问题**：`Profile.jsx` 中，点击头像后通过 `FileReader` 读取为 base64，然后调用 `setUserAvatar(base64)`。但 `MarketplaceContext.jsx` 中的 `setUserAvatar` 只是一个 `console.warn`，没有任何实际逻辑。而真正可用的 `uploadAvatar` 函数需要接收 `File` 对象而非 base64。

**位置**：`src/pages/Profile.jsx` 第 133-142 行，`src/context/MarketplaceContext.jsx` 第 457-463 行

---

#### Bug 5：学生认证是假的

**问题**：`Profile.jsx` 中的邮箱认证，验证码写死为 `123456`，且没有真正发送邮件的逻辑（点击"Send"按钮只是 `alert` 一个提示）。证件上传也没有实际存储或审核逻辑。

**位置**：`src/pages/Profile.jsx` 第 35-69 行

---

### 🟡 中等 Bug

#### Bug 6：`ProductDetail.jsx` 中 `id` 类型不匹配

**问题**：`useParams()` 返回的 `id` 是字符串，而 Supabase 中 `products.id` 可能是 UUID（也是字符串），这是 OK 的。但如果数据库用了自增整数 ID，`===` 比较会失败。需要确认数据库 schema。

**位置**：`src/pages/ProductDetail.jsx` 第 12 行

---

#### Bug 7：`useMemo` 依赖缺失

**问题**：`MarketplaceContext.jsx` 第 645 行的 `useMemo` 依赖数组中：
- `normalize` 是一个普通函数，每次渲染都会重新创建，导致 `useMemo` 失效
- 多个异步函数（如 `addListing`、`sendMessage` 等）被包含在 value 中但不在依赖数组里
- 这会导致组件可能使用过时的函数引用，产生闭包陷阱

**位置**：`src/context/MarketplaceContext.jsx` 第 618-645 行

---

#### Bug 8：退出登录方式不正确

**问题**：`Profile.jsx` 第 273-276 行，退出登录的逻辑是 `localStorage.clear()` + `window.location.reload()`，没有调用 `logoutUser()`（即 `supabase.auth.signOut()`）。这会导致 Supabase 的 session 没有被正确清除。

**位置**：`src/pages/Profile.jsx` 第 271-278 行

---

#### Bug 9：`owner` 字段判断逻辑有问题

**问题**：`MarketplaceContext.jsx` 第 212 行，`owner` 字段通过 `session?.user?.id === p.owner_id` 来判断。但 `fetchProducts` 在组件初始化时调用，此时 `session` 可能还没获取到，导致所有商品的 `owner` 都是 `'others'`。即使后续登录成功，已经 fetch 的数据不会重新判断。

**位置**：`src/context/MarketplaceContext.jsx` 第 212 行

---

### 🟢 轻微问题

#### Bug 10：Leaflet 地图标记图标可能不显示

**问题**：Leaflet 默认的 Marker 图标在 Webpack/Vite 打包环境下通常不显示（需要手动配置图标路径），项目中没有相关修复代码。

---

#### Bug 11：欢迎页导航死循环风险

**问题**：`main.jsx` 第 20-27 行，`useEffect` 依赖 `navigate` 和 `location.pathname`，在特定条件下可能触发多次重定向。

---

#### Bug 12：底部导航缺少 Inbox 入口

**问题**：`BottomNav.jsx` 只有 3 个按钮（首页、发布、我的），没有消息入口。用户只能通过 Profile 页面进入 Inbox，但直觉上应该有个消息入口在底栏。

---

#### Bug 13：安全隐患——Supabase Key 暴露

**问题**：`supabaseClient.js` 中的完整 URL 和 anon key 直接写入源码并推送到 Git 仓库。即使 anon key 是公开的，也建议使用环境变量管理和 `.env` 文件。

---

## 五、下一阶段开发计划

### 阶段 1：修复阻塞性 Bug（让项目能跑起来）

> 预计工时：2-3 天

| # | 任务 | 优先级 | 说明 |
|---|------|--------|------|
| 1.1 | **创建登录/注册页面** | 🔥 最高 | 使用 Supabase Auth 实现邮箱登录/注册，不做太复杂，先能用 |
| 1.2 | **修复头像上传** | 🔴 高 | 将 Profile 页面改为使用 `uploadAvatar(file)` 而非 base64 |
| 1.3 | **修复退出登录** | 🔴 高 | 调用 `logoutUser()` 替代 `localStorage.clear()` |
| 1.4 | **环境变量配置** | 🔴 高 | 将 Supabase key 移到 `.env` 文件，创建 `.env.example` |
| 1.5 | **修复 Leaflet 图标** | 🟡 中 | 添加默认图标配置 |
| 1.6 | **修复 owner 判断** | 🟡 中 | 登录状态变化后重新 fetch 商品列表 |

### 阶段 2：补全核心功能（让产品可用）

> 预计工时：5-7 天

| # | 任务 | 说明 |
|---|------|------|
| 2.1 | **完善学生认证流程** | 真正实现邮箱验证码发送（可用 Supabase Edge Functions），证件上传到 Storage |
| 2.2 | **完善消息系统** | 未读消息计数、消息通知、优化实时订阅 |
| 2.3 | **完善多语言** | 将所有硬编码的英文文案纳入翻译体系 |
| 2.4 | **添加路由守卫** | 未登录用户访问需要登录的页面时，自动跳转到登录页 |
| 2.5 | **商品编辑功能** | 发布后可修改商品信息 |
| 2.6 | **搜索功能增强** | 搜索历史、热门搜索、搜索结果高亮 |

### 阶段 3：体验优化（让产品好用）

> 预计工时：5-7 天

| # | 任务 | 说明 |
|---|------|------|
| 3.1 | **Loading 状态** | 全局加载动画、骨架屏、按钮加载状态 |
| 3.2 | **错误处理** | 统一错误提示组件、网络错误重试 |
| 3.3 | **图片优化** | 上传前压缩、懒加载、缩略图 |
| 3.4 | **响应式设计优化** | 桌面端双栏/三栏布局优化 |
| 3.5 | **SEO / PWA** | 添加 manifest.json、Service Worker、meta 标签 |
| 3.6 | **举报 / 拉黑功能** | 用户安全相关功能 |

### 阶段 4：上线准备

> 预计工时：3-5 天

| # | 任务 | 说明 |
|---|------|------|
| 4.1 | **Supabase RLS 策略** | 配置行级安全策略（Row Level Security） |
| 4.2 | **部署方案** | Vercel / Netlify 部署 + 自定义域名 |
| 4.3 | **数据库 Migration 脚本** | 整理并记录所有需要的数据库表结构 |
| 4.4 | **监控和日志** | 错误监控（Sentry）、用户行为分析（如 Plausible） |
| 4.5 | **隐私政策和服务条款** | 法律条款页面 |

---

## 六、给接手 AI 的说明

### 项目背景

这是一个由**编程初学者**借助 AI 工具开发的项目。代码风格基本一致，但有一些典型的 AI 生成代码的特点：
- 逻辑大量集中在 `MarketplaceContext.jsx`（650 行），需要拆分
- 部分功能只写了"架子"没有实际逻辑（如头像上传、认证）
- 没有测试代码
- 没有 `.env` / `.gitignore` 配置

### 开发约定

1. **前端不需要引入新框架**，继续使用 React + Vite + TailwindCSS
2. **后端完全依赖 Supabase**，不需要自建服务器
3. **双语支持**是硬需求，所有新增 UI 文案都要加入 `translations` 对象
4. **以移动端为主要设计目标**（手机 Web App），桌面端为辅
5. **代码修改前，务必先与用户沟通确认**，不要擅自做架构级改动

### 当前数据库状态

Supabase 项目已创建（URL: `zjmtaenvebilatabxwqa.supabase.co`），但不确定数据库中的表是否已按上文推断的结构创建。接手时应先确认。

---

## 七、需要跟你（项目所有者）确认的问题

在我开始动手修改代码之前，需要你回答以下问题：

1. **Supabase 数据库表已经创建好了吗？** 如果创建了，请提供表结构截图或 SQL 导出。如果没有，我可以帮你生成建表 SQL。
需要重新生成表。

2. **你希望先从哪个阶段开始？** 建议从"阶段 1：修复阻塞性 Bug"开始，让项目先能正常运行。
从阶段1开始

3. **学生认证的真实流程你想怎么做？** 目前有两个选项：
   - 方案 A：使用 `.edu.my` 邮箱验证（Supabase 自带邮件功能）
   - 方案 B：上传学生证照片，由管理员手动审核
   - 方案 C：先保持假认证（输入测试验证码就通过），等以后再做
   方案A和方案B结合。

4. **你有没有自己部署过这个项目？** 比如用 Vercel 或 Netlify？还是目前只在本地 `npm run dev` 跑过？
只是在本地。

5. **项目名 "2NH" 有什么含义吗？** 这会影响品牌设计和文案。
就是2nd hand 的意思。
6. **目前只面向马来亚大学 (UM) 吗？** 还是计划扩展到更多马来西亚大学？
暂时是面向马来亚大学，后期计划拓展到马来西亚其他大学。