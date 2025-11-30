import { hapticFeedback } from '../utils/haptics';
import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { Home, BarChart3, MessageCircle, Settings, Pill } from 'lucide-react'

const Layout: React.FC = () => {
  const location = useLocation()

  const navigationItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/statistics', icon: BarChart3, label: 'Stats' },
    { path: '/ai-coach', icon: MessageCircle, label: 'Coach' },
    { path: '/supplements', icon: Pill, label: 'Integratori' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const handleNavClick = () => {
    hapticFeedback('selection')
  }

  return (
    <div className="min-h-screen tg-bg flex flex-col">
      {/* Main content */}
      <main className="flex-1 pb-24 safe-area-top">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom backdrop-blur-md shadow-lg">
        <div className="flex justify-around items-center h-20">
          {navigationItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            
            return (
              <Link
                key={path}
                to={path}
                onClick={handleNavClick}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95'
                }`}
              >
                <Icon 
                  size={24} 
                  className={`mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} 
                />
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout
