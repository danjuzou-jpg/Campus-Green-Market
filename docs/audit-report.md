# Campus Green Market - 上线前审计报告

> 日期：2026-03-07
> 审计方：Claude Code
> 范围：全部代码、数据库 Schema、认证流程、安全性、部署就绪性

---

## 目录

1. [优先级总览](#1-优先级总览)
2. [并发与稳定性（200 用户）](#2-并发与稳定性200-用户)
3. [代码逻辑与数据库读写](#3-代码逻辑与数据库读写)
4. [登录认证系统](#4-登录认证系统)
5. [安全风险（Supabase + Cloudflare）](#5-安全风险supabase--cloudflare)
6. [其他 Bug 与上线阻断项](#6-其他-bug-与上线阻断项)
7. [优化建议（不阻断上线）](#7-优化建议不阻断上线)

---

## 1. 优先级总览

| 优先级 | 问题 | 位置 | 工作量 |
|--------|------|------|--------|
| P0 | `authLoading` 未导出到 Context value | `MarketplaceContext.jsx:1245` | 1 行代码 |
| P0 | Storage 删除策略过于宽松（任何用户可删除任意图片） | `fix_all_rls_policies.sql:238-241` | SQL 修改 |
| P0 | localStorage 认证状态回退可被伪造 | `MarketplaceContext.jsx:424-436` | 小改动 |
| P1 | 缺少 Cloudflare Pages SPA 路由所需的 `_redirects` 文件 | 项目根目录 | 1 个文件 |
| P2 | 搜索/筛选切换时立即触发 RPC，无防抖 | `Home.jsx:149-168` | 中等 |
| P2 | 图片上传无文件大小限制 | `Upload.jsx`、`MarketplaceContext.jsx` | 小改动 |
| P2 | Cloudflare 未配置速率限制 | Cloudflare 控制台 | 运维配置 |
| P2 | 无 CSP 响应头 | `index.html` | 小改动 |
| P2 | SVG 上传可携带 XSS 攻击载荷 | `Upload.jsx:118` | 小改动 |
| P2 | `search_products` RPC 使用了 SECURITY DEFINER | `search_products_rpc.sql:105` | SQL 修改 |
| P2 | 搜索关键词在回退查询中未转义 | `MarketplaceContext.jsx:533` | 小改动 |
| P3 | 无代码分割 / 懒加载 | `main.jsx:22-32` | 中等 |
| P3 | Context useMemo 有 31 个依赖项 | `MarketplaceContext.jsx:1291-1296` | 中等 |
| P3 | SEO meta 标签为静态（无按页 OG 标签） | `index.html` | 中等 |
| P3 | 无障碍访问（ARIA）支持为零 | 所有组件 | 较大 |

---

## 2. 并发与稳定性（200 用户）

### 2.1 整体评估：200 用户并发可以承受

当前架构（React SPA + Supabase + Cloudflare Pages）可以支撑 200 并发用户。Supabase 在服务端处理数据库连接池和查询执行，Cloudflare Pages 通过 CDN 提供静态资源。没有自建的服务端应用代码成为瓶颈。

### 2.2 无需队列系统

对于一个 200 并发用户的交易平台，请求队列是不必要的。Supabase 的 PostgreSQL 连接池原生就能处理这个量级。队列系统（如 BullMQ、RabbitMQ）主要用于后台任务（邮件发送、图片处理），而本应用已将这些工作分别交给 Supabase 触发器和客户端压缩处理。

### 2.3 问题：搜索/筛选切换立即触发 RPC 调用

**位置**：`src/pages/Home.jsx:149-168`

```jsx
useEffect(() => {
    const doFetch = async () => {
      const more = await fetchProducts(session?.user?.id, {
        searchTerm: appliedTerm,
        categoryFilter: activeCat,   // 这里的变化会立即触发
        locationFilter: activeLoc,   // 这里的变化会立即触发
        ...
      })
    }
    doFetch()
}, [appliedTerm, activeCat, activeLoc, distance, ...])
```

**为什么有问题**：`activeCat`、`activeLoc` 和 `distance` 都在依赖数组中。每次状态变化都会**立即触发** effect。如果用户在 2 秒内快速点击 5 个分类按钮，就会向 Supabase 发送 5 个并发 RPC 请求。只有最后一个结果有用，前 4 个全部浪费。

更糟糕的是，如果第 3 个请求的响应晚于第 5 个返回（网络抖动），UI 会显示分类 3 的过期数据，而用户实际选择的是分类 5（竞态条件）。

**修复**：在调用 `fetchProducts` 前加入 300ms 防抖，或使用 `AbortController` 取消过期请求。

### 2.4 问题：Realtime 连接数限制

每个 ChatRoom 实例都会创建一个 Supabase Realtime channel（`src/pages/ChatRoom.jsx:80-95`）。Supabase 免费版允许约 200 个并发 realtime 连接。如果 200 个用户同时在聊天页面，就会触及上限。

**修复**：监控使用情况；如有需要则升级 Supabase 计划。当前组件卸载时的清理（`supabase.removeChannel`）实现是正确的。

### 2.5 问题：fetchConversations 加载了过多数据

**位置**：`src/context/MarketplaceContext.jsx:583-640`

通过一次 join 查询获取所有会话及每个会话的最近 50 条消息。如果用户有 20 个会话，每次 fetch 就会加载 1000 条消息记录。

**修复**：在消息列表页面只获取每个会话的最后一条消息摘要。完整消息列表在进入具体 ChatRoom 时再加载。

---

## 3. 代码逻辑与数据库读写

### 3.1 严重：`authLoading` 未导出到 Context

**位置**：在 `MarketplaceContext.jsx:63` 定义，但在 1245-1296 行的 `value` 对象中**未包含**。

**影响**：`main.jsx:37` 中的 `RequireAuth` 从 context 解构 `authLoading`，得到的是 `undefined`（falsy）。加载动画永远不会显示。页面刷新时，用户会短暂看到跳转至 `/auth` 的闪烁，然后 session 加载完成后又跳回预期页面。

**修复**：将 `authLoading` 加入 context 的 `value` 对象及其 `useMemo` 依赖数组。

### 3.2 严重：search_products RPC 使用了 SECURITY DEFINER

**位置**：`docs/search_products_rpc.sql:105`

```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

`SECURITY DEFINER` 意味着该函数以**数据库所有者（超级用户）的身份**运行，绕过所有 RLS 策略。

**当前影响**：无。因为 products 表的 SELECT 策略是 `USING (true)`（任何人可读），RPC 返回的数据与直接查询一致。

**未来风险**：如果以后给 products 的 RLS 加了状态过滤（例如 `USING (status = 'active')` 以隐藏被举报/下架的商品），该 RPC 会**仍然返回被隐藏的商品**，因为它完全绕过了 RLS。用户可以通过搜索看到已下架、已举报或已删除的商品。

**修复**：改为 `SECURITY INVOKER`，使函数尊重调用者的 RLS 策略。

### 3.3 高优先级：搜索关键词在回退查询中未转义

**位置**：`src/context/MarketplaceContext.jsx:533`

```javascript
q = q.or(`title.ilike.%${kw}%,description.ilike.%${kw}%,location_name.ilike.%${kw}%`)
```

用户输入 `kw` 被直接拼接到 PostgREST 过滤字符串中。虽然 Supabase 的 PostgREST 层对完整 SQL 注入有一定防护，但用户仍然可以注入 SQL 通配符（如 `%` 和 `_`）来操纵搜索行为，或者通过逗号、句号等特殊字符破坏过滤语法。

**修复**：在拼接前对 `kw` 中的 `%`、`_`、`,`、`.` 进行转义。

### 3.4 中等：乐观更新在失败时不回滚

`toggleFavorite`（759-777 行）和 `sendMessage`（1058-1108 行）在数据库调用之前就更新了本地状态。如果调用失败，UI 显示成功但数据实际未保存。没有回滚逻辑。

**修复**：保存之前的状态，捕获错误后恢复。

### 3.5 中等：图片上传无文件大小限制

**位置**：`src/lib/imageUtils.js:16` — 仅对小于 500KB 的文件跳过压缩，无上限检查。

`src/pages/Upload.jsx:118` — `accept="image/*"` 只是浏览器提示，非强制。

用户可以上传 50MB 的图片。压缩函数会尝试处理（速度慢，在移动端可能崩溃），即使压缩后结果仍可能很大。

**修复**：增加硬性检查：压缩前拒绝大于 5MB 的文件。同时在服务端（至少在客户端）验证 MIME 类型，不能仅依赖 `accept` 属性。

### 3.6 中等：SVG 上传存在 XSS 风险

`accept="image/*"` 包含 SVG 文件。SVG 可以内嵌 `<script>` 标签。由于 product-images bucket 是公开的，恶意 SVG 通过其 Supabase Storage URL 直接访问时会在用户浏览器中执行 JavaScript。

**修复**：将 `accept` 限制为 `accept="image/jpeg,image/png,image/webp"`；或在上传时清理 SVG 内容；或在 storage bucket 上设置 `Content-Disposition: attachment`。

### 3.7 低优先级：价格字段无服务端约束

`price NUMERIC(10,2) NOT NULL` 接受负数。用户可以发布价格为 `-100` 的商品。

**修复**：给 products 表添加 `CHECK (price >= 0)`。

### 3.8 低优先级：图片串行上传

**位置**：`MarketplaceContext.jsx:651-669` — 用 `for...of` 循环逐张上传图片。

上传 9 张图片意味着 9 个串行网络请求。在慢速连接上可能耗时 30 秒以上。

**修复**：使用 `Promise.all()` 并行上传。

---

## 4. 登录认证系统

### 4.1 严重：localStorage 认证状态回退可被伪造

**位置**：`src/context/MarketplaceContext.jsx:424-436`

```javascript
const fallback = localStorage.getItem(`verification_fallback_${userId}`)
if (fallback) {
    const { status } = JSON.parse(fallback)
    setUser(prev => ({
        ...prev,
        verificationStatus: status,
        verified: status === 'verified'
    }))
}
```

**问题**：当 Supabase profile 请求失败（网络错误）时，应用从 localStorage 读取认证状态。用户可以打开 DevTools > Application > Local Storage，手动设置：

```
verification_fallback_<userId> = {"status":"verified","timestamp":1234567890}
```

UI 会将其视为已认证，解锁聊天和联系方式按钮。

**为什么重要**：虽然用户无法向不存在的会话发送消息（RLS 会阻止），但他们**可以看到**本应隐藏在认证墙后面的联系方式（WhatsApp/微信号码）。

**推荐修复（方案 A — 最简单）**：完全移除 localStorage 回退。如果 profile 请求失败，保持用户为 `unverified` 状态并显示网络错误提示。正确的状态会在下次成功请求时加载。

**备选修复（方案 B）**：保留 localStorage 仅用于展示层缓存，但在显示联系方式或启用聊天前始终向数据库重新验证。添加实时检查：

```javascript
const isVerified = async () => {
  const { data } = await supabase.from('profiles')
    .select('verification_status')
    .eq('id', session.user.id)
    .single()
  return data?.verification_status === 'verified'
}
```

### 4.2 高优先级：.env 中的 Supabase 密钥已被提交到 Git 历史

**位置**：commit `6c557cf`（"Rename .env.example to .env"）

包含真实 `VITE_SUPABASE_ANON_KEY` 的 `.env` 文件曾被提交到 git。虽然 `.gitignore` 现在已排除 `.env`，但密钥永久保留在 git 历史中。

**影响**：anon key 被设计为可公开的（它本来就嵌入在前端打包产物中），所以严格意义上这不是凭证泄露。但是：
- 如果 `service_role` key 曾经在此文件中，必须立即轮换
- Supabase 项目 ID 现在可被永久发现

**修复**：
1. 确认 `service_role` key 从未被提交：`git log -p --all -S 'service_role'`
2. 如果发现，立即在 Supabase Dashboard 中轮换所有密钥
3. 可选：用 `git filter-repo --path .env --invert-paths` 清理 git 历史

### 4.3 中等：注册无邮箱域名限制

**位置**：`src/pages/Auth.jsx:106-114`

任何邮箱都可以注册。`.edu.my` 域名检查仅应用于学生认证流程（Profile 页面），而非注册本身。

对于校园市场，建议限制注册仅允许校园邮箱，或至少在注册时显示提醒。

### 4.4 中等：密码策略过弱

仅通过 `minLength={6}` 强制执行（HTML 属性，仅客户端校验）。Supabase 默认最低也是 6 位。

**修复**：将最低长度增加到 8 位，增加基本复杂度检查（至少包含一个字母 + 一个数字）。

### 4.5 低优先级：登录无速率限制

Supabase 对认证端点有内置的速率限制，但限额较宽松。针对已知邮箱的暴力破解攻击可以在被限制前尝试大量密码。

**修复**：在 Cloudflare 上针对 Supabase 认证端点添加速率限制规则。

---

## 5. 安全风险（Supabase + Cloudflare）

### 5.1 严重：Storage 删除策略过于宽松

**位置**：`docs/fix_all_rls_policies.sql:238-241`

```sql
CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );
```

**问题**：任何已登录用户都可以删除 `product-images` bucket 中的**任意图片**。恶意用户可以删除平台上所有商品图片。

同样的问题也存在于 update 策略（229-232 行）。

**修复**：将删除/更新权限限制为文件所有者。使用文件路径前缀模式：

```sql
CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

这需要修改上传路径，加入用户 ID 作为文件夹前缀（例如 `{userId}/{timestamp}_{random}.jpg`）。

### 5.2 高优先级：无内容安全策略（CSP）

**位置**：`index.html`

没有 CSP meta 标签或 HTTP 头。虽然代码中没有使用 `dangerouslySetInnerHTML`（很好），但 CSP 提供了对未来 XSS 攻击向量的纵深防御。

**修复**：在 `index.html` 中添加：

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://*.supabase.co https://images.unsplash.com data: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  font-src 'self';
  frame-ancestors 'none';
">
```

### 5.3 高优先级：Cloudflare 未配置速率限制

Supabase 有基本的速率限制，但执着的攻击者仍然可以：
- 批量创建商品（填满存储空间）
- 大量调用搜索 RPC（消耗数据库 CPU）
- 批量注册账号

**修复**：配置 Cloudflare 速率限制规则：
- `/auth` 端点：每 IP 每分钟 10 次请求
- `/rest/v1/products` POST：每 IP 每分钟 5 次请求
- `/storage/v1/object` POST：每 IP 每分钟 20 次请求

### 5.4 中等：Supabase 未限制 CORS 来源

Supabase 默认的 CORS 配置允许任何来源使用 anon key。任何人都可以构建一个独立的前端来调用你的 Supabase 后端。

**修复**：在 Supabase Dashboard > API Settings 中，将 allowed origins 限制为你的生产域名。

### 5.5 中等：删除会话时客户端无所有者校验

**位置**：`MarketplaceContext.jsx:1041-1056`

```javascript
const deleteConversation = useCallback(async (conversationId) => {
    await supabase.from('messages').delete().eq('conversation_id', conversationId)
    const { error } = await supabase.from('conversations').delete().eq('id', conversationId)
```

查询中没有 `buyer_id` 或 `seller_id` 校验。数据库层面有 RLS 保护，但在客户端增加校验可提供纵深防御和更好的错误提示。

### 5.6 低优先级：SQL 注释中暴露了 Supabase 项目 ID

**位置**：`docs/supabase-schema.sql:6`

```sql
--   2. select your project (zjmtaenvebilatabxwqa)
```

这不构成漏洞（项目 ID 本来就在前端打包产物中），但在文档中不必要地暴露。

---

## 6. 其他 Bug 与上线阻断项

### 6.1 阻断项：缺少 Cloudflare Pages 的 `_redirects` 文件

Cloudflare Pages 提供静态文件服务。如果没有 `_redirects` 文件，直接访问 `/product/abc123` 或 `/chat/xyz` 会返回 404，因为这些路径不对应实际文件。

**修复**：创建 `public/_redirects`：

```
/* /index.html 200
```

### 6.2 阻断项：Vite 生产构建中移除 console 可能失效

**位置**：`vite.config.js:8`

```javascript
drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
```

Vite 使用 `import.meta.env.MODE` 而非 `process.env.NODE_ENV`。在 Vite 构建上下文中，`process.env.NODE_ENV` 可能为 `undefined`，导致 console 日志残留在生产环境中。

**修复**：改为：

```javascript
drop: ['console', 'debugger']  // 始终在构建时移除（开发服务器会忽略 esbuild.drop）
```

注意：Vite 在执行 `vite build` 时确实会设置 `process.env.NODE_ENV = 'production'`，所以当前配置很可能是正常工作的。但建议通过一次测试构建来验证。

### 6.3 Bug：数据库插入失败时图片成为孤儿文件

**位置**：`MarketplaceContext.jsx:648-713`

图片先上传到 storage（651-669 行），然后再向数据库插入商品记录（690-694 行）。如果数据库插入失败，已上传的图片会永久残留在 storage 中，无任何引用——成为孤儿文件。

**修复**：在 catch 块中删除已上传的图片；或者反转顺序（先插入数据库记录用占位符，再上传图片，然后更新记录）。

### 6.4 Bug：聊天消息可能出现重复显示

**位置**：`ChatRoom.jsx:80-95` + `MarketplaceContext.jsx:1087-1103`

发送消息时：
1. 乐观更新立即将消息添加到本地状态
2. Realtime 订阅在消息写入数据库后触发
3. 调用 `fetchConversations` 重新获取所有消息

如果 realtime 事件在 `fetchConversations` 响应之前到达，消息会短暂地出现两次。

**修复**：合并消息时按 `id` 去重，或者对当前用户发送的消息跳过 `fetchConversations`。

### 6.5 Bug：聊天室对所有用户都显示"在线"

**位置**：`ChatRoom.jsx:179`

```jsx
<div className="text-[10px] text-green-500 font-medium">* {t.online}</div>
```

对所有人硬编码显示"在线"状态，这会误导用户。

**修复**：要么通过 Supabase Realtime Presence 实现真实的在线状态检测，要么直接移除在线指示器。

---

## 7. 优化建议（不阻断上线）

以下内容不阻断上线，但可以提升性能和可维护性。

### 7.1 代码分割 / 懒加载

所有 11 个页面在 `main.jsx` 中被一次性导入。建议使用 `React.lazy()` 实现懒加载：

```jsx
const ChatRoom = React.lazy(() => import('./pages/ChatRoom.jsx'))
const EditProduct = React.lazy(() => import('./pages/EditProduct.jsx'))
// 其他页面同理
```

### 7.2 Context 重渲染优化

Context value 的 `useMemo` 有 31 个依赖项（1291-1296 行），使其实质上失效。建议将 context 拆分为更小的 provider（例如 `AuthProvider`、`ListingsProvider`、`ChatProvider`）。

### 7.3 按页面动态 SEO Meta 标签

当前所有页面共享 `index.html` 中的同一组 OG 标签。建议在路由切换时更新 `document.title`，或使用 `react-helmet-async` 实现动态 meta 标签（对商品链接的社交分享尤为重要）。

### 7.4 无障碍访问（WCAG）

代码库中未发现任何 ARIA 标签。如果有无障碍合规要求：
- 为纯图标按钮添加 `aria-label`
- 使用语义化 HTML（`<nav>`、`<main>`、`<article>`）
- 为所有商品图片添加 `alt` 文本
- 确保表单 label 的正确关联

### 7.5 聊天消息分页

ChatRoom 最多加载 50 条消息（在 `fetchConversations` 中硬编码）。用户无法滚动查看更早的消息。建议在 ChatRoom 中添加"加载更多"分页或无限滚动。

---

## 附录：审查文件清单

| 文件 | 行数 | 用途 |
|------|------|------|
| `src/context/MarketplaceContext.jsx` | 1301 | 全局状态，所有数据库操作 |
| `src/main.jsx` | 110 | 路由、路由守卫 |
| `src/pages/Auth.jsx` | 325 | 登录/注册/重置密码 |
| `src/pages/Home.jsx` | 435 | 商品列表、搜索、筛选 |
| `src/pages/Upload.jsx` | 236 | 商品发布 |
| `src/pages/EditProduct.jsx` | ~200 | 商品编辑 |
| `src/pages/ProductDetail.jsx` | 314 | 商品详情页 |
| `src/pages/ChatRoom.jsx` | 284 | 聊天消息 |
| `src/pages/Inbox.jsx` | ~100 | 会话列表 |
| `src/pages/Profile.jsx` | ~450 | 用户资料、身份认证 |
| `src/pages/UserProfile.jsx` | ~100 | 其他用户资料页 |
| `src/lib/supabaseClient.js` | 20 | Supabase 客户端初始化 |
| `src/lib/imageUtils.js` | 73 | 图片压缩 |
| `src/components/ErrorBoundary.jsx` | ~50 | React 错误边界 |
| `docs/supabase-schema.sql` | 190 | 数据库 Schema |
| `docs/fix_all_rls_policies.sql` | 319 | RLS 策略 |
| `docs/search_products_rpc.sql` | 105 | 搜索 RPC 函数 |
| `docs/auto_delete_images.sql` | 46 | 图片清理触发器 |
| `vite.config.js` | 11 | 构建配置 |
| `.env` | 6 | 环境变量 |
| `.gitignore` | 22 | Git 忽略规则 |
| `index.html` | 44 | 入口 HTML、PWA meta |
| `public/sw.js` | 57 | Service Worker |
| `public/manifest.json` | ~20 | PWA 清单 |
