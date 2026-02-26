import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Leaflet 默认图标修复（Vite 打包环境下必须手动配置）
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Upload from './pages/Upload.jsx'
import Profile from './pages/Profile.jsx'
import Welcome from './pages/Welcome.jsx'
import Inbox from './pages/Inbox.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import Auth from './pages/Auth.jsx'
import EditProduct from './pages/EditProduct.jsx'
import NotFound from './pages/NotFound.jsx'
import UserProfile from './pages/UserProfile.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// 路由守卫：需要登录才能访问的页面
const RequireAuth = ({ children }) => {
  const { session } = useMarketplace()
  const location = useLocation()

  if (!session) {
    // 保存用户想去的页面，登录后可以跳回
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

const AppContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useMarketplace()

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited')
    if (!hasVisited && location.pathname !== '/welcome' && location.pathname !== '/auth') {
      navigate('/welcome')
    } else if (hasVisited && location.pathname === '/') {
      navigate('/home')
    }
  }, [navigate, location.pathname])

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/auth" element={
        session ? <Navigate to="/home" replace /> : <Auth />
      } />
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/upload" element={
          <RequireAuth><Upload /></RequireAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth><Profile /></RequireAuth>
        } />
        <Route path="/edit/:id" element={
          <RequireAuth><EditProduct /></RequireAuth>
        } />
        <Route path="/inbox" element={
          <RequireAuth><Inbox /></RequireAuth>
        } />
        <Route path="/chat/:id" element={
          <RequireAuth><ChatRoom /></RequireAuth>
        } />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

const App = () => (
  <MarketplaceProvider>
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  </MarketplaceProvider>
)

createRoot(document.getElementById('root')).render(<App />)
