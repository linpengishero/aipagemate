<template>
  <div
    class="page-browser h-full flex flex-col"
    :class="props.isBusy ? 'opacity-60 pointer-events-none select-none' : ''"
  >
    <div class="flex justify-between items-center mb-2 px-3 pt-2">
      <div>
        <h2 class="text-sm font-medium text-gray-300">
          <span v-if="!currentProjectId">My Projects</span>
          <span v-else class="flex items-center">
            <button @click="backToProjects" class="mr-1 text-gray-400 hover:text-gray-300">
              <Icon icon="mdi:chevron-left" class="h-4 w-4" />
            </button>
            {{ currentProject?.name || 'Project' }}
          </span>
        </h2>
        <p class="text-xs text-gray-500">
          <span v-if="!currentProjectId">{{ projects.length }} projects</span>
          <span v-else>{{ pages.length }} pages</span>
        </p>
      </div>
      <button 
        v-if="!currentProjectId"
        @click="handleCreateProject" 
        class="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-md transition-all duration-200 shadow-sm shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!props.allowCreateProject"
      >
        <Icon icon="mdi:folder-plus" class="mr-1 text-xs" />
        New Project
      </button>
      <button 
        v-else
        @click="handleCreatePage" 
        class="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-md transition-all duration-200 shadow-sm shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!props.allowCreatePage"
      >
        <Icon icon="mdi:file-plus" class="mr-1 text-xs" />
        New Page
      </button>
    </div>

    
    <!-- 项目列表 -->
    <div v-if="!currentProjectId" class="space-y-2 flex-grow overflow-y-auto px-3 pb-3 custom-scrollbar">
      <div v-if="projects.length === 0" class="text-center py-6 bg-gray-800/20 rounded-lg border border-gray-700/30">
        <Icon icon="mdi:folder-outline" class="h-8 w-8 mx-auto text-gray-500 mb-2" />
        <p class="text-gray-400 text-sm">No projects yet</p>
        <p class="text-gray-500 text-xs mt-1">Click "New Project" to get started</p>
      </div>
      
      <div 
        v-for="project in projects" 
        :key="project.id"
        class="bg-gray-900/50 hover:bg-gray-800/70 rounded-lg p-2 cursor-pointer transition-all border border-gray-700/30 hover:border-gray-600 group"
        @click="selectProject(project)"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start flex-grow">
            <div class="w-6 h-6 flex-shrink-0 bg-gray-800 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:folder-outline" class="h-3 w-3 text-blue-400" />
            </div>
            <div class="ml-2 flex-grow overflow-hidden">
              <h3 class="text-white text-xs font-medium truncate">{{ project.name }}</h3>
              <p class="text-gray-400 text-xs line-clamp-1 mt-0.5">{{ project.description || 'No description' }}</p>
            </div>
          </div>
          <button 
            @click="deleteProject(project.id, $event)"
            class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-500 hover:bg-gray-800/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!props.allowDeleteProject"
          >
            <Icon icon="mdi:delete-outline" class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- 页面列表 -->
    <div
      v-else
      class="space-y-2 flex-grow overflow-y-auto px-3 pb-3 custom-scrollbar"
      @click.self="selectProjectContext"
    >
      <div v-if="pages.length === 0" class="text-center py-6 bg-gray-800/20 rounded-lg border border-gray-700/30">
        <Icon icon="mdi:file-document-outline" class="h-8 w-8 mx-auto text-gray-500 mb-2" />
        <p class="text-gray-400 text-sm">No pages yet</p>
        <p class="text-gray-500 text-xs mt-1">Click "New Page" to get started</p>
      </div>
      
      <div 
        v-for="page in pages" 
        :key="page.id"
        class="bg-gray-900/50 hover:bg-gray-800/70 rounded-lg p-2 cursor-pointer transition-all border border-gray-700/30 hover:border-gray-600 group"
        @click="selectPage(page)"
        :class="{ 'border-blue-500/50 bg-gray-800/70': currentPageId === page.id }"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start flex-grow">
            <div class="w-6 h-6 flex-shrink-0 bg-gray-800 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:file-document-outline" class="h-3 w-3 text-blue-400" />
            </div>
            <div class="ml-2 flex-grow overflow-hidden">
              <h3 class="text-white text-xs font-medium truncate">{{ page.name }}</h3>
              <p class="text-gray-400 text-xs line-clamp-1 mt-0.5">{{ page.title || 'No description' }}</p>
            </div>
          </div>
          <button 
            @click="deletePage(page.id, $event)"
            class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-500 hover:bg-gray-800/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!props.allowDeletePage"
          >
            <Icon icon="mdi:delete-outline" class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Create Project对话框 -->
  <Teleport to="body">
    <div v-if="showCreateProjectDialog" class="dialog-overlay">
      <div class="dialog-content bg-gray-800 p-6 border border-gray-700/50 rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-medium">Create New Project</h3>
          <button @click="closeCreateProjectDialog" class="text-gray-400 hover:text-white transition-colors">
            <Icon icon="mdi:close" class="h-5 w-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 mb-2 text-sm">Project Name</label>
            <input 
              v-model="newProjectData.name" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50"
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label class="block text-gray-300 mb-2 text-sm">Project Description</label>
            <textarea 
              v-model="newProjectData.description" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50 min-h-[80px]"
              placeholder="Briefly describe this project"
            ></textarea>
          </div>
          
          <div class="flex space-x-3 mt-6">
            <button 
              @click="closeCreateProjectDialog" 
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="createProject" 
              class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
  
  <!-- Create Page对话框 -->
  <Teleport to="body">
    <div v-if="showCreatePageDialog" class="dialog-overlay">
      <div class="dialog-content bg-gray-800 p-6 border border-gray-700/50 rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-medium">Create New Page</h3>
          <button @click="closeCreatePageDialog" class="text-gray-400 hover:text-white transition-colors">
            <Icon icon="mdi:close" class="h-5 w-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 mb-2 text-sm">Page Name</label>
            <input 
              v-model="newPageData.name" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50"
              placeholder="Enter page name"
            />
          </div>
          
          <div>
            <label class="block text-gray-300 mb-2 text-sm">Page Description</label>
            <textarea 
              v-model="newPageData.description" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50 min-h-[80px]"
              placeholder="Briefly describe this page"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-gray-300 mb-2 text-sm">Page Template</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div 
                class="border border-gray-700/30 rounded-lg p-3 cursor-pointer transition-all hover:border-blue-500/50 relative"
                :class="{'border-blue-500 bg-blue-900/10': newPageData.template === 'blank'}"
                @click="newPageData.template = 'blank'"
              >
                <div class="flex items-center">
                  <Icon icon="mdi:file-outline" class="h-4 w-4 text-gray-300 mr-2" />
                  <span class="text-gray-300 text-sm">Blank Page</span>
                  <Icon v-if="newPageData.template === 'blank'" icon="mdi:check-circle" class="h-4 w-4 text-blue-500 ml-auto" />
                </div>
                <p class="text-gray-500 text-xs mt-1">Start from a blank page</p>
              </div>
              
              <div 
                class="border border-gray-700/30 rounded-lg p-3 cursor-pointer transition-all hover:border-blue-500/50 relative"
                :class="{'border-blue-500 bg-blue-900/10': newPageData.template === 'demo'}"
                @click="newPageData.template = 'demo'"
              >
                <div class="flex items-center">
                  <Icon icon="mdi:file-document-outline" class="h-4 w-4 text-gray-300 mr-2" />
                  <span class="text-gray-300 text-sm">Demo Template</span>
                  <Icon v-if="newPageData.template === 'demo'" icon="mdi:check-circle" class="h-4 w-4 text-blue-500 ml-auto" />
                </div>
                <p class="text-gray-500 text-xs mt-1">Includes styles and basic structure</p>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3 mt-6">
            <button 
              @click="closeCreatePageDialog" 
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              @click="createPage" 
              class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-colors"
            >
              创建页面
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref, onMounted } from 'vue';
import webProjectStore from '../../../utils/webDB/WebProjectStorage';
import type { WebPage, WebProject } from '../../../utils/webDB/WebProjectStorage';
import { usePrompt } from '~/composables/usePrompt';

const props = withDefaults(defineProps<{
  allowCreateProject?: boolean;
  allowCreatePage?: boolean;
  allowDeleteProject?: boolean;
  allowDeletePage?: boolean;
  isBusy?: boolean;
}>(), {
  allowCreateProject: true,
  allowCreatePage: true,
  allowDeleteProject: true,
  allowDeletePage: true,
  isBusy: false,
});

// 本地存储键
const CURRENT_PROJECT_KEY = 'current_project_id';
const { notify, confirm } = usePrompt();

// 使用项目存储
const projects = ref<WebProject[]>([]);
const pages = ref<WebPage[]>([]);
const currentProjectId = ref('');
const currentProject = ref<WebProject | null>(null);
const currentPageId = ref('');
const showCreatePageDialog = ref(false);
const showCreateProjectDialog = ref(false);

const newPageData = ref({
  name: '',
  description: '',
  template: 'blank'
});

const newProjectData = ref({
  name: '',
  description: ''
});

// 初始化时加载数据
onMounted(async () => {
  try {
    console.log('[ProjectBrowser] 开始初始化组件');
    
    // 诊断存储状态
    console.log('[ProjectBrowser] 诊断存储状态');
    const diagnosis = await webProjectStore.diagnoseStorage();
    if (!diagnosis.available) {
      displayMessage(`存储不可用: ${diagnosis.message}`, 'error');
      console.error('[ProjectBrowser] 存储诊断失败:', diagnosis);
      return;
    } else {
      console.log('[ProjectBrowser] 存储诊断成功:', diagnosis);
    }
    
    // 初始化存储
    console.log('[ProjectBrowser] 初始化存储');
    await webProjectStore.initialize();
    
    // 检查初始化是否有错误
    if (webProjectStore.state.initError) {
      displayMessage(`数据库初始化失败: ${webProjectStore.state.initError.message}`, 'error');
      console.error('[ProjectBrowser] 数据库初始化失败:', webProjectStore.state.initError);
      return;
    }
  
    // 加载项目列表
    console.log('[ProjectBrowser] 加载项目列表');
    await loadProjects();
    
    // 从localStorage中读取上次选择的项目ID
    const savedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedProjectId) {
      console.log('[ProjectBrowser] 发现保存的项目ID:', savedProjectId);
      const project = projects.value.find(p => p.id === savedProjectId);
      if (project) {
        console.log('[ProjectBrowser] 找到保存的项目，正在选择');
        await selectProject(project);
      } else {
        console.log('[ProjectBrowser] 未找到保存的项目');
      }
    }
    
    console.log('[ProjectBrowser] 初始化完成');
  } catch (error) {
    console.error('[ProjectBrowser] 初始化时出错:', error);
    displayMessage(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
  }
});

// 加载项目列表
const loadProjects = async () => {
  try {
    console.log('[ProjectBrowser] 开始加载项目列表');
    
    // 确保存储已初始化
    if (!webProjectStore.state.initialized) {
      console.log('[ProjectBrowser] 存储未初始化，尝试初始化');
      try {
        await webProjectStore.initialize();
      } catch (initError) {
        console.error('[ProjectBrowser] 初始化项目存储失败:', initError);
        throw new Error(`初始化项目存储失败: ${initError instanceof Error ? initError.message : '未知错误'}`);
      }
    }
    
    try {
      console.log('[ProjectBrowser] 调用WebProjectStore加载项目');
      await webProjectStore.loadProjects();
      projects.value = webProjectStore.state.projects;
      console.log('[ProjectBrowser] 项目加载成功, 总数:', projects.value.length);
    } catch (loadError) {
      console.error('[ProjectBrowser] 从WebProjectStore加载项目失败:', loadError);
      projects.value = [];
      throw new Error(`加载项目列表失败: ${loadError instanceof Error ? loadError.message : '未知错误'}`);
    }
  } catch (error) {
    console.error('[ProjectBrowser] 加载项目失败:', error);
    projects.value = [];
    notify(`加载项目失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
  }
};

// 保存项目ID到本地存储，用于下次自动加载
const saveCurrentProjectId = () => {
  localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId.value);
};

// 从IndexedDB加载页面
const loadPages = async () => {
  if (!currentProjectId.value) return;
  
  try {
    console.log('[ProjectBrowser] 加载页面列表');
    
    // 使用新的API加载项目下的页面
    await webProjectStore.loadProjectPages(currentProjectId.value);
    pages.value = webProjectStore.state.pages;
    
    if (pages.value.length === 0) {
      console.log('[ProjectBrowser] 该项目下没有页面');
    }
  } catch (error) {
    console.error('[ProjectBrowser] 加载页面失败:', error);
    pages.value = [];
    notify('Failed to load pages.', 'error');
  }
};

// 显示消息
const displayMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  notify(message, type);
};

// 打开创建项目对话框
const handleCreateProject = () => {
  if (!props.allowCreateProject) {
    displayMessage('当前阶段不允许创建项目', 'warning');
    return;
  }

  newProjectData.value = {
    name: '',
    description: ''
  };
  
  showCreateProjectDialog.value = true;
};

// 关闭创建项目对话框
const closeCreateProjectDialog = () => {
  showCreateProjectDialog.value = false;
};

// 创建新项目
const createProject = async () => {
  const projectName = newProjectData.value.name.trim();
  if (!projectName) {
    displayMessage('Please enter a project name.', 'error');
    return;
  }
  
  try {
    console.log('[ProjectBrowser] 开始创建项目:', projectName);
    
    // 确保存储已初始化
    if (!webProjectStore.state.initialized) {
      console.log('[ProjectBrowser] 存储未初始化，尝试初始化');
      try {
        await webProjectStore.initialize();
        if (!webProjectStore.state.initialized) {
          console.error('[ProjectBrowser] 初始化后状态仍未更新');
          throw new Error('项目存储初始化失败');
        }
      } catch (initError) {
        console.error('[ProjectBrowser] 初始化项目存储失败:', initError);
        
        // 检查是否为IndexedDB结构错误
        const errorMsg = initError instanceof Error ? initError.message : String(initError);
        if (errorMsg.includes('object stores was not found') || 
            errorMsg.includes('数据库结构') || 
            errorMsg.includes('IndexedDB')) {
          
          // 提示用户并尝试重置
          const shouldResetDb = await confirm({
            title: 'Database structure issue detected',
            message: 'A database structure issue was detected. Resetting will clear existing data. Continue?',
            confirmText: 'Reset Database',
            cancelText: 'Cancel',
            danger: true,
          });

          if (shouldResetDb) {
            try {
              await webProjectStore.resetDatabase();
              await webProjectStore.initialize();
              displayMessage('数据库已重置，请重新创建项目', 'success');
              closeCreateProjectDialog();
              return;
            } catch (resetError) {
              console.error('[ProjectBrowser] 重置数据库失败:', resetError);
              throw new Error(`数据库修复失败: ${resetError instanceof Error ? resetError.message : '未知错误'}`);
            }
          } else {
            displayMessage('已取消重置操作', 'warning');
            closeCreateProjectDialog();
            return;
          }
        }
        
        throw new Error(`初始化项目存储失败: ${errorMsg}`);
      }
    }
    
    console.log('[ProjectBrowser] 调用WebProjectStore创建项目');
    // 使用新API创建项目
    const newProject = await webProjectStore.createProject(
      projectName,
      newProjectData.value.description || ''
    );
    
    if (!newProject) {
      console.error('[ProjectBrowser] 创建项目返回null/undefined');
      throw new Error('创建项目失败: 返回值为空');
    }
    
    console.log('[ProjectBrowser] 项目创建成功:', newProject);
    
    // 刷新项目列表
    await loadProjects();
    
    // 关闭对话框
    closeCreateProjectDialog();
    
    // 选择新创建的项目
    const createdProject = projects.value.find(p => p.id === newProject.id);
    if (createdProject) {
      await selectProject(createdProject);
      displayMessage('Project created successfully.', 'success');
    } else {
      console.error('[ProjectBrowser] 创建的项目未在项目列表中找到');
      throw new Error('创建的项目未加载');
    }
  } catch (error: any) {
    console.error('[ProjectBrowser] 创建项目失败:', error);
    displayMessage(`创建项目失败: ${error.message || '未知错误'}`, 'error');
  }
};

// 选择项目
const selectProject = async (project: WebProject) => {
  currentProjectId.value = project.id;
  currentProject.value = project;
  
  // 保存当前项目ID到localStorage
  saveCurrentProjectId();
  
  // 触发项目选择事件
  emit('project-selected', {
    projectId: project.id,
    project: project
  });
  
  // 加载项目下的页面
  await loadPages();
  
  // 清空当前选中的页面
  currentPageId.value = '';
  
  // 进入项目时默认停留在项目上下文（不自动选中页面）
};

// 返回项目列表
const backToProjects = () => {
  currentProjectId.value = '';
  currentProject.value = null;
  currentPageId.value = '';
  
  // 清除localStorage中的项目选择
  localStorage.removeItem(CURRENT_PROJECT_KEY);

  // 通知父组件已返回项目列表
  emit('project-cleared');
};

// 删除项目
const deleteProject = async (projectId: string, event: Event) => {
  // 阻止事件冒泡
  event.stopPropagation();

  if (!props.allowDeleteProject) {
    displayMessage('当前阶段不允许删除项目', 'warning');
    return;
  }
  
  const shouldDelete = await confirm({
    title: 'Delete Project',
    message: 'This will permanently remove the project and all its pages. This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  });

  if (!shouldDelete) return;

  try {
    // 使用新API删除项目
    const success = await webProjectStore.deleteProject(projectId);
    
    if (success) {
      // 如果删除的是当前选中的项目，返回项目列表
      if (currentProjectId.value === projectId) {
        backToProjects();
      }
      
      // 刷新项目列表
      await loadProjects();
      
      displayMessage('项目删除成功', 'success');
    } else {
      throw new Error('删除项目失败');
    }
  } catch (error) {
    console.error('[ProjectBrowser] 删除项目失败:', error);
    displayMessage('Failed to delete project.', 'error');
  }
};

// 打开创建页面对话框
const handleCreatePage = () => {
  if (!props.allowCreatePage) {
    displayMessage('当前阶段不允许新建页面', 'warning');
    return;
  }

  if (!currentProjectId.value) {
    displayMessage('Please select a project first.', 'warning');
    return;
  }
  
  newPageData.value = {
    name: '',
    description: '',
    template: 'blank'
  };
  
  showCreatePageDialog.value = true;
};

// 关闭创建页面对话框
const closeCreatePageDialog = () => {
  showCreatePageDialog.value = false;
};

// 创建页面模板
const getTemplateCode = (template: string, name: string, description: string) => {
  if (template === 'demo') {
    return `<template>
  <div class="static-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1>${name}</h1>
      <p>${description || '这是一个Vue 3页面'}</p>
    </header>

    <!-- 主要内容区 -->
    <main class="page-content">
      <section class="intro-section">
        <h2>关于我们</h2>
        <p>这里可以放置您的静态内容，如公司介绍、产品描述等。</p>
        <div class="features">
          <div class="feature-item">
            <h3>简单易用</h3>
            <p>无需复杂配置，直接编写HTML内容即可。</p>
          </div>
          <div class="feature-item">
            <h3>响应式设计</h3>
            <p>自动适配各种屏幕尺寸。</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="page-footer">
      <p>&copy; ${new Date().getFullYear()} ${name}. 保留所有权利.</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: '${name.replace(/\s+/g, '')}Page',
  data() {
    return {
      pageTitle: '${name}'
    }
  }
}
<\/script>

<style>
/* 基础样式 */
.static-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
  line-height: 1.6;
}

/* 头部样式 */
.page-header {
  text-align: center;
  padding: 40px 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 15px;
}

/* 内容区样式 */
.intro-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature-item {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
}

/* 页脚样式 */
.page-footer {
  margin-top: 40px;
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  color: #666;
}
</style>`;
  } else {
    // 空白模板
    return `<template>
  <div>
    <h1>${name}</h1>
    <p>${description || '这是一个Vue 3页面'}</p>
  </div>
</template>

<script>
export default {
  name: '${name.replace(/\s+/g, '')}Page'
}
<\/script>

<style>
/* 在这里添加样式 */
</style>`;
  }
};

// 创建新页面
const createPage = async () => {
  if (!currentProjectId.value) {
    displayMessage('请先选择项目', 'error');
    return;
  }
  
  const pageName = newPageData.value.name.trim();
  if (!pageName) {
    displayMessage('请输入页面名称', 'error');
    return;
  }
  
  try {
    // 使用新API创建页面
    const newPage = await webProjectStore.createPage(
      currentProjectId.value,
      pageName,
      newPageData.value.description || pageName
    );
    
    if (newPage) {
      // 生成页面内容并保存
    const pageContent = getTemplateCode(
      newPageData.value.template,
      pageName,
      newPageData.value.description
    );
    
      // 保存页面内容
      await updatePageContent(newPage.id, pageContent);
      
      // 刷新页面列表
      await loadPages();
      
      // 关闭对话框
      closeCreatePageDialog();
      
      // 选择新创建的页面
      const createdPage = pages.value.find(p => p.id === newPage.id);
      if (createdPage) {
        selectPage(createdPage);
      }
      
      displayMessage('页面创建成功', 'success');
    } else {
      throw new Error('创建页面失败');
    }
  } catch (error) {
    console.error('[ProjectBrowser] 创建页面失败:', error);
    displayMessage('创建页面失败', 'error');
  }
};

const selectProjectContext = () => {
  if (!currentProject.value || !currentProjectId.value) return;
  currentPageId.value = '';

  emit('project-context-selected', {
    projectId: currentProjectId.value,
    project: currentProject.value,
  });
};

// 选择页面
const selectPage = async (page: WebPage) => {
  currentPageId.value = page.id;

  // 加载完整页面数据（以数据库中的最新内容为准）
  const loadedPage = await webProjectStore.loadPage(page.id);
  const finalPage = loadedPage || page;

  // 触发页面选择事件
  emit('page-selected', {
    pageId: finalPage.id,
    page: finalPage,
    projectId: currentProjectId.value,
    project: currentProject.value
  });
};

// 不再自动选择首个页面，保持项目上下文与页面上下文可显式切换

// 更新页面内容
const updatePageContent = async (pageId: string, content: string) => {
  try {
    console.log('[ProjectBrowser] 更新页面内容:', pageId);
    
    // 使用新API保存页面内容
    const success = await webProjectStore.savePage(pageId, content);
    
    if (success) {
      // 刷新页面列表以获取最新的updatedAt时间戳
      await loadPages();
      return true;
    } else {
      notify('保存失败：找不到页面', 'error');
      return false;
    }
  } catch (error) {
    console.error('[ProjectBrowser] 更新页面内容失败:', error);
    notify('保存页面失败', 'error');
    return false;
  }
};

// 删除页面
const deletePage = async (pageId: string, event: Event) => {
  // 阻止事件冒泡
  event.stopPropagation();

  if (!props.allowDeletePage) {
    displayMessage('当前阶段不允许删除页面', 'warning');
    return;
  }
  
  const shouldDelete = await confirm({
    title: 'Delete Page',
    message: 'This page will be permanently removed and cannot be recovered.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  });

  if (!shouldDelete) return;

  try {
    // 使用新API删除页面
    const success = await webProjectStore.deletePage(pageId);
    
    if (success) {
      // 刷新页面列表
      await loadPages();
      
      // 如果删除的是当前选中的页面，选择其他页面或清空选择
      if (currentPageId.value === pageId) {
        currentPageId.value = '';
      
      // 如果还有页面，选择第一个
        if (pages.value.length > 0) {
        selectPage(pages.value[0]);
        }
      }
      
      displayMessage('页面删除成功', 'success');
    } else {
      displayMessage('删除页面失败：找不到页面', 'error');
    }
  } catch (error) {
    console.error('[ProjectBrowser] 删除页面失败:', error);
    displayMessage('删除页面失败', 'error');
  }
};

// 定义组件事件和对外暴露的方法
const emit = defineEmits(['page-selected', 'delete-page', 'project-selected', 'project-cleared', 'project-context-selected']);

// 对外暴露的方法
defineExpose({
  updatePageContent,
  handleCreateProject,
});
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(107, 114, 128, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.3);
  border-radius: 3px;
}
</style> 