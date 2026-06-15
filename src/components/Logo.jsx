import React from 'react'
import logoImg from '../assets/logo.png'

const Logo = ({ className = '' }) => {
  return (
    <img 
      src={logoImg} 
      className={`object-contain block ${className || 'h-8 w-auto'}`} 
      alt="Logo" 
    />
  )
}

export default Logo
