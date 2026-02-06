import React from 'react'
import logoImg from '../assets/logo.png'

const Logo = ({ className = '' }) => {
  return (
    <img 
      src={logoImg} 
      className="h-10 w-auto object-contain block" 
      alt="Logo" 
    />
  )
}

export default Logo
