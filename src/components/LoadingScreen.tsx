import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center tg-bg z-50">
      <div className="text-6xl mb-4 animate-pulse">💪</div>
      <h1 className="text-2xl font-bold tg-text mb-2">Phoenix Workout</h1>
      <p className="tg-hint text-sm">Il tuo Personal Trainer</p>
      
      {/* Loading animation */}
      <div className="mt-8 flex space-x-2">
        <div className="w-2 h-2 tg-button rounded-full animate-bounce"></div>
        <div className="w-2 h-2 tg-button rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 tg-button rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )
}

export default LoadingScreen
