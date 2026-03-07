# 🚀 2NH Marketplace - 完整上线与域名绑定保姆级教程

这份教程将手把手教你如何将写好的代码真正上线到互联网，并绑定你自己的 Cloudflare 域名。整个过程分为三个大步骤，大约需要 15-20 分钟。

---

## 准备工作
在开始之前，请确保你已经准备好了以下两样东西：
1. **一个已注册的域名**（并且该域名已经托管在 Cloudflare 上）。
2. **一个 GitHub 账号**（用于存放你的代码，方便 Cloudflare 自动帮你部署）。

---

## 第一步：将代码推送到 GitHub（让 Cloudflare 能拉取你的代码）

既然要上线，我们需要把代码放在一个“云端仓库”里，最常用的就是 GitHub。

1. **在 GitHub 上创建一个新仓库（Repository）**
   - 登录 [GitHub](https://github.com/)。
   - 点击右上角的 **"+"** 号，选择 **"New repository"**。
   - **Repository name** 随便填，比如填 `2nh-marketplace-web`。
   - 勾选 **Private**（私有仓库，这样别人就看不到你的代码和配置了）。
   - 直接点击绿色的 **"Create repository"** 按钮，**不要**勾选添加 README 或 .gitignore。

2. **在本地电脑上执行推送命令**
   - 回到你的代码编辑器（VS Code）的终端（Terminal）。
   - 确保你当前在项目目录 `secondhand_market_2nh` 下。我不是在antigravity里面进行嘛？
   - 依次复制粘贴并执行以下命令（注意将最后一条命令中的代码替换为你刚刚在 GitHub 创建成功后页面上显示的完整 URL）：

   ```bash
   git init
   git add .
   git commit -m "first commit for production"
   git branch -M main
   # ⚠️ 注意：把下面这行的 URL 换成你自己的！已经换好了
   git remote add origin https://github.com/danjuzou-jpg/2nh-marketplace-web--version1.git
   git push -u origin main
   ```
   *（如果提示需要登录，请按照终端弹出的提示登录你的 GitHub 账号）*

---

## 第二步：在 Cloudflare Pages 上一键部署代码

现在代码已经在 GitHub 上了，我们让 Cloudflare 把它变成一个真正的网站。

1. 登录 [Cloudflare 控制面板](https://dash.cloudflare.com/)。
2. 左侧菜单点击 **"Workers & Pages"**。
3. 点击蓝色的 **"Create application"** 按钮。
4. 切换到 **"Pages"** 标签页，点击 **"Connect to Git"**。
5. 选择你刚刚推送代码的 GitHub 账号（如果是第一次，会弹出授权窗口，点击允许即可），然后选中 `2nh-marketplace-web` 这个仓库。点击 **"Begin setup"**。
6. **【非常关键】填写构建设置（Build settings）**：
   - **Project name**: （保持默认或自定义，比如 `2nh-marketplace`）
   - **Production branch**: `main`
   - **Framework preset**: 下拉选择 **`Vite`**（Cloudflare 会自动帮你填好接下来的两项）
   - *（检查一下有没有自动填装：Build command 应该是 `npm run build`，Build output directory 应该是 `dist`）*
7. **【极其重要】填写环境变量（Environment variables）**：
   - 你的项目依赖 Supabase，如果你把密钥写在了代码里，这是可以的。但标准的做法是在这里配置。如果你之前创建了 `.env` 文件，请把里面的内容照搬过来（如果没有，直接跳过此步，因为你代码里已经写死了）。
8. 点击下方的 **"Save and Deploy"**。
9. 等待约 1-2 分钟，Cloudflare 会自动安装依赖并构建。构建成功后，它会给你一个免费的形如 `https://2nh-marketplace.pages.dev` 的测试网址。点击打开看看，如果能显示你的网站，说明部署成功！

---

## 第三步：绑定你自己的专属域名

现在你的网站已经上线了，最后一步就是把那个长的 `.pages.dev` 网址换成你自己的漂亮域名。

1. 依然在 Cloudflare 的 **"Workers & Pages"** 页面，点击你刚刚部署成功的项目。
2. 切换到 **"Custom domains" (自定义域)** 标签页。
3. 点击 **"Set up a custom domain"**。
4. 在输入框里输入你想绑定的域名。
   - 比如你买的域名叫 `danjumart.com`，你可以直接输入 `danjumart.com`（作为主站）。
   - 也可以输入一个二级域名，比如 `app.danjumart.com`。
5. 点击 **"Continue"**。
6. Cloudflare 会自动检测并提示你添加 CNAME 记录。因为你的域名本身就是 Cloudflare 托管的，它会直接显示一个 **"Activate domain"** 的按钮。
7. 直接点击激活，等待几十秒到几分钟，状态变成 **"Active"**（带有绿色小勾）。

🎉 **恭喜！你现在可以通过自己的专属域名访问你的二手市场了！**

---

## 🔒 最后一步（也是最容易忘的一步）：修改 Supabase 配置

这是上线后最容易出局的一个**巨坑**！如果忘做这一步，你的用户在你新上线的域名里将**永远无法登录或者注册**。

1. 登录 [Supabase 控制台](https://supabase.com/dashboard/)，进入你的项目。
2. 在左侧菜单点击 **"Authentication"**（认证）。
3. 展开左侧子菜单，点击 **"URL Configuration"**。
4. 找到 **"Site URL"**，将其修改为你**刚刚绑定成功的自定义域名**（必须带上 `https://`，例如：`https://green2h.com`）。
5. 找到下方的 **"Redirect URLs"**，点击 **"Add URL"**。
6. 输入你的新域名加上 `/*`，例如：`https://green2h.com/*`。
   *（建议同时保留 `http://localhost:5173/*`，方便你以后本地继续开发测试）*
7. 点击绿色的 **"Save"** 保存设置。

---

**大功告成！** 
现在去浏览器里输入你的域名，用手机打开测试一下发帖子和聊天功能吧。体验一下自己开发的项目真正跑到互联网上的成就感！如果中途有哪一步没看懂或者出错了，随时把截图或错误信息发给我。
