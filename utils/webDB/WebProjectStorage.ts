/**
 * @file WebProjectStorage.ts
 * @description 项目和页面存储管理层（业务逻辑层）
 * 
 * 这是整个存储系统的中间层，负责：
 * 1. 调用底层数据库操作（WebProjectDB.ts）
 * 2. 处理业务逻辑（参数验证、数据准备）
 * 3. 提供前端状态管理（Vue 响应式）
 * 4. 保持与原有 API 的完全兼容
 * 
 * 依赖关系：
 * - 依赖于 types.ts（类型定义）
 * - 依赖于 WebProjectDB.ts（数据库操作）
 * - 不依赖任何 UI 组件
 */

import { reactive } from 'vue';
import { DatabaseOperationManager, IndexedDBManager } from './WebProjectDB';
import type { WebProject, WebPage } from './WebProjectDB';
import {
  toCloudProjectDTO,
  toCloudPageDTO,
  toCloudProjectBundleDTO,
  type CloudProjectDTO,
  type CloudPageDTO,
  type CloudProjectBundleDTO,
} from '~/utils/aiweb/dto/cloudDto';

// 重新导出类型定义，保持 API 兼容
export type { WebProject, WebPage };

/**
 * 项目和页面存储管理类
 * 
 * 职责：
 * 1. 封装数据库操作，提供简洁的业务方法
 * 2. 处理参数验证和数据准备
 * 3. 统一错误处理和日志记录
 * 
 * 设计原则：
 * - 保持方法签名与原有 API 完全一致
 * - 所有方法都有完善的错误处理
 * - 不直接管理状态，只负责数据持久化
 */
class WebProjectStorageManager {
  /** 数据库连接管理器实例 */
  private dbManager: IndexedDBManager;
  
  /** 数据库操作管理器实例 */
  private operationManager: DatabaseOperationManager;

  /**
   * 构造函数
   * 初始化时获取两个底层管理器实例
   */
  constructor() {
    this.dbManager = IndexedDBManager.getInstance();
    this.operationManager = DatabaseOperationManager.getInstance();
  }

  /**
   * 重置数据库（删除并重新创建）
   * 
   * 使用场景：
   * - 数据库结构损坏
   * - 需要彻底清空数据
   * 
   * @returns Promise<void>
   */
  public async resetDatabase(): Promise<void> {
    return this.dbManager.resetDatabase();
  }

  // ==========================
  // 项目相关方法
  // ==========================

  /**
   * 获取所有项目
   * 
   * @returns Promise<WebProject[]> 项目数组（失败时返回空数组）
   */
  async getProjects(): Promise<WebProject[]> {
    try {
      return await this.operationManager.getProjects();
    } catch (error) {
      console.error('获取项目异常:', error);
      return [];
    }
  }

  /**
   * 获取单个项目
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebProject | null> 项目对象，不存在或失败时返回 null
   */
  async getProject(projectId: string): Promise<WebProject | null> {
    try {
      return await this.operationManager.getProject(projectId);
    } catch (error) {
      console.error('获取项目异常:', error);
      return null;
    }
  }

  /**
   * 创建新项目
   * 
   * 处理流程：
   * 1. 验证参数（项目名称不能为空）
   * 2. 生成唯一的项目 ID
   * 3. 创建项目对象
   * 4. 调用底层数据库操作
   * 
   * @param projectName 项目名称
   * @param projectDescription 项目描述（可选）
   * @returns Promise<WebProject> 创建成功的项目对象
   * @throws Error 创建失败时抛出异常
   */
  async createProject(projectName: string, projectDescription: string = ''): Promise<WebProject> {
    try {
      console.log('[WebProjectStorage] 开始创建项目:', projectName);
      
      // 参数验证
      if (!projectName || typeof projectName !== 'string') {
        throw new Error('项目名称不能为空');
      }
      
      // 生成唯一 ID（时间戳 + 随机数）
      const projectId = `project_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // 创建项目对象
      const newProject: WebProject = {
        id: projectId,
        name: projectName,
        description: projectDescription,
        isGenerated: false,
        generationRequirement: '',
        generationPlan: '',
        generationPagePlanJson: '',
        generatedAt: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log('[WebProjectStorage] 准备添加项目到 IndexedDB:', newProject);
      
      // 调用底层操作
      const result = await this.operationManager.createProject(newProject);
      console.log('[WebProjectStorage] 项目添加成功:', result.id);
      return result;
    } catch (error: any) {
      console.error('[WebProjectStorage] 创建项目异常:', error);
      throw new Error(`创建项目失败：${error.message || '未知错误'}`);
    }
  }

  /**
   * 更新项目
   * 
   * 自动更新 updatedAt 时间戳
   * 
   * @param project 项目对象（必须包含 id）
   * @returns Promise<boolean> 是否更新成功
   */
  async updateProject(project: WebProject): Promise<boolean> {
    try {
      // 自动更新时间戳
      project.updatedAt = Date.now();
      return await this.operationManager.updateProject(project);
    } catch (error) {
      console.error('更新项目异常:', error);
      return false;
    }
  }

  /**
   * 删除项目（同时删除项目下的所有页面）
   * 
   * @param projectId 项目 ID
   * @returns Promise<boolean> 是否删除成功
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      return await this.operationManager.deleteProject(projectId);
    } catch (error) {
      console.error('删除项目异常:', error);
      return false;
    }
  }

  // ==========================
  // 页面相关方法
  // ==========================

  /**
   * 获取项目下的所有页面
   * 
   * 使用 projectId 索引查询，提高效率
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebPage[]> 页面对象数组（失败时返回空数组）
   */
  async getPagesByProject(projectId: string): Promise<WebPage[]> {
    try {
      return await this.operationManager.getPagesByProject(projectId);
    } catch (error) {
      console.error('获取项目页面异常:', error);
      return [];
    }
  }

  /**
   * 获取所有页面
   * 
   * @returns Promise<WebPage[]> 页面对象数组（失败时返回空数组）
   */
  async getAllPages(): Promise<WebPage[]> {
    try {
      return await this.operationManager.getAllPages();
    } catch (error) {
      console.error('获取所有页面异常:', error);
      return [];
    }
  }

  /**
   * 获取单个页面
   * 
   * @param pageId 页面 ID
   * @returns Promise<WebPage | null> 页面对象，不存在或失败时返回 null
   */
  async getPage(pageId: string): Promise<WebPage | null> {
    try {
      return await this.operationManager.getPage(pageId);
    } catch (error) {
      console.error('获取页面异常:', error);
      return null;
    }
  }

  /**
   * 创建新页面
   * 
   * 处理流程：
   * 1. 验证项目是否存在
   * 2. 生成唯一的页面 ID
   * 3. 创建页面对象
   * 4. 调用底层数据库操作（同时更新项目的 updatedAt）
   * 
   * @param projectId 项目 ID
   * @param pageName 页面名称
   * @param pageTitle 页面标题（可选，默认为页面名称）
   * @returns Promise<WebPage> 创建成功的页面对象
   * @throws Error 创建失败时抛出异常
   */
  async createPage(projectId: string, pageName: string, pageTitle: string = ''): Promise<WebPage> {
    console.log('[WebProjectStorage] createPage 开始执行 - projectId:', projectId, 'pageName:', pageName);
    
    try {
      // 验证项目是否存在
      console.log('[WebProjectStorage] createPage - 准备获取项目');
      const project = await this.getProject(projectId);
      if (!project) {
        console.error('[WebProjectStorage] createPage - 项目不存在');
        throw new Error('项目不存在');
      }
      console.log('[WebProjectStorage] createPage - 项目获取成功:', project);
      
      // 生成唯一 ID
      const pageId = `page_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log('[WebProjectStorage] createPage - 生成页面 ID:', pageId);
      
      // 创建页面对象
      const newPage: WebPage = {
        id: pageId,
        projectId: projectId,
        name: pageName,
        title: pageTitle || pageName,
        content: '',
        isPublic: false,
        linkPlaceholder: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      console.log('[WebProjectStorage] createPage - 创建页面对象:', newPage);
      
      // 调用底层操作（同时更新项目时间戳）
      console.log('[WebProjectStorage] createPage - 调用底层创建方法');
      const result = await this.operationManager.createPage(newPage, project);
      console.log('[WebProjectStorage] createPage - 创建成功:', result);
      
      return result;
    } catch (error: any) {
      console.error('[WebProjectStorage] createPage - 异常:', error);
      console.error('[WebProjectStorage] createPage - 错误信息:', error.message);
      throw new Error(`创建页面失败：${error.message || '未知错误'}`);
    }
  }

  /**
   * 保存页面内容
   * 
   * 处理流程：
   * 1. 获取页面（验证是否存在）
   * 2. 更新页面内容和时间戳
   * 3. 获取关联的项目
   * 4. 调用底层数据库操作（同时更新页面的 updatedAt）
   * 
   * 关键修复：
   * - 所有操作在同一个事务中完成
   * - 没有嵌套异步操作
   * - 事务完成后才返回成功
   * 
   * @param pageId 页面 ID
   * @param content 页面内容
   * @returns Promise<boolean> 是否保存成功
   */
  async savePage(pageId: string, content: string): Promise<boolean> {
    console.log('[WebProjectStorage] savePage 开始执行 - pageId:', pageId);
    console.log('[WebProjectStorage] savePage - content length:', content?.length);
    
    try {
      // 获取页面（验证是否存在）
      console.log('[WebProjectStorage] savePage - 准备获取页面');
      const page = await this.getPage(pageId);
      if (!page) {
        console.error('[WebProjectStorage] savePage - 页面不存在');
        throw new Error('页面不存在');
      }
      console.log('[WebProjectStorage] savePage - 页面获取成功:', page);
      
      // 更新页面内容和时间戳
      console.log('[WebProjectStorage] savePage - 更新页面内容');
      page.content = content;
      page.updatedAt = Date.now();
      
      // 获取关联的项目
      console.log('[WebProjectStorage] savePage - 准备获取项目，projectId:', page.projectId);
      const project = await this.getProject(page.projectId);
      if (!project) {
        console.error('[WebProjectStorage] savePage - 项目不存在');
        throw new Error('项目不存在');
      }
      console.log('[WebProjectStorage] savePage - 项目获取成功:', project);
      
      // 调用底层操作（同时更新项目时间戳）
      console.log('[WebProjectStorage] savePage - 调用底层保存方法');
      const result = await this.operationManager.savePage(page, project);
      console.log('[WebProjectStorage] savePage - 保存结果:', result);
      
      return result;
    } catch (error: any) {
      console.error('[WebProjectStorage] savePage - 异常:', error);
      console.error('[WebProjectStorage] savePage - 错误信息:', error.message);
      console.error('[WebProjectStorage] savePage - 错误堆栈:', error.stack);
      return false;
    }
  }

  /**
   * 更新页面
   * 
   * 与 savePage 的区别：
   * - savePage 主要用于更新 content
   * - updatePage 可以更新页面的任何字段
   * 
   * @param page 页面对象（包含更新后的数据）
   * @returns Promise<boolean> 是否更新成功
   */
  async updatePage(page: WebPage): Promise<boolean> {
    try {
      // 自动更新时间戳
      page.updatedAt = Date.now();
      
      // 获取关联的项目
      const project = await this.getProject(page.projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 调用底层操作（同时更新项目时间戳）
      return await this.operationManager.updatePage(page, project);
    } catch (error) {
      console.error('更新页面异常:', error);
      return false;
    }
  }

  /**
   * 删除页面
   * 
   * 处理流程：
   * 1. 获取页面（验证是否存在，并获取项目 ID）
   * 2. 获取关联的项目
   * 3. 调用底层数据库操作（同时更新项目的 updatedAt）
   * 
   * @param pageId 页面 ID
   * @returns Promise<boolean> 是否删除成功
   */
  async deletePage(pageId: string): Promise<boolean> {
    try {
      // 获取页面（验证是否存在）
      const page = await this.getPage(pageId);
      if (!page) {
        return false; // 页面不存在，视为删除成功
      }
      
      // 获取关联的项目
      const project = await this.getProject(page.projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 调用底层操作（同时更新项目时间戳）
      return await this.operationManager.deletePage(pageId, project);
    } catch (error) {
      console.error('删除页面异常:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   * 
   * @returns Promise<void>
   */
  async clearAll(): Promise<void> {
    try {
      await this.operationManager.clearAll();
    } catch (error) {
      console.error('清空数据异常:', error);
    }
  }
}

/**
 * 前端状态管理和缓存层
 * 
 * 职责：
 * 1. 管理 Vue 响应式状态（projects, pages, currentProject, currentPage）
 * 2. 提供数据加载和缓存逻辑
 * 3. 协调存储管理和前端状态
 * 
 * 设计模式：
 * - 单例模式（通过导出常量实现）
 * - 状态管理模式（类似 Vuex 的简化版）
 */
class WebProjectStore {
  /** 底层存储管理器实例 */
  private storage = new WebProjectStorageManager();
  
  /** 初始化标志（防止重复初始化） */
  private _initializing = false;
  
  /** Vue 响应式状态对象 */
  public state = reactive({
    projects: [] as WebProject[],
    pages: [] as WebPage[],
    currentProject: null as WebProject | null,
    currentPage: null as WebPage | null,
    initialized: false,
    initError: null as Error | null
  });
  
  /**
   * 重置数据库并清空状态
   * 
   * 使用场景：
   * - 数据库结构损坏
   * - 用户主动重置
   * 
   * @returns Promise<void>
   */
  async resetDatabase(): Promise<void> {
    try {
      console.log('[WebProjectStore] 开始重置数据库和状态');
      
      // 清空前端状态
      this.state.projects = [];
      this.state.pages = [];
      this.state.currentProject = null;
      this.state.currentPage = null;
      this.state.initialized = false;
      this.state.initError = null;
      
      // 调用底层存储重置
      await this.storage.resetDatabase();
      console.log('[WebProjectStore] 数据库重置成功');
      
      return;
    } catch (error) {
      console.error('[WebProjectStore] 重置数据库失败:', error);
      throw error;
    }
  }
  
  /**
   * 诊断 IndexedDB 状态
   * 
   * 用于调试和问题排查
   * 
   * @returns Promise<{available: boolean, initialized: boolean, message: string}> 诊断结果
   */
  async diagnoseStorage(): Promise<{available: boolean, initialized: boolean, message: string}> {
    console.log('[WebProjectStore] 开始诊断存储状态');
    
    const result = {
      available: !!window.indexedDB,
      initialized: this.state.initialized,
      message: ''
    };
    
    // 检查 IndexedDB 是否可用
    if (!result.available) {
      result.message = 'IndexedDB 不可用，请检查浏览器设置或使用现代浏览器';
      console.error('[WebProjectStore] ' + result.message);
      return result;
    }
    
    // 测试数据库连接
    try {
      console.log('[WebProjectStore] 测试数据库连接');
      const request = indexedDB.open('diagnostic_test', 1);
      
      await new Promise<void>((resolve) => {
        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          result.message = `IndexedDB 打开失败：${error?.message || '未知错误'}`;
          console.error('[WebProjectStore] ' + result.message);
          result.available = false;
          resolve();
        };
        
        request.onsuccess = () => {
          console.log('[WebProjectStore] 诊断数据库打开成功');
          result.message = '数据库连接正常';
          request.result.close();
          try {
            indexedDB.deleteDatabase('diagnostic_test');
          } catch (e) {
            console.warn('[WebProjectStore] 清理诊断数据库失败，这可能不是问题:', e);
          }
          resolve();
        };
        
        request.onblocked = () => {
          result.message = 'IndexedDB 被锁定，可能有其他标签页正在使用';
          console.warn('[WebProjectStore] ' + result.message);
          resolve();
        };
      });
      
      console.log('[WebProjectStore] 诊断完成:', result);
      return result;
    } catch (error) {
      result.message = `诊断过程出错：${error instanceof Error ? error.message : '未知错误'}`;
      console.error('[WebProjectStore] ' + result.message);
      return result;
    }
  }

  /**
   * 初始化存储
   * 
   * 处理流程：
   * 1. 检查是否已初始化或正在初始化
   * 2. 检查 IndexedDB 是否可用
   * 3. 尝试加载项目列表（测试数据库连接）
   * 4. 如果失败且是数据库结构问题，尝试重置数据库
   * 5. 标记为已初始化
   * 
   * @returns Promise<void>
   * @throws Error 初始化失败时抛出异常
   */
  async initialize() {
    // 防止重复初始化
    if (this.state.initialized || this._initializing) {
      console.log('[WebProjectStore] 已经初始化或正在初始化中，跳过');
      return;
    }
    
    this._initializing = true;
    
    try {
      console.log('[WebProjectStore] 开始初始化存储');
      
      // 检查 IndexedDB 是否可用
      if (!window.indexedDB) {
        console.error('[WebProjectStore] IndexedDB 不可用');
        throw new Error('您的浏览器不支持 IndexedDB，无法初始化存储');
      }
      
      // 测试数据库连接
      console.log('[WebProjectStore] 测试数据库连接');
      try {
        const projects = await this.storage.getProjects();
        console.log('[WebProjectStore] 数据库连接正常，加载了项目数:', projects.length);
        this.state.projects = projects;
      } catch (dbError) {
        console.error('[WebProjectStore] 数据库连接测试失败:', dbError);
        
        // 检查是否为数据库结构问题
        const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
        if (errorMsg.includes('已重置') || errorMsg.includes('object stores was not found')) {
          console.log('[WebProjectStore] 检测到数据库结构问题，尝试重置数据库');
          
          try {
            // 重置数据库
            await this.resetDatabase();
            
            // 重试初始化
            console.log('[WebProjectStore] 数据库已重置，重新尝试初始化');
            const projectsAfterReset = await this.storage.getProjects();
            this.state.projects = projectsAfterReset;
            console.log('[WebProjectStore] 重置后初始化成功');
          } catch (resetError) {
            console.error('[WebProjectStore] 重置数据库后仍然失败:', resetError);
            throw new Error(`数据库重置失败：${resetError instanceof Error ? resetError.message : '未知错误'}`);
          }
        } else {
          throw new Error(`数据库连接失败：${errorMsg}`);
        }
      }
      
      // 标记为已初始化
      console.log('[WebProjectStore] 将状态标记为已初始化');
      this.state.initialized = true;
      this.state.initError = null;
      console.log('[WebProjectStore] 初始化完成');
    } catch (error: any) {
      console.error('[WebProjectStore] 初始化失败:', error);
      this.state.initError = error;
      this.state.initialized = false;
      throw error;
    } finally {
      this._initializing = false;
    }
  }
  
  /**
   * 加载项目列表
   * 
   * 处理流程：
   * 1. 检查 IndexedDB 是否可用
   * 2. 如果未初始化，先初始化
   * 3. 从存储中加载项目列表
   * 4. 更新前端状态
   * 
   * @returns Promise<WebProject[]> 项目列表
   * @throws Error 加载失败时抛出异常
   */
  async loadProjects() {
    try {
      console.log('[WebProjectStore] 开始加载项目列表');
      
      // 检查 IndexedDB 是否可用
      if (!window.indexedDB) {
        console.error('[WebProjectStore] IndexedDB 不可用');
        throw new Error('您的浏览器不支持 IndexedDB，无法加载项目');
      }
      
      // 检查是否已初始化
      if (!this.state.initialized) {
        console.log('[WebProjectStore] 存储未初始化，尝试初始化');
        await this.initialize();
      }
      
      // 从存储加载
      try {
        const projects = await this.storage.getProjects();
        console.log('[WebProjectStore] 成功加载项目列表，总数:', projects.length);
        this.state.projects = projects;
        return projects;
      } catch (loadError) {
        console.error('[WebProjectStore] 存储管理器加载项目失败:', loadError);
        this.state.projects = [];
        throw new Error(`加载项目列表失败：${loadError instanceof Error ? loadError.message : '未知错误'}`);
      }
    } catch (error) {
      console.error('[WebProjectStore] 加载项目列表异常:', error);
      this.state.projects = [];
      throw error;
    }
  }
  
  /**
   * 加载项目下的页面
   * 
   * 处理流程：
   * 1. 从存储加载页面列表
   * 2. 更新前端状态的 pages
   * 3. 加载项目信息
   * 4. 更新前端状态的 currentProject
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebPage[]> 页面列表
   */
  async loadProjectPages(projectId: string) {
    try {
      const pages = await this.storage.getPagesByProject(projectId);
      this.state.pages = pages;
      
      const project = await this.storage.getProject(projectId);
      this.state.currentProject = project;
      
      return pages;
    } catch (error) {
      console.error('加载项目页面失败:', error);
      return [];
    }
  }
  
  /**
   * 加载单个页面
   * 
   * 处理流程：
   * 1. 从存储加载页面
   * 2. 更新前端状态的 currentPage
   * 3. 如果当前项目与页面的项目不一致，加载页面所属项目
   * 
   * @param pageId 页面 ID
   * @returns Promise<WebPage | null> 页面对象
   */
  async loadPage(pageId: string) {
    try {
      const page = await this.storage.getPage(pageId);
      if (page) {
        this.state.currentPage = page;
        
        // 如果需要，加载页面所属项目
        if (!this.state.currentProject || this.state.currentProject.id !== page.projectId) {
          const project = await this.storage.getProject(page.projectId);
          this.state.currentProject = project;
          await this.loadProjectPages(page.projectId);
        }
      }
      return page;
    } catch (error) {
      console.error('加载页面失败:', error);
      return null;
    }
  }
  
  /**
   * 创建新项目
   * 
   * 处理流程：
   * 1. 检查是否已初始化
   * 2. 检查 IndexedDB 是否可用
   * 3. 调用存储管理器创建项目
   * 4. 更新前端状态
   * 5. 验证项目是否真的添加到状态中
   * 
   * @param name 项目名称
   * @param description 项目描述（可选）
   * @returns Promise<WebProject> 创建成功的项目对象
   * @throws Error 创建失败时抛出异常
   */
  async createProject(name: string, description: string = '') {
    try {
      console.log('[WebProjectStore] 开始创建项目:', name);
      
      // 检查是否已初始化
      if (!this.state.initialized) {
        console.log('[WebProjectStore] 存储未初始化，尝试初始化');
        await this.initialize();
        
        if (!this.state.initialized) {
          console.error('[WebProjectStore] 初始化失败，无法创建项目');
          throw new Error('存储管理器未能初始化');
        }
      }
      
      // 检查 IndexedDB 是否可用
      if (!window.indexedDB) {
        console.error('[WebProjectStore] IndexedDB 不可用');
        throw new Error('您的浏览器不支持 IndexedDB，无法创建项目');
      }
      
      // 创建项目
      console.log('[WebProjectStore] 调用存储管理器创建项目');
      const newProject = await this.storage.createProject(name, description);
      
      if (!newProject) {
        console.error('[WebProjectStore] 存储管理器返回 null/undefined 项目');
        throw new Error('存储管理器创建项目失败');
      }
      
      console.log('[WebProjectStore] 项目创建成功，添加到状态:', newProject);
      
      // 更新前端状态
      this.state.projects.push({...newProject});
      this.state.currentProject = {...newProject};
      this.state.pages = [];
      
      // 验证项目是否真的添加到状态中
      const projectExists = this.state.projects.some(p => p.id === newProject.id);
      if (!projectExists) {
        console.error('[WebProjectStore] 项目未能添加到状态中');
        throw new Error('项目创建后未能加载到列表中');
      }
      
      return newProject;
    } catch (error: any) {
      console.error('[WebProjectStore] 创建项目失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新项目
   * 
   * 处理流程：
   * 1. 调用存储管理器更新项目
   * 2. 更新前端状态中的项目
   * 3. 如果是当前项目，同步更新 currentProject
   * 
   * @param project 项目对象
   * @returns Promise<boolean> 是否更新成功
   */
  async updateProject(project: WebProject) {
    try {
      const success = await this.storage.updateProject(project);
      
      if (success) {
        // 更新项目列表中的项目
        const index = this.state.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.state.projects[index] = {...project};
        }
        
        // 如果是当前项目，同步更新
        if (this.state.currentProject && this.state.currentProject.id === project.id) {
          this.state.currentProject = {...project};
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新项目失败:', error);
      return false;
    }
  }
  
  /**
   * 删除项目
   * 
   * 处理流程：
   * 1. 调用存储管理器删除项目
   * 2. 从前端状态中移除项目
   * 3. 如果是当前项目，清空当前项目和页面
   * 
   * @param projectId 项目 ID
   * @returns Promise<boolean> 是否删除成功
   */
  async deleteProject(projectId: string) {
    try {
      const success = await this.storage.deleteProject(projectId);
      
      if (success) {
        // 从项目列表中移除
        this.state.projects = this.state.projects.filter(p => p.id !== projectId);
        
        // 如果是当前项目，清空相关状态
        if (this.state.currentProject && this.state.currentProject.id === projectId) {
          this.state.currentProject = null;
          this.state.currentPage = null;
          this.state.pages = [];
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除项目失败:', error);
      return false;
    }
  }
  
  /**
   * 创建新页面
   * 
   * 处理流程：
   * 1. 调用存储管理器创建页面
   * 2. 更新前端状态的 pages 和 currentPage
   * 3. 重新加载项目列表（更新项目的 updatedAt）
   * 
   * @param projectId 项目 ID
   * @param name 页面名称
   * @param title 页面标题（可选）
   * @returns Promise<WebPage | null> 创建成功的页面对象
   */
  async createPage(projectId: string, name: string, title: string = '') {
    try {
      const newPage = await this.storage.createPage(projectId, name, title);
      
      this.state.pages.push(newPage);
      this.state.currentPage = newPage;
      
      await this.loadProjects();
      
      return newPage;
    } catch (error) {
      console.error('创建页面失败:', error);
      return null;
    }
  }
  
  /**
   * 保存页面内容
   * 
   * 处理流程：
   * 1. 调用存储管理器保存页面
   * 2. 更新前端状态的 currentPage
   * 3. 更新前端状态的 pages 中的时间戳
   * 4. 重新加载项目列表（更新项目的 updatedAt）
   * 
   * @param pageId 页面 ID
   * @param content 页面内容
   * @returns Promise<boolean> 是否保存成功
   */
  async savePage(pageId: string, content: string) {
    console.log('[WebProjectStore] savePage 开始执行 - pageId:', pageId);
    console.log('[WebProjectStore] savePage - content length:', content?.length);
    
    try {
      console.log('[WebProjectStore] savePage - 调用存储管理器');
      const success = await this.storage.savePage(pageId, content);
      console.log('[WebProjectStore] savePage - 存储管理器返回:', success);
      
      if (success) {
        console.log('[WebProjectStore] savePage - 更新前端状态');
        
        // 更新当前页面
        if (this.state.currentPage && this.state.currentPage.id === pageId) {
          console.log('[WebProjectStore] savePage - 更新 currentPage');
          this.state.currentPage = {
            ...this.state.currentPage,
            content,
            updatedAt: Date.now()
          };
        }
        
        // 更新页面列表中的时间戳
        const index = this.state.pages.findIndex(p => p.id === pageId);
        if (index !== -1) {
          console.log('[WebProjectStore] savePage - 更新 pages 列表中的时间戳');
          this.state.pages[index] = {
            ...this.state.pages[index],
            updatedAt: Date.now()
          };
        }
        
        // 更新项目列表
        console.log('[WebProjectStore] savePage - 重新加载项目列表');
        await this.loadProjects();
        console.log('[WebProjectStore] savePage - 项目列表加载完成');
        
        console.log('[WebProjectStore] savePage - 保存成功，返回 true');
        return true;
      }
      
      console.warn('[WebProjectStore] savePage - 存储管理器返回 false');
      return false;
    } catch (error: any) {
      console.error('[WebProjectStore] savePage - 异常:', error);
      console.error('[WebProjectStore] savePage - 错误信息:', error.message);
      console.error('[WebProjectStore] savePage - 错误堆栈:', error.stack);
      return false;
    }
  }
  
  /**
   * 更新页面
   * 
   * 处理流程：
   * 1. 调用存储管理器更新页面
   * 2. 更新前端状态的 pages
   * 3. 如果是当前页面，同步更新 currentPage
   * 4. 重新加载项目列表
   * 
   * @param page 页面对象
   * @returns Promise<boolean> 是否更新成功
   */
  async updatePage(page: WebPage) {
    try {
      const success = await this.storage.updatePage(page);
      
      if (success) {
        // 更新页面列表
        const index = this.state.pages.findIndex(p => p.id === page.id);
        if (index !== -1) {
          this.state.pages[index] = {...page};
        }
        
        // 如果是当前页面，同步更新
        if (this.state.currentPage && this.state.currentPage.id === page.id) {
          this.state.currentPage = {...page};
        }
        
        // 更新项目列表
        await this.loadProjects();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新页面失败:', error);
      return false;
    }
  }
  
  /**
   * 删除页面
   * 
   * 处理流程：
   * 1. 调用存储管理器删除页面
   * 2. 从前端状态的 pages 中移除
   * 3. 如果是当前页面，清空 currentPage
   * 4. 重新加载项目列表
   * 
   * @param pageId 页面 ID
   * @returns Promise<boolean> 是否删除成功
   */
  async deletePage(pageId: string) {
    try {
      const success = await this.storage.deletePage(pageId);
      
      if (success) {
        // 从页面列表中移除
        this.state.pages = this.state.pages.filter(p => p.id !== pageId);
        
        // 如果是当前页面，清空
        if (this.state.currentPage && this.state.currentPage.id === pageId) {
          this.state.currentPage = null;
        }
        
        // 更新项目列表
        await this.loadProjects();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除页面失败:', error);
      return false;
    }
  }
  
  /**
   * 清空所有数据
   * 
   * 处理流程：
   * 1. 调用存储管理器清空数据
   * 2. 重置前端状态
   * 
   * @returns Promise<boolean> 是否清空成功
   */
  async clearAll() {
    try {
      await this.storage.clearAll();
      
      this.state.projects = [];
      this.state.pages = [];
      this.state.currentProject = null;
      this.state.currentPage = null;
      
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  /**
   * 根据 ID 获取项目
   * 
   * 处理流程：
   * 1. 先从前端状态中查找（缓存）
   * 2. 如果状态中没有，从存储中获取
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebProject | null> 项目对象
   */
  async getProject(projectId: string): Promise<WebProject | null> {
    try {
      // 优先从状态中查找（缓存）
      const projectInState = this.state.projects.find(p => p.id === projectId);
      if (projectInState) {
        return projectInState;
      }
      
      // 从存储中获取
      return await this.storage.getProject(projectId);
    } catch (error) {
      console.error('获取项目失败:', error);
      return null;
    }
  }
  
  /**
   * 获取项目下的所有页面
   * 
   * 处理流程：
   * 1. 如果已经加载了该项目的页面，直接返回（缓存）
   * 2. 否则，从存储中获取
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebPage[]> 页面列表
   */
  async getProjectPages(projectId: string): Promise<WebPage[]> {
    try {
      // 检查缓存
      if (
        this.state.currentProject && 
        this.state.currentProject.id === projectId && 
        this.state.pages.length > 0
      ) {
        return this.state.pages;
      }
      
      // 从存储获取
      return await this.storage.getPagesByProject(projectId);
    } catch (error) {
      console.error('获取项目页面失败:', error);
      return [];
    }
  }

  /**
   * 将本地项目映射为云端 DTO。
   */
  async getProjectCloudDTO(projectId: string): Promise<CloudProjectDTO | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;
    return toCloudProjectDTO(project);
  }

  /**
   * 将本地页面列表映射为云端 DTO。
   */
  async getProjectPagesCloudDTO(projectId: string): Promise<CloudPageDTO[]> {
    const pages = await this.getProjectPages(projectId);
    return pages.map(toCloudPageDTO);
  }

  /**
   * 获取项目+页面完整云端 DTO（用于后端同步）。
   */
  async getProjectBundleCloudDTO(projectId: string): Promise<CloudProjectBundleDTO | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const pages = await this.getProjectPages(projectId);
    return toCloudProjectBundleDTO(project, pages);
  }
}

/**
 * 导出单例存储管理器
 * 
 * 使用方式：
 * ```typescript
 * import webProjectStore from './WebProjectStorage';
 * 
 * // 初始化
 * await webProjectStore.initialize();
 * 
 * // 创建项目
 * const project = await webProjectStore.createProject('我的项目');
 * 
 * // 创建页面
 * const page = await webProjectStore.createPage(project.id, '首页');
 * 
 * // 保存页面
 * await webProjectStore.savePage(page.id, '<html>...</html>');
 * 
 * // 获取项目列表
 * const projects = await webProjectStore.getProjects();
 * ```
 */
const webProjectStore = new WebProjectStore();
export default webProjectStore;
