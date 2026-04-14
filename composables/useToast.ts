import { ref } from 'vue';
import { showToast as vantShowToast } from 'vant';
import 'vant/es/toast/style';

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'fail';
  message: string;
  position?: 'top' | 'bottom' | 'middle';
  duration?: number;
}

// 创建一个全局的状态存储toasts (用于自定义UI实现，现在使用Vant的直接实现)
const toasts = ref<Array<{
  id: number;
  message: string;
  type: string;
  position: string;
}>>([]);

let toastCounter = 0;

export function useToast() {
  // 显示toast
  const showToast = (options: ToastOptions | string) => {
    // 支持直接传递字符串作为消息
    if (typeof options === 'string') {
      // 使用Vant的Toast
      vantShowToast(options);
      return;
    }
    
    // 将我们的类型映射到Vant的类型
    const vantTypeMap = {
      'success': 'success',
      'error': 'fail',
      'warning': 'warning',
      'info': 'text',
      'fail': 'fail'
    };
    
    const vantType = options.type ? vantTypeMap[options.type] : 'text';
    
    // 使用Vant的Toast组件
    vantShowToast({
      message: options.message,
      type: vantType as any,
      position: options.position || 'middle',
      duration: options.duration || 2000
    });
    
    // 添加toast到列表(为了兼容已有的UI组件)
    const toastId = toastCounter++;
    toasts.value.push({
      id: toastId,
      message: options.message,
      type: options.type || 'info',
      position: options.position || 'top'
    });
    
    // 设置自动移除
    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === toastId);
      if (index !== -1) {
        toasts.value.splice(index, 1);
      }
    }, options.duration || 2000);
  };
  
  return {
    showToast,
    toasts
  };
} 