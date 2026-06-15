import React from 'react'
import logoImg from '../assets/logo.png'

const Logo = ({ className = '' }) => {
  return (
    <img 
      src={logoImg} 
      className={`object-contain block ${className || 'h-28 w-auto'}`} 
      alt="Logo" 
    />
  )
}

export default Logo
