// Haptic feedback utility - usa Vibration API se disponibile

export const hapticFeedback = (
  type: 'impact' | 'notification' | 'selection' = 'impact',
  style?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
) => {
  // Usa Vibration API se disponibile
  if ('vibrate' in navigator) {
    switch (type) {
      case 'impact':
        if (style === 'heavy') {
          navigator.vibrate(50);
        } else if (style === 'medium') {
          navigator.vibrate(30);
        } else {
          navigator.vibrate(10);
        }
        break;
      case 'notification':
        if (style === 'success') {
          navigator.vibrate([10, 50, 10]);
        } else if (style === 'error') {
          navigator.vibrate([50, 50, 50]);
        } else {
          navigator.vibrate([20, 30, 20]);
        }
        break;
      case 'selection':
        navigator.vibrate(5);
        break;
    }
  }
};

// Funzioni placeholder per compatibilita
export const showBackButton = (_callback?: () => void) => {};
export const hideBackButton = () => {};
export const showMainButton = (_text?: string, _callback?: () => void) => {};
export const hideMainButton = () => {};
