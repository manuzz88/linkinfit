import { useEffect, useState } from 'react'

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    start_param?: string;
    auth_date: number;
    hash: string;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  onEvent(eventType: string, eventHandler: () => void): void;
  offEvent(eventType: string, eventHandler: () => void): void;
  sendData(data: string): void;
}

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      setWebApp(tg)
      setIsAvailable(true)
      
      // Initialize WebApp
      tg.ready()
      tg.expand()
      
      console.log('🚀 Telegram WebApp initialized')
      console.log('User:', tg.initDataUnsafe.user)
      console.log('Theme:', tg.themeParams)
    } else {
      console.log('⚠️ Telegram WebApp not available (development mode)')
      setIsAvailable(false)
    }
  }, [])

  const hapticFeedback = (type: 'impact' | 'notification' | 'selection', style?: string) => {
    if (!webApp) return
    
    const haptic = webApp.HapticFeedback
    
    switch (type) {
      case 'impact':
        haptic.impactOccurred(style as any || 'medium')
        break
      case 'notification':
        haptic.notificationOccurred(style as any || 'success')
        break
      case 'selection':
        haptic.selectionChanged()
        break
    }
  }

  const showMainButton = (text: string, onClick: () => void) => {
    if (!webApp) return
    
    webApp.MainButton.setText(text)
    webApp.MainButton.onClick(onClick)
    webApp.MainButton.show()
  }

  const hideMainButton = () => {
    if (!webApp) return
    webApp.MainButton.hide()
  }

  const showBackButton = (onClick: () => void) => {
    if (!webApp) return
    
    webApp.BackButton.onClick(onClick)
    webApp.BackButton.show()
  }

  const hideBackButton = () => {
    if (!webApp) return
    webApp.BackButton.hide()
  }

  const sendData = (data: any) => {
    if (!webApp) return
    webApp.sendData(JSON.stringify(data))
  }

  const close = () => {
    if (!webApp) return
    webApp.close()
  }

  return {
    webApp,
    isAvailable,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    sendData,
    close
  }
}
