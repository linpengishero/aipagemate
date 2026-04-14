<template>
  <NavBar/>
  <div
    class="h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden"
  >

    <!-- 主要内容区 -->
    <main class="flex-1 overflow-hidden flex flex-col">
      <!-- 创作区域 -->
      <div class="flex-1 p-4 flex overflow-hidden">
        <!-- 左侧：项目管理区 -->
        <div
          class="w-80 flex-shrink-0 bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-xl shadow-gray-900/20 border border-gray-700/30 mr-4 overflow-hidden flex flex-col"
        >
          <!-- 项目浏览器组件，直接使用，无需额外嵌套 -->
          <ProjectBrowser
            ref="projectBrowserRef"
            :allow-create-project="!currentProjectId && !isUiLocked"
            :allow-create-page="!isGenerationLocked && !isUiLocked"
            :allow-delete-project="!isGenerationLocked && !isUiLocked"
            :allow-delete-page="!isGenerationLocked && !isUiLocked"
            :is-busy="isUiLocked"
            @page-selected="handleSelectPage"
            @delete-page="handleDeletePage"
            @project-selected="handleSelectProject"
            @project-cleared="handleProjectCleared"
            @project-context-selected="handleSelectProjectContext"
            class="flex-1 overflow-hidden"
          />
          
        </div>

        <!-- 中间：Preview和编辑区 -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <template v-if="currentProjectId">
            <PreviewWorkspace
              ref="previewWorkspaceRef"
              :preview-url="previewUrl"
              :preview-overlay-state="previewOverlayState"
              :actions-disabled="!toolbarEnabled"
              :page-actions-disabled="!toolbarEnabled || !activePage"
              :package-disabled="!toolbarEnabled"
              :is-mobile-view="isMobileView"
              :is-inspect-mode="isInspectMode"
              :is-ai-sidebar-collapsed="isAISidebarCollapsed"
              :is-fullscreen="isPreviewFullscreen"
              @save="handleSaveRequest"
              @download-page="handleDownloadPage"
              @package-project="handlePackageProject"
              @preview="handlePreview"
              @download-pdf="handleDownloadPDF"
              @toggle-mobile="toggleMobileView"
              @toggle-inspect="toggleInspectMode"
              @toggle-ai-sidebar="toggleAISidebar"
              @toggle-fullscreen="togglePreviewFullscreen"
              @iframe-load="handleIframeLoad"
            />
          </template>
          <template v-else>
            <ProjectWorkspacePlaceholder @create-project="openCreateProjectFromPlaceholder" />
          </template>
        </div>

        <!-- 右侧：AI Assistant侧边栏（可折叠） -->
        <div
          v-if="currentProjectId"
          class="ai-sidebar-panel overflow-hidden transition-all duration-300 bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-xl shadow-gray-900/20 border border-gray-700/30 ml-4 flex flex-col"
          :class="[
            isAISidebarCollapsed ? 'w-0 ml-0 opacity-0 border-0' : 'w-80 opacity-100',
            isUiLocked ? 'opacity-60 pointer-events-none select-none' : '',
          ]"
        >
          <!-- 侧边栏顶部栏 -->
          <div
            class="p-3 border-b border-gray-700/30 flex items-center justify-between bg-gray-800/60"
          >
            <div class="flex items-center">
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0"
              >
                <Icon icon="mdi:robot" class="text-white text-lg" />
              </div>
              <h3 class="ml-2 text-white text-sm font-medium">AI Assistant</h3>
            </div>
            <button
              @click="toggleAISidebar"
              class="text-gray-400 hover:text-white p-1 rounded transition-colors"
            >
              <Icon icon="mdi:chevron-right" class="text-lg" />
            </button>
          </div>

          <!-- AI助手内容区 -->
          <div class="flex-1 relative">
            <AIChatComponent
              ref="aiChatRef"
              :welcomeMode="false"
              :projectId="currentProjectId"
              :pageId="currentPageId"
              :externalGenerating="isUiLocked"
              @generating-start="handleGeneratingStart"
              @message-received="handleMessageReceived"
              @structured-answer="handleStructuredAnswer"
              @generation-failure="handleGenerationFailure"
              class="absolute inset-0"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <!-- 导出设置对话框 -->
  <ExportDialog 
    v-model="showExportDialog"
    :pageName="activePage?.name"
    @export="handleExportSettings"
  />
  
  <!-- 添加项目打包对话框 -->
  <ProjectPackageDialog
    v-model="showPackageOptionsDialog"
    :projectId="currentProjectId"
    @processing-start="startGlobalBlocking('Packaging project...', 'Please wait while project files are being prepared.')"
    @processing-end="endGlobalBlocking"
  />

  <FullScreenLoadingOverlay
    :visible="isGlobalBlocking"
    :title="globalBlockingTitle"
    :description="globalBlockingDescription"
  />

  <AppPromptLayer />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { usePrompt } from '~/composables/usePrompt';
import AppPromptLayer from '~/components/common/AppPromptLayer.vue';
import ProjectBrowser from "~/components/aiweb/ProjectBrowser/ProjectBrowser.vue";
import AIChatComponent from "~/components/ai/AIChatComponent.vue";
import ExportDialog from "~/components/aiweb/dialog/ExportDialog.vue";
import ProjectPackageDialog from "~/components/aiweb/dialog/ProjectPackageDialog.vue";
import PreviewWorkspace from '~/components/aiweb/PreviewWorkspace.vue';
import ProjectWorkspacePlaceholder from '~/components/aiweb/ProjectWorkspacePlaceholder.vue';
import FullScreenLoadingOverlay from '~/components/aiweb/FullScreenLoadingOverlay.vue';
import webProjectStore from '~/utils/webDB/WebProjectStorage';
import type { ExportSettings, AIProcessResult } from '~/utils/aiweb/dto/exportDto';
import {
  runPageExportPipeline,
  runPdfExportPipeline,
} from '~/utils/aiweb/workflows';
import {
  logFlowStage,
  getPreviewMethods,
  compilePreviewCode,
  getPreviewCurrentCode,
  resetPreviewGeneration,
  normalizeToSafeSfc,
} from '~/utils/aiweb/tools';
import {
  runRequirementAnalysis,
  runPlanProposal,
  runPagePlanProposal,
  runSinglePageGeneration,
  runElementEditFlow,
  createEmptyRequirementFlowContext,
  reduceStructuredAnswer,
  buildPlanConfirmationQuestion,
  buildPagePlanConfirmationQuestion,
  ROLE_IDS,
  buildGenerationContinueQuestion,
  reduceGenerationContinueAnswer,
  hasPendingGenerationProgress,
  type RequirementFlowStage,
  type RequirementFlowContext,
} from '~/utils/aiweb/orchestrators';
import {
  buildProjectFlowKey,
  buildPageFlowKey,
  buildRoleProjectKey,
  buildRolePageKey,
} from '~/utils/aiweb/context/keyFactory';
import {
  createContextStoreState,
  loadContextStoreState,
  saveFlowSnapshot,
  restoreFlowSnapshot,
  appendRoleContext,
  getRoleContextText,
} from '~/utils/aiweb/context/contextStore';

useHead({
  title: 'aipagemate Studio - AI Web Design Workspace',
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'canonical', href: 'https://www.aipagemate.com/aiwebdesign' },
  ],
  meta: [
    { name: 'robots', content: 'index, follow' },
    { name: 'author', content: 'aipagemate' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'geo.region', content: 'US' },
    { name: 'geo.placename', content: 'San Francisco' },
    { name: 'geo.position', content: '37.7749;-122.4194' },
    { name: 'ICBM', content: '37.7749, -122.4194' },
    {
      name: 'description',
      content: 'aipagemate Studio is an AI web design workspace for creating multi-page projects, generating and editing pages visually, and exporting production-ready HTML or Vue project files.',
    },
    {
      name: 'keywords',
      content: 'AI web design, AI website builder, visual web editor, multi-page project manager, AI page generation, HTML export, Vue project export, aipagemate studio',
    },
    { property: 'og:title', content: 'aipagemate Studio - AI Web Design Workspace' },
    {
      property: 'og:description',
      content: 'Design and generate web pages with AI, manage multi-page projects, edit visually, and export production-ready assets in aipagemate Studio.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.aipagemate.com/aiwebdesign' },
    { name: 'twitter:title', content: 'aipagemate Studio - AI Web Design Workspace' },
    {
      name: 'twitter:description',
      content: 'AI-powered workspace for web page generation, visual editing, project management, and export workflows.',
    },
  ],
});

// 为Window扩展类型定义
declare global {
  interface Window {
    webPreviewMethods?: {
      compileAndRun: (code: string) => void;
      getCurrentCode: () => string;
      generationProgress: () => void;
      resetGenerationProgress?: () => void;
      toggleInspectMode: () => void;
      toggleMobileView: (isMobile: boolean) => void;
      isInspectMode: boolean;
      isMobileView: boolean;
    };
    __AIWEB_DISABLE_RUNTIME_SEO__?: boolean;
  }
}

const previewWorkspaceRef = ref<any>(null);
const iframeLoaded = ref(false);
const previewUrl = '/aiwebdesign/WebPreviewPage';
const isPreviewFullscreen = ref(false);

const getPreviewFrame = (): HTMLIFrameElement | null => {
  const frameRefOrEl = previewWorkspaceRef.value?.previewFrameEl;
  if (!frameRefOrEl) return null;
  return frameRefOrEl.value ?? frameRefOrEl;
};

// AI助手组件引用
const aiChatRef = ref();

// 左侧项目浏览器组件引用
const projectBrowserRef = ref<any>(null);

// 活动页面
const activePage = ref<any>(null);

// 添加存储当前元素代码和源代码的变量
const currentElementCode = ref("");
const currentSourceCode = ref("");

// 添加移动端和检查模式的状态
const isMobileView = ref(false);
const isInspectMode = ref(false);
const isGenerating = ref(false); // AI生成状态
const isProjectContextActive = ref(false);
const isAdvancingPlannedPage = ref(false);

// 首次生成的需求澄清与方案确认流程状态
const requirementFlowStage = ref<RequirementFlowStage>('idle');
const requirementFlowContext = ref<RequirementFlowContext>(createEmptyRequirementFlowContext());

const contextStoreState = ref(createContextStoreState());

const appendRoleContextEntry = (key: string, entry: string) => {
  appendRoleContext(contextStoreState.value.role, key, entry);
};

const getRoleContextTextByKey = (key: string) => {
  return getRoleContextText(contextStoreState.value.role, key);
};

const saveCurrentFlowContext = (mode: 'auto' | 'project' = 'auto') => {
  if (!currentProjectId.value) return;

  const hasGenerationProgress = Boolean(
    requirementFlowContext.value.generationProgress
    && requirementFlowContext.value.generationProgress.nextIndex < requirementFlowContext.value.generationProgress.plannedPages.length,
  );

  const forceProjectLevel = mode === 'project' || hasGenerationProgress;

  const key = forceProjectLevel
    ? buildProjectFlowKey(currentProjectId.value)
    : (currentPageId.value
      ? buildPageFlowKey(currentProjectId.value, currentPageId.value)
      : buildProjectFlowKey(currentProjectId.value));

  saveFlowSnapshot(
    contextStoreState.value.flow,
    key,
    requirementFlowStage.value,
    requirementFlowContext.value,
  );
};

const restoreFlowContext = (projectId: string, pageId = '') => {
  const target = restoreFlowSnapshot(contextStoreState.value.flow, projectId, pageId);
  const projectKey = buildProjectFlowKey(projectId);
  const projectSnapshot = contextStoreState.value.flow[projectKey];

  if (target) {
    const mergedContext = {
      ...createEmptyRequirementFlowContext(),
      ...target.context,
    };

    // Critical fix: page-level snapshot may not contain generationProgress,
    // but continue-generation must always come from project-level context.
    const projectGenerationProgress = projectSnapshot?.context?.generationProgress;
    if (!mergedContext.generationProgress && projectGenerationProgress) {
      mergedContext.generationProgress = projectGenerationProgress;
    }

    requirementFlowStage.value = target.stage;
    requirementFlowContext.value = mergedContext;
  } else if (projectSnapshot) {
    requirementFlowStage.value = projectSnapshot.stage;
    requirementFlowContext.value = {
      ...createEmptyRequirementFlowContext(),
      ...projectSnapshot.context,
    };
  } else {
    requirementFlowStage.value = 'idle';
    requirementFlowContext.value = createEmptyRequirementFlowContext();
  }
};

const resetFlowContextToProjectLevel = (projectId: string) => {
  const projectKey = buildProjectFlowKey(projectId);
  const projectSnapshot = contextStoreState.value.flow[projectKey];

  // Prefer strict project snapshot first; fallback to legacy restore behavior for compatibility.
  const snapshot = projectSnapshot || restoreFlowSnapshot(contextStoreState.value.flow, projectId, '');

  if (snapshot) {
    requirementFlowStage.value = snapshot.stage;
    requirementFlowContext.value = {
      ...createEmptyRequirementFlowContext(),
      ...snapshot.context,
    };
  } else {
    requirementFlowStage.value = 'idle';
    requirementFlowContext.value = createEmptyRequirementFlowContext();
  }
};

// AI助手控制
const isAISidebarCollapsed = ref(true); // 默认折叠

// 添加导出相关状态
const showExportDialog = ref(false);
const isExporting = ref(false);

const { notify } = usePrompt();

// 添加打包选项对话框状态
const showPackageOptionsDialog = ref(false);
const isGlobalBlocking = ref(false);
const globalBlockingTitle = ref('Processing...');
const globalBlockingDescription = ref('Please wait while the current operation completes.');

// 控制AI侧边栏的折叠状态
const toggleAISidebar = () => {
  isAISidebarCollapsed.value = !isAISidebarCollapsed.value;
};

// 处理 iframe 加载完成事件
const handleIframeLoad = () => {
  iframeLoaded.value = true;
  
  // 初始化时如果有代码，则编译运行
  if (activePage.value?.content) {
    compileAndRunCode(activePage.value.content);
  }
  
  const frame = getPreviewFrame();
  if (frame?.contentWindow?.webPreviewMethods) {
    // 同步移动端视图状态
    frame.contentWindow.webPreviewMethods.toggleMobileView(isMobileView.value);
  }
};

// 获取 WebPreview 方法（由预览桥接技能提供）
const getWebPreviewMethods = () => getPreviewMethods(getPreviewFrame());

const applyPreviewLinkPlaceholders = async (code: string) => {
  if (!currentProjectId.value || !code) return code;

  const pages = await webProjectStore.getProjectPages(currentProjectId.value);
  const replacementMap = new Map<string, string>();

  pages.forEach((page) => {
    if (!page?.id) return;
    const token = page.linkPlaceholder;
    if (!token) return;
    replacementMap.set(token, `/aiwebdesign/preview?id=${page.id}`);
  });

  if (replacementMap.size === 0) {
    return code;
  }

  let transformed = code;
  replacementMap.forEach((url, token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg = new RegExp(escaped, 'g');
    transformed = transformed.replace(reg, url);
  });

  return transformed;
};

// 统一编译预览调用（由预览桥接技能提供）
const compileAndRunCode = async (code: string) => {
  const previewCode = await applyPreviewLinkPlaceholders(code);
  compilePreviewCode(getPreviewFrame(), previewCode);
};

// 清空预览区域内容，避免切换项目时残留上一个页面
const clearPreviewCode = () => {
  compileAndRunCode('');
};

// 统一流程日志输出（由日志技能提供）
const logFlow = (stage: string, payload?: any) => {
  logFlowStage(stage, payload);
};

// 重置生成状态（停止loading与预览生成态）
const resetGeneratingState = () => {
  logFlow('resetGeneratingState');
  isGenerating.value = false;
  resetPreviewGeneration(getPreviewFrame());
};

// AI处理开始：收到用户消息后进入处理态
const handleGeneratingStart = () => {
  logFlow('handleGeneratingStart');
  console.log("AI处理开始");
  
  // 仅设置统一生成状态，预览遮罩只在最终代码生成阶段开启，避免与问询流程冲突
  isGenerating.value = true;
};



/**
 * 打开下一条结构化确认问题（单题推进）。
 */
const openNextRequirementQuestion = () => {
  logFlow('openNextRequirementQuestion:start', {
    pendingCount: requirementFlowContext.value.pendingQuestions.length,
  });

  if (!aiChatRef.value) {
    logFlow('openNextRequirementQuestion:skip:no-ai-ref');
    return;
  }

  const nextQuestion = requirementFlowContext.value.pendingQuestions[0];
  if (!nextQuestion) {
    logFlow('openNextRequirementQuestion:done');
    resetGeneratingState();
    return;
  }

  logFlow('openNextRequirementQuestion:open', { questionId: nextQuestion.id, type: nextQuestion.type });
  aiChatRef.value.openStructuredQuestion(nextQuestion);
};

/**
 * 处理结构化问答UI回传（澄清问题与方案确认）。
 */
const handleStructuredAnswer = async (payload: { questionId: string; type: 'input' | 'option'; value: string; optionId?: string }) => {
  try {
    logFlow('handleStructuredAnswer:received', {
      stage: requirementFlowStage.value,
      questionId: payload.questionId,
      type: payload.type,
      optionId: payload.optionId,
      value: payload.value,
    });

    const generationDecision = reduceGenerationContinueAnswer(requirementFlowContext.value, {
      questionId: payload.questionId,
      optionId: payload.optionId,
    });

    if (generationDecision.matched) {
      requirementFlowContext.value = generationDecision.nextContext;

      if (generationDecision.action === 'continue') {
        isGenerating.value = true;
        const methods = getWebPreviewMethods();
        if (methods?.generationProgress) methods.generationProgress();
        await generateNextPlannedPage();
        resetGeneratingState();
        return;
      }

      if (generationDecision.action === 'pause') {
        aiChatRef.value?.onAnswerSuccess('Paused. You can continue later in project context.');
        saveCurrentFlowContext('project');
        resetGeneratingState();
        return;
      }

      if (generationDecision.action === 'stop') {
        saveCurrentFlowContext('project');
        aiChatRef.value?.onAnswerSuccess('Remaining page generation has been stopped.');
        resetGeneratingState();
        return;
      }

      return;
    }

    const reduced = reduceStructuredAnswer(
      requirementFlowStage.value,
      requirementFlowContext.value,
      payload,
    );

    requirementFlowStage.value = reduced.nextStage;
    requirementFlowContext.value = reduced.nextContext;
    saveCurrentFlowContext();

    switch (reduced.action.type) {
      case 'plan_confirm_to_page_plan': {
        isGenerating.value = true;
        await generateAndAskForPagePlanConfirm(reduced.action.finalRequirement);
        return;
      }
      case 'plan_redesign': {
        isGenerating.value = true;
        await generateAndAskForPlanConfirm(reduced.action.requirement, true);
        return;
      }
      case 'page_plan_confirm_to_generate': {
        isGenerating.value = true;
        const methods = getWebPreviewMethods();
        if (methods?.generationProgress) methods.generationProgress();
        await firstWebGeneration(reduced.action.finalRequirement);
        return;
      }
      case 'page_plan_redesign': {
        isGenerating.value = true;
        await generateAndAskForPagePlanConfirm(reduced.action.requirement, true);
        return;
      }
      case 'clarification_next_question': {
        openNextRequirementQuestion();
        return;
      }
      case 'clarification_done_to_plan': {
        isGenerating.value = true;
        await generateAndAskForPlanConfirm(reduced.action.finalRequirement);
        return;
      }
      case 'stop': {
        if (reduced.action.message) {
          aiChatRef.value?.addAIMessage(reduced.action.message);
          aiChatRef.value?.onAnswerSuccess('Stopped as requested.');
        }
        resetGeneratingState();
        return;
      }
      case 'noop':
      default:
        return;
    }
  } catch (error: any) {
    console.error('处理结构化回答失败:', error);
    handleGenerationFailure({ error: error.message });
  }
};

// 处理收到的消息
/**
 * 处理AI聊天组件发来的用户消息入口。
 */
const handleMessageReceived = async (result: any) => {
  try {
    logFlow('handleMessageReceived:received', result);
    if (!result.message) {
      throw new Error('Empty request message.');
    }

    const userMessage = String(result.message).trim();
    if (!userMessage) {
      throw new Error('Empty request message.');
    }

    console.log('handleMessageReceived', result);


    // 元素编辑仍保持原流程
    if (currentElementCode.value && currentSourceCode.value) {
      isGenerating.value = true;
      const methods = getWebPreviewMethods();
      if (methods && methods.generationProgress) {
        methods.generationProgress();
      }
      await editWebElement(userMessage);
      return;
    }

    // 页面首次生成改为结构化需求流程
    await runRequirementAnalysisAndPlan(userMessage);
  } catch (error: any) {
    console.error('处理收到的消息失败:', error);
    handleGenerationFailure({ error: error.message });
  }
};

/**
 * 元素编辑入口：调用元素编辑编排器并同步更新预览状态。
 */
const editWebElement = async (message: string) => {
  try {
    const elementRoleKey = currentPageId.value
      ? buildRolePageKey(ROLE_IDS.elementEditor, currentProjectId.value, currentPageId.value)
      : buildRoleProjectKey(ROLE_IDS.elementEditor, currentProjectId.value);
    appendRoleContextEntry(elementRoleKey, `instruction:${message}`);

    const result = await runElementEditFlow({
      message,
      currentPageId: currentPageId.value,
      sourceCode: currentSourceCode.value,
      elementCode: currentElementCode.value,
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    currentSourceCode.value = result.data.updatedCode;

    compileAndRunCode(currentSourceCode.value);

    const methods = getWebPreviewMethods();
    if (methods) {
      methods.toggleInspectMode(false);
      isInspectMode.value = false;

      if (methods.resetGenerationProgress) {
        methods.resetGenerationProgress();
      }
    }

    isGenerating.value = false;

    if (aiChatRef.value) {
      const successMessage = "Element update completed successfully. Please review the preview and continue refining with me.";
      aiChatRef.value.onAnswerSuccess(successMessage);
    }
  } catch (error: any) {
    console.error("修改元素失败:", error);
    handleGenerationFailure({ error: error.message });
  }
};

/**
 * 打开方案确认问题（确认 / 重做 / 停止）。
 */
const askPlanConfirmationQuestion = () => {
  logFlow('askPlanConfirmationQuestion');
  if (!aiChatRef.value) return;

  aiChatRef.value.openStructuredQuestion(buildPlanConfirmationQuestion());
};

const askPagePlanConfirmationQuestion = () => {
  if (!aiChatRef.value) return;

  aiChatRef.value.openStructuredQuestion(buildPagePlanConfirmationQuestion());
};

const askNextPageContinueQuestion = () => {
  if (!aiChatRef.value) return;
  aiChatRef.value.openStructuredQuestion(buildGenerationContinueQuestion());
};

/**
 * 根据确认后的需求生成设计方案，并触发结构化方案确认。
 */
const generateAndAskForPlanConfirm = async (requirement: string, isRedesign = false) => {
  logFlow('generateAndAskForPlanConfirm:start', { isRedesign, requirementPreview: requirement.slice(0, 120) });
  if (!aiChatRef.value) {
    throw new Error("AI助手组件未初始化");
  }

  const roleKey = buildRoleProjectKey(ROLE_IDS.designPlanner, currentProjectId.value);
  appendRoleContextEntry(roleKey, `requirement:${requirement}`);

  const proposal = await runPlanProposal(requirement, isRedesign);

  if (!proposal.ok) {
    throw new Error(proposal.error);
  }

  requirementFlowStage.value = proposal.data.stage;
  requirementFlowContext.value = {
    ...requirementFlowContext.value,
    clarifiedRequirement: requirement,
    draftPlan: proposal.data.draftPlan,
    pendingQuestions: [],
    answeredQuestions: []
  };
  saveCurrentFlowContext();

  aiChatRef.value.addAIMessage(proposal.data.assistantMessage);
  askPlanConfirmationQuestion();
  aiChatRef.value.onAnswerSuccess('Design plan is ready. Please confirm to continue page planning.');
  resetGeneratingState();
};

const generateAndAskForPagePlanConfirm = async (requirement: string, isRedesign = false) => {
  if (!aiChatRef.value) {
    throw new Error('AI assistant is not initialized');
  }

  const roleKey = buildRoleProjectKey(ROLE_IDS.pagePlanner, currentProjectId.value);
  appendRoleContextEntry(roleKey, `requirement:${requirement}`);

  const proposal = await runPagePlanProposal(
    requirement,
    requirementFlowContext.value.draftPlan,
    isRedesign,
  );

  if (!proposal.ok) {
    throw new Error(proposal.error);
  }

  requirementFlowStage.value = proposal.data.stage;
  requirementFlowContext.value = {
    ...requirementFlowContext.value,
    pagePlan: proposal.data.pagePlan,
  };
  saveCurrentFlowContext();

  aiChatRef.value.addAIMessage(proposal.data.assistantMessage);
  askPagePlanConfirmationQuestion();
  aiChatRef.value.onAnswerSuccess('Page plan is ready. Please confirm before generation.');
  resetGeneratingState();
};

/**
 * 运行需求分析：获取“问题列表”并进入逐题确认流程；失败则切换本地兜底问卷。
 */
const runRequirementAnalysisAndPlan = async (userRequirement: string) => {
  logFlow('runRequirementAnalysisAndPlan:start', {
    userRequirementPreview: userRequirement.slice(0, 120),
  });

  if (!aiChatRef.value) {
    throw new Error('AI assistant is not initialized.');
  }

  isGenerating.value = true;

  try {
    const roleKey = buildRoleProjectKey(ROLE_IDS.requirementInterviewer, currentProjectId.value);
    const output = await runRequirementAnalysis(
      userRequirement,
      requirementFlowContext.value,
      logFlow,
      getRoleContextTextByKey(roleKey),
    );

    if (!output.ok) {
      throw new Error(output.error);
    }

    requirementFlowStage.value = output.data.stage;
    requirementFlowContext.value = output.data.context;
    saveCurrentFlowContext();

    if (output.data.assistantMessage) {
      aiChatRef.value.addAIMessage(output.data.assistantMessage);
    }

    if (output.data.stage === 'awaitingClarification') {
      openNextRequirementQuestion();
      aiChatRef.value.onAnswerSuccess('Waiting for structured confirmation list answers.');
      return;
    }

    await generateAndAskForPlanConfirm(output.data.context.clarifiedRequirement || userRequirement);
  } finally {
    logFlow('runRequirementAnalysisAndPlan:finally');
    resetGeneratingState();
  }
};

/**
 * 生成下一个页面，并在每页完成后暂停等待用户确认继续。
 */
const generateNextPlannedPage = async () => {
  if (isAdvancingPlannedPage.value) {
    logFlow('generateNextPlannedPage:skip:already-advancing');
    return;
  }

  isAdvancingPlannedPage.value = true;

  try {
    if (!currentProjectId.value) {
      throw new Error('No active project selected.');
    }

    const progress = requirementFlowContext.value.generationProgress;
    if (!progress) {
      throw new Error('No pending generation context.');
    }

    if (progress.nextIndex >= progress.plannedPages.length) {
      return;
    }

    const targetPage = progress.plannedPages[progress.nextIndex];
    const result = await runSinglePageGeneration({
      requirement: progress.finalRequirement,
      approvedPlan: progress.approvedPlan,
      projectId: currentProjectId.value,
      plannedPages: progress.plannedPages,
      page: targetPage,
      preferredPageId: progress.plannedToPersistedPageIdMap?.[targetPage.id],
      logFlow,
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    const nextProgress = {
      ...progress,
      nextIndex: progress.nextIndex + 1,
      generatedPageIds: [...progress.generatedPageIds, result.data.pageId],
      plannedToPersistedPageIdMap: {
        ...(progress.plannedToPersistedPageIdMap || {}),
        [targetPage.id]: result.data.pageId,
      },
    };

    requirementFlowContext.value = {
      ...requirementFlowContext.value,
      generationProgress: nextProgress,
    };
    saveCurrentFlowContext();

    currentPageId.value = result.data.pageId;
    isProjectContextActive.value = false;
    const loadedPage = await webProjectStore.loadPage(result.data.pageId);
    activePage.value = loadedPage || { id: result.data.pageId, name: result.data.pageName, content: result.data.pageCode };
    currentSourceCode.value = result.data.pageCode;
    pageContent.value = result.data.pageCode;
    compileAndRunCode(result.data.pageCode);

    const latestProject = await webProjectStore.getProject(currentProjectId.value);
    if (latestProject) {
      latestProject.isGenerated = true;
      latestProject.generationRequirement = progress.finalRequirement;
      latestProject.generationPlan = progress.approvedPlan || '';
      latestProject.generationPagePlanJson = requirementFlowContext.value.pagePlan
        ? JSON.stringify(requirementFlowContext.value.pagePlan)
        : '';
      latestProject.generatedAt = Date.now();
      await webProjectStore.updateProject(latestProject);
      currentProject.value = { ...latestProject };
    }

    const methods = getWebPreviewMethods();
    if (methods) {
      methods.toggleInspectMode(false);
      isInspectMode.value = false;
      if (methods.resetGenerationProgress) {
        methods.resetGenerationProgress();
      }
    }

    const generatedCount = nextProgress.generatedPageIds.length;
    const totalCount = nextProgress.plannedPages.length;

    if (nextProgress.nextIndex < totalCount) {
      aiChatRef.value?.addAIMessage(`Page \"${result.data.pageName}\" generated (${generatedCount}/${totalCount}). Please review preview and decide whether to continue.`);
      askNextPageContinueQuestion();
      aiChatRef.value?.onAnswerSuccess('Paused after current page. Waiting for your continue action.');
    } else {
      requirementFlowContext.value = {
        ...requirementFlowContext.value,
        generationProgress: null,
      };
      saveCurrentFlowContext();
      aiChatRef.value?.onAnswerSuccess(`All planned pages generated successfully (${generatedCount}/${totalCount}).`);
    }
  } finally {
    isAdvancingPlannedPage.value = false;
  }
};

/**
 * 首次页面生成入口：初始化多页面进度后仅生成第一页。
 */
const firstWebGeneration = async (message: string) => {
  try {
    if (!currentProjectId.value) {
      throw new Error('No active project selected.');
    }

    const plannedPages = requirementFlowContext.value.pagePlan?.pages || [
      {
        id: 'home',
        name: 'Home',
        slug: '/',
        purpose: 'Primary conversion landing page',
        sectionHints: ['Hero', 'Features', 'FAQ', 'CTA'],
        interactionHints: ['FAQ accordion']
      }
    ];

    const siteRoleKey = buildRoleProjectKey(ROLE_IDS.siteGenerator, currentProjectId.value);
    appendRoleContextEntry(siteRoleKey, `requirement:${message}`);

    requirementFlowContext.value = {
      ...requirementFlowContext.value,
      generationProgress: {
        plannedPages,
        nextIndex: 0,
        generatedPageIds: [],
        finalRequirement: message,
        approvedPlan: requirementFlowContext.value.draftPlan,
        plannedToPersistedPageIdMap: {},
      },
    };
    saveCurrentFlowContext();

    await generateNextPlannedPage();
    // After first-page generation pauses for user confirmation, remove loading overlay.
    resetGeneratingState();
  } catch (error: any) {
    console.error('生成网页失败:', error);
    handleGenerationFailure({ error: error.message });
  }
};

// 处理生成失败
const handleGenerationFailure = ({ error }: { error: any }) => {
  console.error('Generation failed:', error);

  isGenerating.value = false;

  const methods = getWebPreviewMethods();
  if (methods && methods.resetGenerationProgress) {
    methods.resetGenerationProgress();
  }

  // Recover last valid preview code.
  if (currentSourceCode.value) {
    compileAndRunCode(currentSourceCode.value);
  }

  const errorMessage = typeof error === 'string' ? error : (error?.message || 'Unknown error during generation');

  // Recovery policy: if there is pending page-generation progress, keep progress and switch to project context.
  if (hasPendingGeneration.value && currentProjectId.value) {
    isProjectContextActive.value = true;
    activePage.value = null;
    currentPageId.value = '';
    saveCurrentFlowContext('project');

    aiChatRef.value?.addAIMessage(`Generation failed on current page. Progress is preserved. You can continue later from project context. Error: ${errorMessage}`);
    askNextPageContinueQuestion();
  }

  showToast('Generation failed. Please try again.', 'error');
  aiChatRef.value?.onAnswerFail(errorMessage);
};


// 切换元素检查模式
const toggleInspectMode = () => {
  if (!activePage.value) return;

  // 更新状态
  isInspectMode.value = !isInspectMode.value;

  // 设置WebPreview组件的状态
  const methods = getWebPreviewMethods();
  if (methods) {
    methods.toggleInspectMode(isInspectMode.value);
  }
};


// 处理删除页面
const handleDeletePage = (page: any) => {
  // 处理页面删除逻辑
  console.log("删除页面:", page);

  // 如果删除的是当前活动页面，重置活动页面
  if (activePage.value && activePage.value.id === page.id) {
    activePage.value = null;
  }
};

// 处理页面选择事件，获取选择的页面数据（读取时以数据库最新内容为准）
const handleSelectPage = async (data: { pageId: string; page: any; projectId: string; project: any }) => {
  console.log("handleSelectPage", data);
  isProjectContextActive.value = false;

  // 页面切换前先保存当前上下文快照
  saveCurrentFlowContext();

  // 切页面前清理聊天中的结构化问询UI，避免跨页面遗留
  aiChatRef.value?.closeStructuredQuestion?.();

  // 如果iframe尚未加载完成，提示用户并返回
  if (!iframeLoaded.value) {
    showToast('Please wait until the preview editor finishes initializing.', 'error');
    return;
  }

  // 更新页面ID和项目ID
  currentPageId.value = data.pageId;

  // 确保项目ID也被正确设置
  if (data.projectId) {
    currentProjectId.value = data.projectId;
  }

  // 关键修复：优先从数据库加载最新页面内容
  const loadedPage = await webProjectStore.loadPage(data.pageId);
  const finalPage = loadedPage || data.page;

  // 页面切换后加载页面级流程上下文
  restoreFlowContext(currentProjectId.value, data.pageId);

  // 保存当前页面对象
  activePage.value = finalPage;

  // 加载页面内容
  if (finalPage) {
    pageContent.value = finalPage.content || '';

    // 重置移动端和检查模式
    isMobileView.value = false;
    isInspectMode.value = false;
    isGenerating.value = false;

    // 重置元素代码和源代码
    currentElementCode.value = "";
    currentSourceCode.value = finalPage.content || '';

    // 编译并运行代码
    setTimeout(() => {
      console.log("compileAndRunCode(finalPage.content);");
      compileAndRunCode(finalPage.content || '');
    }, 100);

    // 激活AI助手
    if (aiChatRef.value) {
      aiChatRef.value.activate(finalPage.content || '');
      aiChatRef.value.setActive(true);
      // 确保AI侧边栏展开
      isAISidebarCollapsed.value = false;
    }
  } else {
    // 如果没有选择页面，则停用AI组件
    if (aiChatRef.value) {
      aiChatRef.value.setActive(false);
    }
  }
};

// 添加元素选择处理
const handleElementSelected = ({ element, code }: { element: any, code: string }) => {
  console.log("选中元素:", element, code);
  // 如果AI侧边栏折叠状态，则展开
  if (isAISidebarCollapsed.value) {
    isAISidebarCollapsed.value = false;
  }

  // 保存当前选中的元素代码和源代码
  currentElementCode.value = code;
  const methods = getWebPreviewMethods();
  if (methods) {
    currentSourceCode.value = methods.getCurrentCode();
  }

  // 将选择的元素代码传递给AI组件
  if (aiChatRef.value) {
    aiChatRef.value.handleElementCode(code, currentSourceCode.value);
  }
};

// 监听iframe加载状态
watch(
  () => iframeLoaded.value,
  (newVal) => {
    if (newVal && activePage.value && activePage.value.content) {
      compileAndRunCode(activePage.value.content);
    }
  }
);

  // 添加定时器检查iframe是否已加载
  const checkIframeLoaded = () => {
    const frame = getPreviewFrame();
    if (frame?.contentWindow) {
      const methods = getWebPreviewMethods();
      if (methods) {
        console.log("预览iframe已初始化");
        iframeLoaded.value = true;
        return true;
      }
    }
    return false;
  };

const iframeCheckInterval = ref<number | null>(null);

// 组件挂载时
onMounted(() => {
  // 添加对postMessage事件的监听
  window.addEventListener('message', handlePostMessage);

  // 加载流程与角色上下文持久化快照
  contextStoreState.value = loadContextStoreState();
  
  // 初始时若尚未选择项目则未激活，选择项目后会激活
  if (aiChatRef.value) {
    aiChatRef.value.setActive(!!currentProjectId.value);
  }
  
  // 初始检查
  if (!checkIframeLoaded()) {
    // 设置定时器，持续检查iframe是否加载
    iframeCheckInterval.value = window.setInterval(() => {
      if (checkIframeLoaded() && iframeCheckInterval.value !== null) {
        clearInterval(iframeCheckInterval.value);
        iframeCheckInterval.value = null;
      }
    }, 500);
  }
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('message', handlePostMessage);

  // 清理定时器
  if (iframeCheckInterval.value !== null) {
    clearInterval(iframeCheckInterval.value);
    iframeCheckInterval.value = null;
  }
});

// 处理来自WebPreviewPage的消息
const handlePostMessage = (event: MessageEvent) => {
  // 仅处理同源消息，避免外部消息污染
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data && event.data.type === 'element-selected') {
    handleElementSelected(event.data.data);
  }
};

// 当前选中的项目ID
const currentProjectId = ref('');
const currentProject = ref<any>(null);

const isProjectGenerated = computed(() => {
  const project = currentProject.value;
  if (!project) return false;
  if (typeof project.isGenerated === 'boolean') return project.isGenerated;

  // 兼容旧数据：若项目下已存在页面，则视为已生成
  return webProjectStore.state.pages.some((page) => page.projectId === project.id);
});

const hasPendingGeneration = computed(() => hasPendingGenerationProgress(requirementFlowContext.value));

const isInitializingPreview = computed(() => !iframeLoaded.value);

// 统一 UI 锁定状态：初始化中或生成中都视为整体禁用
const isUiLocked = computed(() => isInitializingPreview.value || isGenerating.value);

const toolbarEnabled = computed(() => Boolean(currentProjectId.value) && isProjectGenerated.value && !isUiLocked.value);
const isGenerationLocked = computed(() => Boolean(currentProjectId.value) && !isProjectGenerated.value);

const previewOverlayState = computed<'none' | 'project-locked' | 'project-context' | 'no-page' | 'initializing' | 'generating'>(() => {
  if (isGenerating.value) return 'generating';
  if (isGenerationLocked.value) return 'project-locked';
  if (isInitializingPreview.value) return 'initializing';
  if (isProjectContextActive.value) return 'project-context';
  if (!activePage.value) return 'no-page';
  return 'none';
});

// 当前选中的页面ID
const currentPageId = ref('');

// 当前页面内容
const pageContent = ref('');

// 处理保存请求 - 获取最新代码并保存（数据库落盘入口）
const handleSaveRequest = async () => {
  if (!currentPageId.value) {
    showToast('Save failed: please select a page first.');
    return;
  }
  
  try {
    // 从WebPreview获取最新代码
    const latestCode = getPreviewCurrentCode(getPreviewFrame());
    if (!latestCode) {
      showToast('Save failed: unable to read page content.');
      return;
    }

    if (!latestCode) {
      showToast('Save failed: page content is empty.');
      return;
    }
    
    // 保存前做轻量SFC规范化，保证可再次编译打开
    const normalizedCode = normalizeToSafeSfc(latestCode);

    // 保存到存储
    const success = await webProjectStore.savePage(
      currentPageId.value,
      normalizedCode
    );
    
    if (success) {
      // 更新当前页面内容
      pageContent.value = normalizedCode;

      // 更新源代码
      currentSourceCode.value = normalizedCode;
      
      showToast('Page saved successfully.');
    } else {
      showToast('Save failed: page not found.');
    }
  } catch (error) {
    console.error('保存页面时出错:', error);
    showToast(`Save failed: ${error}`);
  }
};

// 下载单页功能
const handleDownloadPage = () => {
  if (!activePage.value) {
    showToast('Please select a page first.', 'error');
    return;
  }

  // 打开导出设置对话框
  showExportDialog.value = true;
};

// 下载当前预览为PDF
const handleDownloadPDF = async () => {
  if (!activePage.value) {
    showToast('Please select a page first.', 'error');
    return;
  }

  const frame = getPreviewFrame();
  if (!iframeLoaded.value || !frame?.contentWindow?.document) {
    showToast('Preview is not ready yet. Please try again in a moment.', 'warning');
    return;
  }

  try {
    isExporting.value = true;
    startGlobalBlocking('Generating PDF...', 'Please wait while the PDF file is being prepared.');

    const frame = getPreviewFrame();
    const result = await runPdfExportPipeline({
      iframeDocument: frame!.contentWindow!.document,
      fileName: activePage.value?.name || 'web-preview',
    });

    if (!result.ok) {
      throw new Error(`[${result.code}] ${result.error}`);
    }

    showToast('PDF downloaded successfully.');
  } catch (error: any) {
    console.error('PDF下载失败:', error);
    showToast(`PDF download failed: ${error?.message || error}`, 'error');
  } finally {
    isExporting.value = false;
    endGlobalBlocking();
  }
};


/**
 * 单页导出入口：组装上下文并调用 pageExportSkill 执行导出。
 */
const handleExportSettings = async (settings: ExportSettings) => {
  try {
    isExporting.value = true;
    startGlobalBlocking('Exporting page...', 'Please wait while code and assets are being generated.');

    const methods = getWebPreviewMethods();
    if (!methods) {
      showToast('Unable to read page content.', 'error');
      return;
    }

    const sourceCode = methods.getCurrentCode();
    if (!sourceCode) {
      showToast('Page content is empty.', 'error');
      return;
    }

    const aiProcessor = async (prompt: string): Promise<AIProcessResult> => {
      if (!aiChatRef.value) {
        throw new Error('AI助手组件未初始化');
      }
      return await aiChatRef.value.processAIRequest(prompt);
    };

    const result = await runPageExportPipeline({
      settings,
      sourceCode,
      aiProcessor,
      notify: (message, type = 'success') => {
        if (type === 'info') {
          showToast(message, 'success');
        } else {
          showToast(message, type);
        }
      },
    });

    if (!result.ok) {
      throw new Error(result.error || 'Export failed.');
    }
  } catch (error: any) {
    console.error('导出页面时出错:', error);
    showToast(`Export failed: ${error.message || error}`, 'error');
  } finally {
    isExporting.value = false;
    endGlobalBlocking();
  }
};

/**
 * 项目打包入口：仅打开打包对话框。
 *
 * 说明：
 * - 具体校验、构建、下载统一由 packageProject workflow 负责。
 * - 页面层不再维护重复校验逻辑，避免与 workflow 规则漂移。
 */
const handlePackageProject = () => {
  if (!currentProjectId.value) {
    showToast('Please select a project first.', 'warning');
    return;
  }

  // 显示打包对话框
  showPackageOptionsDialog.value = true;
};

// 预览功能
const handlePreview = () => {
  if (!currentPageId.value) {
    showToast('Please select a page first.');
    return;
  }

  if (!activePage.value) {
    showToast('Current page not found.');
    return;
  }

  // 使用路由跳转到预览页面，传递页面ID作为查询参数
  const previewUrl = `/aiwebdesign/preview?id=${currentPageId.value}`;
  const previewWindow = window.open(previewUrl, '_blank');

  if (!previewWindow) {
    showToast('Preview popup was blocked by your browser. Please allow popups and try again.', 'warning');
  }
};

// 显示消息提示（统一提示层）
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  notify(message, type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning');
};

const startGlobalBlocking = (title: string, description: string) => {
  globalBlockingTitle.value = title;
  globalBlockingDescription.value = description;
  isGlobalBlocking.value = true;
};

const endGlobalBlocking = () => {
  isGlobalBlocking.value = false;
};

const togglePreviewFullscreen = () => {
  isPreviewFullscreen.value = !isPreviewFullscreen.value;
};

watch(showExportDialog, (visible) => {
  if (!visible) {
    endGlobalBlocking();
  }
});

watch(showPackageOptionsDialog, (visible) => {
  if (!visible) {
    endGlobalBlocking();
  }
});

// 切换移动端视图
const toggleMobileView = () => {
  if (!activePage.value) return;

  // 更新状态
  isMobileView.value = !isMobileView.value;

  // 直接控制iframe的样式
  const iframe = getPreviewFrame();
  if (iframe) {
    if (isMobileView.value) {
      // 移动视图样式
      iframe.style.width = "375px";
      iframe.style.height = "667px";
      iframe.style.margin = "0 auto";
      iframe.style.border = "12px solid #333";
      iframe.style.borderRadius = "24px";
      iframe.style.transition = "all 0.3s ease";
    } else {
      // 恢复默认样式
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.margin = "0";
      iframe.style.border = "none";
      iframe.style.borderRadius = "0";
    }
  }

};

const openCreateProjectFromPlaceholder = () => {
  if (!projectBrowserRef.value || typeof projectBrowserRef.value.handleCreateProject !== 'function') {
    showToast('Project panel is not ready yet.', 'warning');
    return;
  }

  projectBrowserRef.value.handleCreateProject();
};

// 处理选择项目
const handleSelectProjectContext = async (data: { projectId: string, project: any }) => {
  if (!data?.projectId) return;
  if (data.projectId !== currentProjectId.value) return;

  // Persist page-level changes, then force-load project-level flow context.
  saveCurrentFlowContext();

  isProjectContextActive.value = true;
  activePage.value = null;
  currentPageId.value = '';
  pageContent.value = '';
  currentElementCode.value = '';
  currentSourceCode.value = '';
  isInspectMode.value = false;
  isMobileView.value = false;

  clearPreviewCode();
  resetFlowContextToProjectLevel(data.projectId);

  aiChatRef.value?.closeStructuredQuestion?.();
  if (aiChatRef.value) {
    aiChatRef.value.setActive(true);
  }

  // 等待 AIChatComponent 内部对 pageId 变化的 watch 清理完成，再恢复提示与问询
  await nextTick();

  if (hasPendingGeneration.value) {
    const progress = requirementFlowContext.value.generationProgress!;
    const done = progress.generatedPageIds.length;
    const total = progress.plannedPages.length;
    aiChatRef.value?.addAIMessage(`Project context restored. Pending generation: ${done}/${total} completed.`);
    askNextPageContinueQuestion();
  } else {
    aiChatRef.value?.addAIMessage('Project context is active. You can continue requirement discussion or start generation tasks.');
  }
};

const handleSelectProject = async (data: { projectId: string, project: any }) => {
  console.log('[DashBoard] 选择项目:', data);

  // 项目切换前保存旧上下文快照
  saveCurrentFlowContext();

  currentProjectId.value = data.projectId;
  currentProject.value = data.project || null;
  isProjectContextActive.value = false;

  // 切换项目时重置当前编辑上下文
  activePage.value = null;
  currentPageId.value = '';
  pageContent.value = '';
  currentElementCode.value = '';
  currentSourceCode.value = '';
  isInspectMode.value = false;
  isMobileView.value = false;

  // 切项目时清理聊天中的结构化问询UI
  aiChatRef.value?.closeStructuredQuestion?.();

  // 同步清空 iframe 预览内容，防止显示上一个项目页面
  clearPreviewCode();

  // 切项目时加载/重置到项目级流程上下文
  resetFlowContextToProjectLevel(data.projectId);

  // 若项目标记未生成，但已存在页面，则自动修正为已生成并落库
  try {
    const pages = await webProjectStore.getProjectPages(data.projectId);
    const hasPages = pages.length > 0;
    if (currentProject.value && !currentProject.value.isGenerated && hasPages) {
      const repairedProject = {
        ...currentProject.value,
        isGenerated: true,
      };
      const updated = await webProjectStore.updateProject(repairedProject);
      if (updated) {
        currentProject.value = repairedProject;
      }
    }
  } catch (error) {
    console.warn('[DashBoard] 自动修正项目生成状态失败:', error);
  }

  // 切换到项目时始终展开 AI 助手，尤其是空项目首次生成场景
  isAISidebarCollapsed.value = false;

  if (aiChatRef.value) {
    aiChatRef.value.setActive(true);
  }

  showToast(`Project selected: ${data.project.name}`);
};

const handleProjectCleared = () => {
  saveCurrentFlowContext();

  currentProjectId.value = '';
  currentProject.value = null;
  activePage.value = null;
  currentPageId.value = '';
  pageContent.value = '';
  currentElementCode.value = '';
  currentSourceCode.value = '';
  isInspectMode.value = false;
  isMobileView.value = false;
  isGenerating.value = false;
  isProjectContextActive.value = false;
  isAISidebarCollapsed.value = true;

  requirementFlowStage.value = 'idle';
  requirementFlowContext.value = createEmptyRequirementFlowContext();

  clearPreviewCode();

  if (aiChatRef.value) {
    aiChatRef.value.setActive(false);
  }
};
</script>

<style scoped>
.main-content-area
{
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.main-content-area::-webkit-scrollbar {
  display: none;
}

.iframe-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  overflow: hidden;
}

.iframe-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

iframe {
  display: block;
  overflow: hidden;
}

/* AI侧边栏样式 */
.ai-sidebar-panel {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 折叠状态下隐藏内容 */
.ai-sidebar-panel.w-0 {
  padding: 0;
  margin: 0;
  overflow: hidden;
}

/* 加载中动画 */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: rgba(59, 130, 246, 0.8);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
