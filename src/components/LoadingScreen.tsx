import React from 'react'
import { Dumbbell } from 'lucide-react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 z-50">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6 animate-pulse">
        <Dumbbell className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">LinkinFit</h1>
      <p className="text-purple-300 text-sm">AI Personal Trainer</p>
      
      {/* Loading animation */}
      <div className="mt-8 flex space-x-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )
}

export default LoadingScreen
