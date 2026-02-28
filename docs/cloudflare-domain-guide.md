# Cloudflare 自定义域名绑定指南与风险评估

本文档详细说明了将 2NH Marketplace 绑定到您自己的 Cloudflare 域名时的具体操作步骤，并分级列出了所有潜在的风险与不稳定因素。

---

## 第一部分：潜在风险与不稳定性评估（分级列表）

经过对代码库的全面检查，以下是更换域名时可能遇到的潜在问题及其严重程度分级：

### 🔴 评级：高风险（直接导致核心功能瘫痪）

1. **Supabase 认证回调失效（Auth Redirects）**
   - **风险点**：Supabase 的登录、注册、密码找回以及第三方授权（如 Google 登录）依赖于配置的“Site URL”和“Redirect URLs”。如果未更新为新域名，用户在登录后会被重定向到旧地址或 `localhost`，甚至直接报错 `CORS error` 或 `invalid redirect uri`。
   - **代码印证**：`src/pages/Auth.jsx` 中使用了 `window.location.origin` 动态获取当前域名进行跳转，这意味着**代码层面已经准备好**，但**服务器层面（Supabase 控制台）必须放行新域名**。

### 🟡 评级：中风险（导致部分功能异常或体验下降）

1. **第三方 OAuth 提供商（如适用）的域名白名单**
   - **风险点**：如果您在 Supabase 中开启了 Google、Facebook 等第三方登录，这些平台（如 Google Cloud Console）有严格的“已授权的 JavaScript 来源”和“已授权的重定向 URI”限制。必须在那里也要加上您的新域名，否则第三方登录会提示“Error 400: redirect_uri_mismatch”。

2. **Cloudflare 缓存策略导致的白屏或旧页面**
   - **风险点**：单页应用（React SPA）的路由由前端接管。如果 Cloudflare 缓存了错误的 `index.html` 或者缓存时间过长，用户更换域名后可能看到旧版本，或者在刷新非首页（如 `/profile`）时报 404 错误。
   - **解决**：如果你部署在 Cloudflare Pages，它会自动处理 SPA 路由。如果是其他服务器，需在 Cloudflare 确保未强缓存 HTML 文件。

3. **Cloudflare SSL/TLS 加密模式设置错误**
   - **风险点**：如果您的源服务器（如 Vercel/Netlify）自身也开启了 HTTPS，而 Cloudflare 的 SSL/TLS 模式设为了 `Flexible`（灵活），极易导致“重定向次数过多（ERR_TOO_MANY_REDIRECTS）”。必须设置为 `Full (strict)`（完全严格）。

### 🟢 评级：低风险（几乎无影响或易解决）

1. **接口跨域问题（CORS）**
   - **风险点**：您的项目仅后端使用了 Supabase，Supabase 会自动允许来自其控制台中配置的 `Site URL` 的跨域请求。只要高风险项中的 URL 配置正确，CORS 问题自然解决。
2. **硬编码的域名检查**
   - **排查结果**：安全。项目中没有使用写死的 `http://localhost` 或旧域名片段（仅在 SVG 图标代码和空图片占位符中使用了标准 XML 命名空间链接，无影响）。
3. **地图组件加载**
   - **排查结果**：安全。`react-leaflet` 的瓦片服务器（OpenStreetMap）对域名不敏感，不会因为更换域名而失效。

---

## 第二部分：详细操作步骤指南

请严格按以下顺序进行操作：

### 步骤一：在 Cloudflare 中绑定域名（针对 Cloudflare Pages 部署）
*注：代码库中包含 `.wrangler` 文件夹，推测您使用 Cloudflare Pages 或 Workers 部署。*

1. 登录 [Cloudflare 控制面板](https://dash.cloudflare.com/)。
2. 在左侧菜单找到 **"Workers & Pages"**，点击您的 2NH Marketplace 项目。
3. 进入该项目的页面后，点击顶部的 **"Custom Domains" (自定义域)** 选项卡。
4. 点击 **"Set up a custom domain"**。
5. 输入您想绑定的域名（例如：`market.yourdomain.com` 或 `yourdomain.com`），点击 **"Continue"**。
6. Cloudflare 会自动检测并提示您添加 CNAME 记录。如果是由 Cloudflare 托管 DNS 的域名，它会提示自动激活，点击确认即可。
7. 等待状态变为 **"Active"（已激活）**。大概需要几分钟。

### 步骤二：更新 Supabase 的域名配置（非常关键）

1. 登录 [Supabase 控制台](https://supabase.com/dashboard/)并进入您的项目。
2. 在左侧菜单选择 **"Authentication"**（认证），然后点击 **"URL Configuration"**（URL 配置）。
3. **Site URL**：将其修改为您新的 Cloudflare 域名。
   - 示例：`https://market.yourdomain.com`
4. **Redirect URLs**：
   - 点击 **"Add URL"**，添加新域名下的允许回调通配符。
   - 建议添加：`https://market.yourdomain.com/*`
   - （如果您还需要在本地测试，请务必保留 `http://localhost:5173/*`）
5. 点击 **"Save"** 保存设置。

### 步骤三：更新第三方登录白名单（如果没有用 Google 等登录，可跳过此步）

如果您开启了 Google 登录：
1. 登录 [Google Cloud Console](https://console.cloud.google.com/)。
2. 进入 "APIs & Services" -> "Credentials"。
3. 找到您的 OAuth 2.0 Client ID。
4. 在 **"Authorized JavaScript origins"** 中添加新域名：`https://market.yourdomain.com`
5. 在 **"Authorized redirect URIs"** 中添加 Supabase 的回调地址：`https://<你的supabase-id>.supabase.co/auth/v1/callback`

### 步骤四：检查 Cloudflare SSL/TLS 设置

为了避免“重定向次数过多”报错：
1. 在 Cloudflare 控制面板，点击您新绑定的域名。
2. 在左侧菜单点击 **"SSL/TLS"** -> **"Overview"**。
3. 确保加密模式选择的是 **"Full"** 或 **"Full (strict)"**。（如果您部署在 Cloudflare Pages 上，通常默认配置即没问题）。
4. 在左侧点击 **"Rules"** -> **"Page Rules"**。若无极特殊需要，确保不要对新域名强制设置“Cache Everything”导致页面状态错乱。

### 步骤五：功能验证（测试清单）

域名生效后，请在新域名下完成以下烟雾测试（Smoke Test）：
- [ ] 能否正常打开首页且不报 SSL 错误？
- [ ] 使用账号**退出后再重新登录**，认证流程是否顺畅？回调是否正确回到了新域名？
- [ ] 控制台（F12 -> Console）中是否有红色 CORS（跨域）报错？
- [ ] 随意刷新一个深层页面（如 `/profile` 或 `/product/123`），是否正常显示而非报 404 错误？

如果在上述完整步骤中遇到任何 400 或 CORS 报错，请随时告诉我，我来为您二次排查！
