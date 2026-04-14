<template>
  <div class="ai-chat-component">
    <!-- 主容器分为上下两部分 -->
    <div class="chat-main-container">
      <!-- 消息区域容器 -->
      <div class="chat-messages-container">
        <div ref="chatMessagesRef" class="chat-messages">
          <div v-if="!isActive" class="flex items-center justify-center h-full">
            <div
              class="text-center p-6 rounded-lg bg-gray-800/50 border border-blue-900/30 shadow-lg shadow-blue-900/10 max-w-xs mx-auto transition-all duration-300 transform hover:shadow-xl hover:shadow-blue-900/20"
            >
              <div
                class="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-4 border-2 border-gray-700"
              >
                <Icon icon="mdi:robot-dead-outline" class="text-gray-500 text-3xl" />
              </div>
              <h3 class="text-gray-400 text-base font-medium mb-2">AI Assistant is inactive</h3>
              <p class="text-gray-500 text-sm mb-4">Please activate the AI Assistant to get started.</p>
              <div class="flex items-center justify-center">
                <div
                  class="flex items-center mt-2 bg-gray-900/70 rounded-lg py-2 px-4 text-xs text-gray-400 border border-gray-700/50"
                >
                  <Icon
                    icon="mdi:information-outline"
                    class="mr-2 text-blue-400 text-base"
                  />
                  <span>Once activated, you can chat with the AI Assistant.</span>
                </div>
              </div>
            </div>
          </div>

          <template v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="[
                'message mb-3 p-3 rounded-lg max-w-[90%]',
                message.isUser
                  ? 'bg-blue-600/20 border border-blue-600/30 ml-auto'
                  : 'bg-gray-800/70 border border-gray-700/30',
              ]"
            >
              <div class="flex items-start">
                <div
                  v-if="!message.isUser"
                  class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2"
                >
                  <Icon icon="mdi:robot" class="text-white text-xs" />
                </div>
                <div
                  v-else
                  class="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center flex-shrink-0 mr-2"
                >
                  <Icon icon="mdi:account" class="text-white text-xs" />
                </div>
                <div>
                  <p class="text-gray-300 text-sm break-words whitespace-pre-wrap">
                    {{ message.content }}
                  </p>
                  <p class="text-gray-500 text-xs mt-1">{{ message.time }}</p>
                </div>
              </div>
            </div>

            <div
              v-if="activeStructuredQuestion"
              class="message mb-2.5 p-2.5 rounded-lg bg-gray-900/70 border border-gray-700/50 max-w-[90%]"
            >
              <div class="flex items-start">
                <div class="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Icon icon="mdi:robot" class="text-white text-[10px]" />
                </div>
                <div class="w-full">
                  <p class="text-blue-300 text-xs font-medium mb-1.5">{{ activeStructuredQuestion.title || 'Requirement Question' }}</p>
                  <p class="text-gray-300 text-xs leading-5 mb-2.5">{{ activeStructuredQuestion.question }}</p>

                  <div v-if="activeStructuredQuestion.type === 'option'" class="space-y-1.5">
                    <button
                      v-for="option in activeStructuredQuestion.options || []"
                      :key="option.id"
                      @click="submitStructuredOption(option.id)"
                      class="w-full text-left px-2.5 py-1.5 rounded-md bg-gray-800/80 border border-gray-700/50 text-gray-200 text-xs hover:border-blue-500/40 hover:bg-blue-500/10 transition-colors"
                    >
                      {{ option.label }}
                    </button>

                    <button
                      @click="toggleOtherInputForOption"
                      class="w-full text-left px-2.5 py-1.5 rounded-md bg-gray-800/80 border border-dashed border-blue-500/40 text-blue-200 text-xs hover:bg-blue-500/10 transition-colors"
                    >
                      Other (custom input)
                    </button>

                    <div v-if="showOtherInputForOption" class="space-y-1.5 pt-1">
                      <textarea
                        v-model="structuredInputValue"
                        placeholder="Please describe your custom requirement..."
                        class="w-full bg-gray-800/80 border border-gray-700/50 rounded-md px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500/40 placeholder-gray-500 resize-none text-xs"
                        rows="2"
                      ></textarea>
                      <button
                        @click="submitStructuredOtherInput"
                        :disabled="!structuredInputValue.trim()"
                        class="px-2.5 py-1 rounded-md text-xs transition-colors"
                        :class="structuredInputValue.trim() ? 'bg-blue-600/25 text-blue-200 hover:bg-blue-600/35' : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'"
                      >
                        Submit custom answer
                      </button>
                    </div>
                  </div>

                  <div v-else class="space-y-1.5">
                    <textarea
                      v-model="structuredInputValue"
                      :placeholder="activeStructuredQuestion.placeholder || 'Type your answer...'"
                      class="w-full bg-gray-800/80 border border-gray-700/50 rounded-md px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500/40 placeholder-gray-500 resize-none text-xs"
                      rows="2"
                    ></textarea>
                    <button
                      @click="submitStructuredInput"
                      :disabled="!structuredInputValue.trim()"
                      class="px-2.5 py-1 rounded-md text-xs transition-colors"
                      :class="structuredInputValue.trim() ? 'bg-blue-600/25 text-blue-200 hover:bg-blue-600/35' : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 生成中状态 -->
            <div
              v-if="isGenerating"
              class="message mb-3 p-3 rounded-lg bg-gray-800/70 border border-gray-700/30 max-w-[90%]"
            >
              <div class="flex items-start">
                <div
                  class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2"
                >
                  <Icon icon="mdi:robot" class="text-white text-xs" />
                </div>
                <div>
                  <div class="generating-dots flex space-x-1">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 输入区域容器 - 固定在底部 -->
      <div class="chat-input-container">
        <div class="chat-input-area px-3 py-3 bg-gray-800/60 border-t border-gray-700/30">
          <div class="relative">
            <div
              v-if="!isActive"
              class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
            >
              <div class="flex items-center text-gray-500 text-xs">
                <Icon icon="mdi:lock-outline" class="mr-2 text-base" />
                <span>Please activate the AI Assistant first</span>
              </div>
            </div>
            <textarea
              ref="inputRef"
              v-model="inputMessage"
               @input="autoResize"
              @keydown.enter.prevent="sendMessage"
              :disabled="isInputBlocked"
              :placeholder="
                welcomeMode ? 'What would you like to know?' : 'Describe what you want to create...'
              "
              class="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-2 pr-10 text-gray-300 focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none transition-all text-sm"
              :class="{
                'opacity-50 cursor-not-allowed': isInputBlocked,
                'border-blue-500/50 focus:ring-2 focus:ring-blue-500/20':
                  !isInputBlocked,
              }"
              rows="2"
              style="min-height: 35px; height: auto; max-height: 300px; overflow-y: hidden;"
            ></textarea>
            <button
              @click="sendMessage"
              :disabled="!canSend"
              class="absolute right-2 bottom-3 p-1 rounded-lg transition-all"
              :class="
                canSend
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : 'text-gray-600'
              "
            >
              <Icon v-if="!(isGenerating || props.externalGenerating)" icon="mdi:send" class="text-lg" />
              <Icon v-else icon="mdi:loading" class="text-lg animate-spin" />
            </button>
          </div>

          <!-- 操作按钮 -->
          <div v-if="isActive" class="flex items-center justify-between mt-2">
            <div class="flex items-center">
              <button
                @click="clearChat"
                class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded flex items-center transition-colors hover:bg-gray-700/30"
              >
                <Icon icon="mdi:delete-outline" class="text-sm mr-1" />
                Clear chat
              </button>
            </div>

            <div class="flex items-center">
              <!-- 添加AI模型设置组件 -->
              <AIModelSettings
                ref="aiModelSettingsRef"
                @model-changed="handleModelChanged"
                @settings-saved="handleSettingsSaved"
              />
              <!-- 显示当前选择的模型 -->
              <span class="text-xs text-gray-400 ml-2">
                Current model: <span class="text-blue-400">{{ currentModelName }}</span>
              </span>
            </div>
          </div>
          <div v-else class="flex items-center justify-center mt-2">
            <div
              class="text-xs text-gray-500 px-2 py-1 rounded-md bg-gray-800/50 flex items-center"
            >
              <Icon
                icon="mdi:power-standby"
                class="mr-1 text-yellow-500 inline-block"
              />
              <span>Activate AI Assistant to start interacting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import type { ChatMessage } from "@/api/LLM/config";
import { getAIProvider } from '~/utils/aiweb/providers/factory';
import AIModelSettings from "./AIModelSettings.vue";
import { useAIModelSettings } from "../../composables/useAIModelSettings";
import { buildChatHistoryKey } from '~/utils/aiweb/context/keyFactory';

const props = defineProps({
  welcomeMode: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    default: '',
  },
  pageId: {
    type: String,
    default: '',
  },
  externalGenerating: {
    type: Boolean,
    default: false,
  },
});

// 移除pageid依赖，改为直接使用isActiveFlag控制激活状态
const isActiveFlag = ref(true); // 默认激活

// 添加AI模型设置引用
const aiModelSettingsRef = ref<InstanceType<typeof AIModelSettings> | null>(null);

// 添加源代码和元素代码的引用
const sourceCode = ref('');
const elementCode = ref('');

// 当前AI模型
const {
  currentModel,
  getModelDisplayName,
  loadSettings
} = useAIModelSettings();

// 计算当前模型名称
const currentModelName = computed(() => currentModel.value.name || 'Not configured');

// 处理模型变更（选择时即时更新显示）
const handleModelChanged = (model: Record<string, any>) => {
  const modelId = model.model || model.id || '';
  currentModel.value = {
    id: modelId,
    name: model.modelName || model.name || getModelDisplayName(modelId),
    apiKey: model.apiKey || '',
    baseURL: model.baseURL || ''
  };
};

// 处理设置保存（保存后同步状态）
const handleSettingsSaved = (settings: Record<string, any>) => {
  const modelId = settings.model || '';
  currentModel.value = {
    id: modelId,
    name: settings.modelName || getModelDisplayName(modelId),
    apiKey: settings.apiKey || '',
    baseURL: settings.baseURL || ''
  };

  // 再次从存储同步，避免显示与真实配置不一致
  loadSettings();
};

// 检查当前模型是否可用 - 使用 AIModelSettings 导出的方法
const checkModelAvailable = () => {
  if (aiModelSettingsRef.value) {
    return aiModelSettingsRef.value.checkModelAvailable();
  }
  
  // 如果引用不可用，则通过当前模型信息检查
  if (currentModel.value.id && currentModel.value.apiKey) {
    return true;
  }
  
  return false;
};


const emit = defineEmits([
  "message-sent",
  "message-received",
  "generating-start",
  "generating-end",
  "generation-success",
  "generation-failure",
  "structured-answer",
]);

// 状态 - 修改为直接使用isActiveFlag
const isActive = computed(() => isActiveFlag.value || props.welcomeMode);
const isGenerating = ref(false);

type LocalChatMessage = { isUser: boolean; content: string; time: string };
type StructuredOption = { id: string; label: string };
type StructuredQuestion = {
  id: string;
  title?: string;
  question: string;
  type: 'input' | 'option';
  placeholder?: string;
  options?: StructuredOption[];
};

const messages = ref<LocalChatMessage[]>([]);
const inputMessage = ref("");
const activeStructuredQuestion = ref<StructuredQuestion | null>(null);
const structuredInputValue = ref('');
const showOtherInputForOption = ref(false);

const getChatHistoryStorageKey = () => buildChatHistoryKey({
  projectId: props.projectId,
  pageId: props.pageId,
});

const persistChatHistory = () => {
  try {
    localStorage.setItem(getChatHistoryStorageKey(), JSON.stringify(messages.value));
  } catch (error) {
    console.error('保存聊天记录失败:', error);
  }
};

const removeChatHistory = () => {
  try {
    localStorage.removeItem(getChatHistoryStorageKey());
  } catch (error) {
    console.error('删除聊天记录失败:', error);
  }
};

const loadChatHistory = () => {
  try {
    const raw = localStorage.getItem(getChatHistoryStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        messages.value = parsed;
        return;
      }
    }
    messages.value = [];
  } catch (error) {
    console.error('读取聊天记录失败:', error);
    messages.value = [];
  }
};

const buildContextMessages = (latestPrompt?: string): ChatMessage[] => {
  const historyMessages: ChatMessage[] = messages.value
    .filter((msg) => !!msg.content && msg.content.trim() !== '')
    .map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content,
    }));

  const latestUserMessage = latestPrompt?.trim();
  const needAppendLatest = !!latestUserMessage && !messages.value.some(
    (msg) => msg.isUser && msg.content === latestUserMessage
  );

  if (needAppendLatest && latestUserMessage) {
    historyMessages.push({ role: 'user', content: latestUserMessage });
  }

  // 控制上下文长度，避免请求过大
  return historyMessages.slice(-30);
};
const inputRef = ref<HTMLTextAreaElement | null>(null); //ref(null);
const chatMessagesRef = ref(null);
const suppressNextPersist = ref(false);


// 自动调整高度的函数
const autoResize = () => {
    if (inputRef.value) {
        // 重置高度为 auto，以便计算 scrollHeight
        inputRef.value.style.height = 'auto';
        // 将 scrollHeight 设置为新的高度
        inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
    }
};



watch(
  () => messages.value,
  () => {
    if (suppressNextPersist.value) {
      suppressNextPersist.value = false;
      return;
    }
    persistChatHistory();
  },
  { deep: true }
);

watch(
  () => [props.projectId, props.pageId],
  () => {
    closeStructuredQuestion();
    messages.value = [];
    loadChatHistory();

    if (messages.value.length === 0) {
      if (props.welcomeMode) {
        addAIMessage("Hello! How can I help you?");
      } else {
        addAIMessage("Welcome to the AI Assistant! Please describe what you'd like to generate, and I'll do my best to help you.");
      }
    }
  }
);

const isInputBlocked = computed(() => {
  return !isActive.value || isGenerating.value || props.externalGenerating || !!activeStructuredQuestion.value;
});

// 计算是否可以发送消息
const canSend = computed(() => {
  return !isInputBlocked.value && inputMessage.value.trim() !== "";
});

// 发送消息
const sendMessage = () => {
  if (!canSend.value) return;

  const message = inputMessage.value.trim();
  if (!message) return;

  // 添加用户消息
  messages.value.push({
    isUser: true,
    content: message,
    time: new Date().toLocaleTimeString(),
  });

  // 清空输入框
  inputMessage.value = "";

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
    // 确保输入框仍然可见
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });

  // 发送事件
  emit("message-sent", { message });
  autoResize();
  // 开始生成
  startGenerating(message);
};

// 开始生成
const startGenerating = (message: string) => {
  isGenerating.value = true;
  emit("generating-start");

  // 先检查模型是否已配置
  if (!checkModelAvailable()) {
    isGenerating.value = false;
    emit("generating-end");
    addAIMessage("Please configure your AI model settings before generating content.");
    return;
  }

  // 滚动到底部确保用户可以看到生成中状态
  nextTick(() => {
    scrollToBottom();
  });

  // 向父组件传递message，让父组件调用AI接口
  emit("message-received", { message });
};

// // 处理普通问答
// const handleNormalQuestion = async (message: string) => {
//   try {
//     const res = await chat(message);
//     const aiResponse = res.choices[0].message.content;

//     addAIMessage(aiResponse);
    
//     // 结束生成状态
//     isGenerating.value = false;
//     emit("generating-end");
//   } catch (error) {
//     console.error("聊天请求失败:", error);

//     // 添加错误消息
//     messages.value.push({
//       isUser: false,
//       content: "Sorry, something went wrong while processing your request. Please try again later.",
//       time: new Date().toLocaleTimeString(),
//     });

//     // 结束生成状态
//     isGenerating.value = false;
//     emit("generating-end");
//     emit("generation-failure", error);

//     // 滚动到底部并确保输入框可见
//     nextTick(() => {
//       scrollToBottom();
//       // 确保输入框仍然可见
//       if (inputRef.value) {
//         (inputRef.value as HTMLTextAreaElement).focus();
//       }
//     });
//   }
// };

// 滚动到底部的方法
const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    try {
      // 使用更可靠的方法确保滚动到底部
      const scrollHeight = (chatMessagesRef.value as HTMLElement).scrollHeight;
      const height = (chatMessagesRef.value as HTMLElement).clientHeight;
      const maxScrollTop = scrollHeight - height;

      // 强制立即滚动到底部
      (chatMessagesRef.value as HTMLElement).scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;

      // 为了确保在某些情况下滚动仍然有效，再次尝试滚动
      setTimeout(() => {
        if (chatMessagesRef.value) {
          (chatMessagesRef.value as HTMLElement).scrollTop = (chatMessagesRef.value as HTMLElement).scrollHeight;
        }
      }, 50);
    } catch (e) {
      console.error("滚动到底部时出错:", e);
    }
  }
};

// 清除聊天记录
const clearChat = () => {
  suppressNextPersist.value = true;
  messages.value = [];
  removeChatHistory();

  // 聚焦输入框
  nextTick(() => {
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });
};

// 设置激活/不可用状态的方法（供父组件调用）- 修改为直接控制isActiveFlag
const setActive = (active: boolean) => {
  isActiveFlag.value = active;
  
  if (active) {
    // 如果是首次激活，可以显示欢迎消息
    if (messages.value.length === 0) {
      if (props.welcomeMode) {
        addAIMessage("Hi! How can I help you today?");
      } else {
        addAIMessage("Welcome to AI Assistant! Describe what you want to generate, and I’ll help you build it.");
      }
    }
    
    nextTick(() => {
      scrollToBottom();
      if (inputRef.value) {
        (inputRef.value as HTMLTextAreaElement).focus();
      }
    });
  }
};

// 添加AI回复消息的方法（供父组件调用）
const addAIMessage = (content: string) => {
  messages.value.push({
    isUser: false,
    content,
    time: new Date().toLocaleTimeString(),
  });

  nextTick(() => {
    scrollToBottom();
  });
};

// 公开方法给父组件调用
const onAnswerSuccess = (successMessage?: string) => {
  isGenerating.value = false;
  emit("generating-end");

  // 添加一条成功生成的消息，如果提供了自定义消息则使用它
  addAIMessage(
    successMessage || "Web page generated successfully! Check the preview and continue refining with me."
  );

  // 确保输入框可见
  nextTick(() => {
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });
};

// 添加处理生成失败的方法
const onAnswerFail = (errorMessage?: string) => {
  isGenerating.value = false;
  emit("generating-end");
  
  // 添加错误消息，如果提供了自定义消息则使用它
  addAIMessage(
    errorMessage || "Sorry, an error occurred while generating content. Please try again."
  );
  
  // 确保输入框可见
  nextTick(() => {
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });
};

// 当组件挂载时，滚动到底部
onMounted(() => {
  loadChatHistory();

  nextTick(() => {
    scrollToBottom();

    // 无历史记录时添加欢迎消息
    if (messages.value.length === 0) {
      if (props.welcomeMode) {
        addAIMessage("Hello! How can I help you?");
      } else {
        addAIMessage("Welcome to the AI Assistant! Please describe what you'd like to generate, and I'll do my best to help you.");
      }
    }

    // 聚焦输入框
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
});

// 修改selectPage方法为activate方法
const activate = (sourceCodeParam = '') => {
  isActiveFlag.value = true;
  
  // 如果有源代码，设置当前代码
  if (sourceCodeParam) {
    elementCode.value = '';
    sourceCode.value = sourceCodeParam;
  }
  
  // 仅在当前页面上下文为空时添加欢迎消息
  if (messages.value.length === 0) {
    addAIMessage(
      "Welcome to AI Assistant! Describe what you want to create, and I will generate the code based on your request."
    );
  }

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
    // 聚焦输入框
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });
};

// 处理元素代码的方法
const handleElementCode = (elementCodeParam: string, sourceCodeParam: string) => {
  if (!isActive.value) return;

  // 进入元素编辑时，清理可能遗留的结构化问询状态，避免输入框被锁定
  closeStructuredQuestion();
  
  // 存储传入的元素和源代码
  elementCode.value = elementCodeParam;
  sourceCode.value = sourceCodeParam;
  
  // 解析元素类型
  let elementType = "element";
  let elementDesc = "Please tell me how to modify this element.";
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(elementCodeParam, 'text/html');
    const element = doc.body.firstChild as HTMLElement;
    if (element) {
      // 确定元素类型
      if (element.tagName === 'IMG') {
        elementType = "Image";
      } else if (['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'A', 'BUTTON'].includes(element.tagName) && 
                 (!element.children.length || element.children.length === 1)) {
        elementType = "Text";
      } else {
        elementType = "Layout element";
      }
    }
  } catch (e) {
    console.error("解析元素失败:", e);
  }
  
  // 添加系统消息显示当前选择的元素（简洁版本）
  messages.value.push({
    isUser: false,
    content: `You have selected a translation.【${elementType}】\n${elementDesc}`,
    time: new Date().toLocaleTimeString(),
  });

  // 自动在输入框中添加提示
  inputMessage.value = `Please design a more aesthetically pleasing style for this ${elementType}.`;

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
    // 聚焦输入框并将光标移到末尾
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
      const length = inputMessage.value.length;
      (inputRef.value as HTMLTextAreaElement).setSelectionRange(length, length);
    }
  });
};

// 添加处理外部结果的方法
const handleExternalGenerationResult = (result: string, success = true) => {
  if (success) {
    // 如果生成成功，保存结果并展示成功消息
    if (elementCode.value && sourceCode.value) {
      sourceCode.value = result;
      addAIMessage("The content has been successfully updated. Please check the result in the preview area, and feel free to continue discussing any modifications or optimizations.");
    } else {
      sourceCode.value = result;
      addAIMessage("The content has been successfully generated. Please check the result in the preview area, and feel free to continue discussing any modifications or optimizations.");
    }
  } else {
    // 如果生成失败，展示错误消息
    addAIMessage("Sorry, there was a problem processing your request. Please try again later.");
  }
  
  // 结束生成状态
  isGenerating.value = false;
  
  // 确保输入框可见
  nextTick(() => {
    if (inputRef.value) {
      (inputRef.value as HTMLTextAreaElement).focus();
    }
  });
};

// 添加一个用于处理AI请求的方法，供外部组件调用
const processAIRequest = async (prompt: string) => {
  try {
    const contextMessages = buildContextMessages(prompt);
    const provider = getAIProvider();
    const response = await provider.chat({ messages: contextMessages });

    if (!response.ok) {
      return {
        success: false,
        content: null,
        error: `[${response.code}] ${response.message}`,
      };
    }

    return {
      success: true,
      content: response.data.content.trim(),
      error: null,
    };
  } catch (error: any) {
    console.error("AI请求处理失败:", error);
    return {
      success: false,
      content: null,
      error: error.message || "An unknown error occurred while processing the request."
    };
  }
};

const ensureOtherOption = (question: StructuredQuestion): StructuredQuestion => {
  if (question.type !== 'option') {
    return question;
  }

  const options = Array.isArray(question.options) ? [...question.options] : [];
  const hasOther = options.some((option) => option.id === 'other');

  if (!hasOther) {
    options.push({ id: 'other', label: 'Other (custom input)' });
  }

  return {
    ...question,
    options,
  };
};

const openStructuredQuestion = (question: StructuredQuestion) => {
  activeStructuredQuestion.value = ensureOtherOption(question);
  structuredInputValue.value = '';
  showOtherInputForOption.value = false;

  nextTick(() => {
    scrollToBottom();
  });
};

const closeStructuredQuestion = () => {
  activeStructuredQuestion.value = null;
  structuredInputValue.value = '';
  showOtherInputForOption.value = false;
};

const toggleOtherInputForOption = () => {
  showOtherInputForOption.value = !showOtherInputForOption.value;
  if (!showOtherInputForOption.value) {
    structuredInputValue.value = '';
  }
};

const submitStructuredOption = (optionId: string) => {
  if (!activeStructuredQuestion.value) return;

  if (optionId === 'other') {
    showOtherInputForOption.value = true;
    nextTick(() => {
      scrollToBottom();
    });
    return;
  }

  const questionId = activeStructuredQuestion.value.id;
  const option = activeStructuredQuestion.value.options?.find(item => item.id === optionId);
  const optionLabel = option?.label || optionId;

  messages.value.push({
    isUser: true,
    content: optionLabel,
    time: new Date().toLocaleTimeString(),
  });

  // 先关闭当前问题，再发事件，避免父组件打开下一题后被本组件关闭
  closeStructuredQuestion();

  emit('structured-answer', {
    questionId,
    type: 'option',
    value: optionLabel,
    optionId,
  });

  nextTick(() => {
    scrollToBottom();
  });
};

const submitStructuredOtherInput = () => {
  if (!activeStructuredQuestion.value) return;
  const value = structuredInputValue.value.trim();
  if (!value) return;

  const questionId = activeStructuredQuestion.value.id;

  messages.value.push({
    isUser: true,
    content: value,
    time: new Date().toLocaleTimeString(),
  });

  // 先关闭当前问题，再发事件，避免父组件打开下一题后被本组件关闭
  closeStructuredQuestion();

  emit('structured-answer', {
    questionId,
    type: 'input',
    value,
    optionId: 'other'
  });

  nextTick(() => {
    scrollToBottom();
  });
};

const submitStructuredInput = () => {
  if (!activeStructuredQuestion.value) return;
  const value = structuredInputValue.value.trim();
  if (!value) return;

  const questionId = activeStructuredQuestion.value.id;

  messages.value.push({
    isUser: true,
    content: value,
    time: new Date().toLocaleTimeString(),
  });

  // 先关闭当前问题，再发事件，避免父组件打开下一题后被本组件关闭
  closeStructuredQuestion();

  emit('structured-answer', {
    questionId,
    type: 'input',
    value,
  });

  nextTick(() => {
    scrollToBottom();
  });
};

// 添加一个方法用于直接发送用户消息
const sendUserMessage = (message: string, preventApiCall = false) => {
  if (!message.trim()) return;
  
  // 激活组件如果尚未激活
  if (!isActiveFlag.value) {
    isActiveFlag.value = true;
  }
  
  // 添加用户消息到列表
  messages.value.push({
    isUser: true,
    content: message,
    time: new Date().toLocaleTimeString(),
  });
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
  
  // 发送事件
  emit("message-sent", { message });
  
  // 只有在不阻止API调用时才开始生成
  if (!preventApiCall) {
    // 开始生成
    startGenerating(message);
  }
};

// 公开方法供父组件调用
defineExpose({
  onAnswerSuccess,
  onAnswerFail,
  setActive,
  clearChat,
  addAIMessage,
  activate,
  handleElementCode,
  handleExternalGenerationResult,
  processAIRequest,
  sendUserMessage,
  openStructuredQuestion,
  closeStructuredQuestion
});
</script>

<style scoped>
textarea {
    /* overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none; */
    overflow-y: auto !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overflow: hidden;
    resize: none;
    height: auto;
    /* max-height: none !important; */
    max-height: 250px !important;
}
/* 主容器样式 */
.ai-chat-component {
  position: relative;
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

/* 聊天主容器 - 使用grid布局确保两个区域位置固定 */
.chat-main-container {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* 消息容器 - 确保内容可以滚动 */
.chat-messages-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

/* 消息列表 - 处理滚动和内容 */
.chat-messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  padding: 0.75rem;
}

/* 隐藏滚动条 */
.chat-messages::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 输入容器 - 固定在底部不参与滚动 */
.chat-input-container {
  width: 100%;
  background: rgba(31, 41, 55, 0.4);
  backdrop-filter: blur(4px);
  border-top: 1px solid rgba(75, 85, 99, 0.3);
}

/* 状态样式 */
.ai-chat-component:not(.active) {
  filter: grayscale(0.8);
  opacity: 0.9;
}

.ai-chat-component.active {
  filter: grayscale(0);
  opacity: 1;
}

/* 生成中动画 */
.generating-dots {
  display: flex;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #60a5fa;
  margin: 0 2px;
  animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 消息样式 */
.message {
  transition: all 0.2s ease;
}

.message:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 输入框聚焦样式 */
textarea:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
