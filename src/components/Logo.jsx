import React from 'react'

const Logo = ({ className }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 text-green-600 ${className || ''}`}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.24 7.76C17.3653 8.8853 18.0004 10.4074 18.0004 12C18.0004 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 10.4074 6.63513 8.8853 7.76036 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 3"/>
    <path d="M12 2L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default Logo
