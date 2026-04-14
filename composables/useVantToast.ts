import { showToast as vantShowToast } from 'vant';
import 'vant/es/toast/style';

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'fail';
  message: string;
  position?: 'top' | 'bottom' | 'middle';
  duration?: number;
}

export function useVantToast() {
  // 显示toast
  const showToast = (options: ToastOptions | string) => {
    // 支持直接传递字符串作为消息
    if (typeof options === 'string') {
      vantShowToast(options);
      return;
    }
    
    // 将我们的类型映射到Vant的类型
    const typeMap = {
      'success': 'success',
      'error': 'fail',
      'warning': 'warning',
      'info': 'text',
      'fail': 'fail'
    };
    
    const vantType = options.type ? typeMap[options.type] : 'text';
    
    vantShowToast({
      message: options.message,
      type: vantType as any,
      position: options.position || 'middle',
      duration: options.duration || 2000
    });
    
    // 在控制台显示消息（便于调试）
    console.log(`[Toast - ${options.type || 'info'}]: ${options.message}`);
  };
  
  return {
    showToast
  };
} 