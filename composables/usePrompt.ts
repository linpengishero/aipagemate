import { reactive } from 'vue';

export type PromptType = 'success' | 'error' | 'warning' | 'info';

interface NoticeState {
  visible: boolean;
  message: string;
  type: PromptType;
}

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve?: (value: boolean) => void;
}

const noticeState = reactive<NoticeState>({
  visible: false,
  message: '',
  type: 'info',
});

const confirmState = reactive<ConfirmState>({
  visible: false,
  title: 'Confirm',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
});

let noticeTimer: ReturnType<typeof setTimeout> | null = null;

export const usePrompt = () => {
  const notify = (message: string, type: PromptType = 'info', duration = 2200) => {
    noticeState.visible = true;
    noticeState.message = message;
    noticeState.type = type;

    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }

    noticeTimer = setTimeout(() => {
      noticeState.visible = false;
    }, duration);
  };

  const confirm = (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }) => {
    confirmState.visible = true;
    confirmState.title = options.title || 'Confirm';
    confirmState.message = options.message;
    confirmState.confirmText = options.confirmText || 'Confirm';
    confirmState.cancelText = options.cancelText || 'Cancel';
    confirmState.danger = !!options.danger;

    return new Promise<boolean>((resolve) => {
      confirmState.resolve = resolve;
    });
  };

  const resolveConfirm = (value: boolean) => {
    confirmState.visible = false;
    confirmState.resolve?.(value);
    confirmState.resolve = undefined;
  };

  return {
    noticeState,
    confirmState,
    notify,
    confirm,
    resolveConfirm,
  };
};
