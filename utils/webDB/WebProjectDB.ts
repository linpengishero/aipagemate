/**
 * @file WebProjectDB.ts
 * @description IndexedDB 数据库连接和操作管理层
 * 
 * 这是整个存储系统的最底层，负责：
 * 1. 管理 IndexedDB 数据库连接（单例模式）
 * 2. 提供基础的 CRUD 操作
 * 3. 处理事务和错误
 * 
 * 依赖关系：只依赖于 types.ts，不依赖任何上层业务逻辑
 */

import type { WebProject, WebPage } from './types';

// 重新导出类型定义，方便其他文件统一从 WebProjectDB.ts 导入
export type { WebProject, WebPage };

// ==========================
// 数据库配置常量
// ==========================
const DB_NAME = 'ai_web_project_db'; // 数据库名称
const DB_VERSION = 3; // 数据库版本号（修改数据结构时需要递增）
const PROJECTS_STORE = 'projects'; // 项目存储对象名称
const PAGES_STORE = 'pages'; // 页面存储对象名称

/**
 * IndexedDB 连接管理器 - 单例模式
 * 
 * 职责：
 * 1. 管理唯一的数据库连接实例
 * 2. 处理连接的初始化和升级
 * 3. 提供连接的获取、关闭、重置功能
 * 4. 防止重复初始化和并发初始化冲突
 * 
 * 设计模式：单例模式（确保整个应用只有一个数据库连接）
 */
class IndexedDBManager {
  /** 单例实例 */
  private static instance: IndexedDBManager;
  
  /** 当前数据库连接 */
  private db: IDBDatabase | null = null;
  
  /** 是否正在初始化中（防止重复初始化） */
  private isInitializing = false;
  
  /** 初始化 Promise（用于等待并发请求） */
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * 私有构造函数
   * 防止外部直接实例化，必须通过 getInstance() 获取单例
   */
  private constructor() {}

  /**
   * 获取单例实例
   * @returns IndexedDBManager 单例实例
   */
  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  /**
   * 获取数据库连接（单例连接）
   * 
   * 核心逻辑：
   * 1. 如果已有连接，直接返回
   * 2. 如果正在初始化，返回等待中的 Promise
   * 3. 否则，开始初始化并缓存 Promise
   * 
   * @returns Promise<IDBDatabase> 数据库连接
   */
  public async getConnection(): Promise<IDBDatabase> {
    // 情况 1：已有连接，直接返回
    if (this.db) {
      return this.db;
    }

    // 情况 2：正在初始化中，返回等待中的 Promise（避免重复初始化）
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // 情况 3：开始初始化
    this.isInitializing = true;
    this.initPromise = this.openDatabase();
    
    try {
      this.db = await this.initPromise;
      this.isInitializing = false;
      this.initPromise = null;
      return this.db;
    } catch (error) {
      // 初始化失败，清理状态并抛出错误
      this.isInitializing = false;
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * 打开数据库连接（内部方法）
   * 
   * 处理流程：
   * 1. 调用 indexedDB.open() 打开数据库
   * 2. 处理打开成功/失败事件
   * 3. 处理数据库升级事件（创建存储对象和索引）
   * 
   * @returns Promise<IDBDatabase> 数据库连接
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      console.log('[IndexedDBManager] 正在打开数据库:', DB_NAME, DB_VERSION);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // 错误处理：数据库打开失败
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error('[IndexedDBManager] 数据库打开失败:', error);
        reject(new Error(`数据库打开失败：${error?.message || '未知错误'}`));
      };
      
      // 成功处理：数据库打开成功
      request.onsuccess = () => {
        console.log('[IndexedDBManager] 数据库打开成功');
        resolve(request.result);
      };
      
      // 升级处理：数据库版本变化或首次创建
      request.onupgradeneeded = (event) => {
        console.log('[IndexedDBManager] 数据库升级中...');
        const db = request.result;
        
        try {
          // 创建项目存储对象（如果不存在）
          if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
            console.log('[IndexedDBManager] 创建项目存储:', PROJECTS_STORE);
            const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
            // 创建索引用于查询
            projectStore.createIndex('name', 'name', { unique: false });
            projectStore.createIndex('createdAt', 'createdAt', { unique: false });
            projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          
          // 创建页面存储对象（如果不存在）
          if (!db.objectStoreNames.contains(PAGES_STORE)) {
            console.log('[IndexedDBManager] 创建页面存储:', PAGES_STORE);
            const pageStore = db.createObjectStore(PAGES_STORE, { keyPath: 'id' });
            // 创建索引用于查询
            pageStore.createIndex('projectId', 'projectId', { unique: false });
            pageStore.createIndex('name', 'name', { unique: false });
            pageStore.createIndex('createdAt', 'createdAt', { unique: false });
            pageStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            pageStore.createIndex('isPublic', 'isPublic', { unique: false });
          }
        } catch (error) {
          console.error('[IndexedDBManager] 创建存储对象失败:', error);
          throw error;
        }
      };
    });
  }

  /**
   * 关闭数据库连接
   * 
   * 使用场景：
   * 1. 重置数据库前
   * 2. 应用卸载时（可选）
   * 
   * 注意：关闭后再次调用 getConnection() 会重新打开连接
   */
  public closeConnection(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[IndexedDBManager] 数据库连接已关闭');
    }
  }

  /**
   * 重置数据库（删除并重新创建）
   * 
   * 使用场景：
   * 1. 数据库结构损坏
   * 2. 需要清空所有数据
   * 3. 版本升级不兼容
   * 
   * @returns Promise<void>
   */
  public async resetDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[IndexedDBManager] 正在重置数据库...');
      
      // 先关闭现有连接
      this.closeConnection();
      
      // 删除数据库
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      // 错误处理：删除失败
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error('[IndexedDBManager] 删除数据库失败:', error);
        reject(new Error(`删除数据库失败：${error?.message || '未知错误'}`));
      };
      
      // 成功处理：删除成功
      request.onsuccess = () => {
        console.log('[IndexedDBManager] 数据库删除成功，准备重新初始化');
        resolve();
      };
    });
  }

  /**
   * 检查数据库连接是否有效
   * @returns boolean 连接是否有效
   */
  public isConnectionValid(): boolean {
    return this.db !== null && !this.db.closed;
  }
}

/**
 * 数据库操作管理器 - 单例模式
 * 
 * 职责：
 * 1. 提供所有数据库 CRUD 操作
 * 2. 封装事务处理逻辑
 * 3. 统一错误处理
 * 
 * 设计模式：
 * - 单例模式：确保所有操作使用同一个数据库连接
 * - 事务模式：所有操作都在事务中执行，保证数据一致性
 */
class DatabaseOperationManager {
  /** 单例实例 */
  private static instance: DatabaseOperationManager;
  
  /** 数据库连接管理器实例 */
  private dbManager: IndexedDBManager;

  /**
   * 私有构造函数
   * 初始化时获取数据库连接管理器实例
   */
  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
  }

  /**
   * 获取单例实例
   * @returns DatabaseOperationManager 单例实例
   */
  public static getInstance(): DatabaseOperationManager {
    if (!DatabaseOperationManager.instance) {
      DatabaseOperationManager.instance = new DatabaseOperationManager();
    }
    return DatabaseOperationManager.instance;
  }

  /**
   * 执行只读事务（内部方法）
   * 
   * 封装只读操作的通用逻辑：
   * 1. 获取数据库连接
   * 2. 创建只读事务
   * 3. 执行操作并返回结果
   * 4. 处理事务错误
   * 
   * @template T 操作返回类型
   * @param storeNames 需要访问的存储对象名称数组
   * @param operation 具体的操作函数
   * @returns Promise<T> 操作结果
   */
  private async executeReadTransaction<T>(
    storeNames: string[],
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    console.log('[DatabaseOperationManager] executeReadTransaction 开始 - stores:', storeNames);
    
    try {
      // 获取数据库连接
      const db = await this.dbManager.getConnection();
      console.log('[DatabaseOperationManager] executeReadTransaction - 数据库连接获取成功');
      
      // 创建只读事务
      const transaction = db.transaction(storeNames, 'readonly');
      console.log('[DatabaseOperationManager] executeReadTransaction - 事务创建成功');
      
      // 执行操作并返回结果
      const result = await new Promise<T>((resolve, reject) => {
        operation(transaction)
          .then(resolve)
          .catch(reject);
        
        // 事务错误处理
        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error('[DatabaseOperationManager] executeReadTransaction - 事务错误:', error);
          reject(new Error(`事务执行失败：${error?.message || '未知错误'}`));
        };
        
        transaction.oncomplete = () => {
          console.log('[DatabaseOperationManager] executeReadTransaction - 事务完成');
        };
      });
      
      console.log('[DatabaseOperationManager] executeReadTransaction - 返回结果');
      return result;
    } catch (error) {
      console.error('[DatabaseOperationManager] executeReadTransaction - 异常:', error);
      throw error;
    }
  }

  /**
   * 执行读写事务（内部方法）
   * 
   * 封装读写操作的通用逻辑：
   * 1. 获取数据库连接
   * 2. 创建读写事务
   * 3. 执行多个操作
   * 4. 等待事务完成后返回结果
   * 5. 处理事务错误
   * 
   * 关键特性：
   * - 支持在同一个事务中执行多个操作
   * - 所有操作要么全部成功，要么全部失败（原子性）
   * - 避免嵌套异步操作导致的时序问题
   * 
   * @template T 操作返回类型
   * @param storeNames 需要访问的存储对象名称数组
   * @param operation 具体的操作函数（可以包含多个操作）
   * @returns Promise<T> 操作结果
   */
  private async executeWriteTransaction<T>(
    storeNames: string[],
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    console.log('[DatabaseOperationManager] executeWriteTransaction 开始 - stores:', storeNames);
    
    try {
      // 获取数据库连接
      const db = await this.dbManager.getConnection();
      console.log('[DatabaseOperationManager] executeWriteTransaction - 数据库连接获取成功');
      
      // 创建读写事务
      const transaction = db.transaction(storeNames, 'readwrite');
      console.log('[DatabaseOperationManager] executeWriteTransaction - 事务创建成功');
      
      // 执行操作并处理结果
      return new Promise<T>((resolve, reject) => {
        let result: T;
        let operationCompleted = false;
        
        // 执行具体的业务操作
        operation(transaction)
          .then(opResult => {
            console.log('[DatabaseOperationManager] executeWriteTransaction - 操作执行成功，等待事务完成');
            result = opResult;
            operationCompleted = true;
          })
          .catch(error => {
            console.error('[DatabaseOperationManager] executeWriteTransaction - 操作执行失败:', error);
            reject(error);
          });
        
        // 事务完成时返回结果
        transaction.oncomplete = () => {
          console.log('[DatabaseOperationManager] executeWriteTransaction - 事务完成，返回结果');
          if (operationCompleted) {
            resolve(result);
          }
        };
        
        // 事务错误处理
        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error('[DatabaseOperationManager] executeWriteTransaction - 事务错误:', error);
          reject(new Error(`事务执行失败：${error?.message || '未知错误'}`));
        };
        
        transaction.onabort = (event) => {
          console.error('[DatabaseOperationManager] executeWriteTransaction - 事务中止:', event);
          reject(new Error('事务中止'));
        };
      });
    } catch (error) {
      console.error('[DatabaseOperationManager] executeWriteTransaction - 异常:', error);
      throw error;
    }
  }

  // ==========================
  // 项目相关操作方法
  // ==========================

  /**
   * 获取所有项目
   * 
   * @returns Promise<WebProject[]> 项目数组
   */
  public async getProjects(): Promise<WebProject[]> {
    return this.executeReadTransaction([PROJECTS_STORE], async (transaction) => {
      const store = transaction.objectStore(PROJECTS_STORE);
      return new Promise<WebProject[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 获取单个项目
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebProject | null> 项目对象，不存在则返回 null
   */
  public async getProject(projectId: string): Promise<WebProject | null> {
    return this.executeReadTransaction([PROJECTS_STORE], async (transaction) => {
      const store = transaction.objectStore(PROJECTS_STORE);
      return new Promise<WebProject | null>((resolve, reject) => {
        const request = store.get(projectId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 创建新项目
   * 
   * @param project 项目对象（必须包含 id）
   * @returns Promise<WebProject> 创建成功的项目对象
   */
  public async createProject(project: WebProject): Promise<WebProject> {
    return this.executeWriteTransaction([PROJECTS_STORE], async (transaction) => {
      const store = transaction.objectStore(PROJECTS_STORE);
      return new Promise<WebProject>((resolve, reject) => {
        const request = store.add(project);
        request.onsuccess = () => resolve(project);
        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          reject(new Error(`添加项目失败：${error?.message || '未知错误'}`));
        };
      });
    });
  }

  /**
   * 更新项目
   * 
   * @param project 项目对象（必须包含 id）
   * @returns Promise<boolean> 是否更新成功
   */
  public async updateProject(project: WebProject): Promise<boolean> {
    return this.executeWriteTransaction([PROJECTS_STORE], async (transaction) => {
      const store = transaction.objectStore(PROJECTS_STORE);
      return new Promise<boolean>((resolve, reject) => {
        const request = store.put(project);
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 删除项目（同时删除项目下的所有页面）
   * 
   * 处理流程：
   * 1. 删除项目
   * 2. 遍历并删除项目关联的所有页面
   * 
   * @param projectId 项目 ID
   * @returns Promise<boolean> 是否删除成功
   */
  public async deleteProject(projectId: string): Promise<boolean> {
    return this.executeWriteTransaction([PROJECTS_STORE, PAGES_STORE], async (transaction) => {
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      const pageStore = transaction.objectStore(PAGES_STORE);
      
      return new Promise<boolean>((resolve, reject) => {
        // 删除项目
        projectStore.delete(projectId);
        
        // 删除项目下的所有页面
        const index = pageStore.index('projectId');
        const request = index.openCursor(IDBKeyRange.only(projectId));
        
        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            pageStore.delete(cursor.value.id);
            cursor.continue();
          }
        };
        
        // 注意：不在这里设置 transaction.oncomplete
        // executeWriteTransaction 会处理事务完成后的逻辑
        resolve(true);
        transaction.onerror = (event) => reject(event);
      });
    });
  }

  // ==========================
  // 页面相关操作方法
  // ==========================

  /**
   * 获取项目下的所有页面
   * 
   * 使用 projectId 索引查询，提高效率
   * 
   * @param projectId 项目 ID
   * @returns Promise<WebPage[]> 页面对象数组
   */
  public async getPagesByProject(projectId: string): Promise<WebPage[]> {
    return this.executeReadTransaction([PAGES_STORE], async (transaction) => {
      const store = transaction.objectStore(PAGES_STORE);
      const index = store.index('projectId');
      return new Promise<WebPage[]>((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.only(projectId));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 获取所有页面
   * 
   * @returns Promise<WebPage[]> 页面对象数组
   */
  public async getAllPages(): Promise<WebPage[]> {
    return this.executeReadTransaction([PAGES_STORE], async (transaction) => {
      const store = transaction.objectStore(PAGES_STORE);
      return new Promise<WebPage[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 获取单个页面
   * 
   * @param pageId 页面 ID
   * @returns Promise<WebPage | null> 页面对象，不存在则返回 null
   */
  public async getPage(pageId: string): Promise<WebPage | null> {
    return this.executeReadTransaction([PAGES_STORE], async (transaction) => {
      const store = transaction.objectStore(PAGES_STORE);
      return new Promise<WebPage | null>((resolve, reject) => {
        const request = store.get(pageId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 创建新页面（同时更新项目的 updatedAt）
   * 
   * 事务操作：
   * 1. 添加页面
   * 2. 更新项目的 updatedAt 时间戳
   * 
   * 两个操作在同一个事务中，保证数据一致性
   * 
   * @param page 页面对象（必须包含 id 和 projectId）
   * @param project 关联的项目对象
   * @returns Promise<WebPage> 创建成功的页面对象
   */
  public async createPage(page: WebPage, project: WebProject): Promise<WebPage> {
    console.log('[WebProjectDB] createPage 开始执行');
    console.log('[WebProjectDB] createPage - page:', page);
    console.log('[WebProjectDB] createPage - project:', project);
    
    try {
      const result = await this.executeWriteTransaction([PAGES_STORE, PROJECTS_STORE], async (transaction) => {
        console.log('[WebProjectDB] createPage - 事务创建成功');
        const pageStore = transaction.objectStore(PAGES_STORE);
        const projectStore = transaction.objectStore(PROJECTS_STORE);
        
        return new Promise<WebPage>((resolve, reject) => {
          console.log('[WebProjectDB] createPage - 准备添加页面，pageId:', page.id);
          const pageRequest = pageStore.add(page);
          
          pageRequest.onsuccess = () => {
            console.log('[WebProjectDB] createPage - 页面添加成功');
          };
          
          pageRequest.onerror = (event) => {
            console.error('[WebProjectDB] createPage - 页面添加失败', event);
            reject(new Error(`添加页面失败：${(event.target as IDBRequest).error?.message}`));
          };
          
          console.log('[WebProjectDB] createPage - 准备更新项目时间戳，projectId:', project.id);
          project.updatedAt = Date.now();
          const projectRequest = projectStore.put(project);
          
          projectRequest.onsuccess = () => {
            console.log('[WebProjectDB] createPage - 项目时间戳更新成功');
          };
          
          projectRequest.onerror = (event) => {
            console.error('[WebProjectDB] createPage - 项目时间戳更新失败', event);
            reject(new Error(`更新项目失败：${(event.target as IDBRequest).error?.message}`));
          };
          
          console.log('[WebProjectDB] createPage - 操作完成，等待事务提交');
          // 注意：不在这里设置 transaction.oncomplete
          // executeWriteTransaction 会处理事务完成后的逻辑
          resolve(page);
        });
      });
      
      console.log('[WebProjectDB] createPage - 执行完成，返回:', result);
      return result;
    } catch (error) {
      console.error('[WebProjectDB] createPage - 执行异常:', error);
      throw error;
    }
  }

  /**
   * 保存页面内容（同时更新项目的 updatedAt）
   * 
   * 事务操作：
   * 1. 更新页面内容
   * 2. 更新项目的 updatedAt 时间戳
   * 
   * 关键修复：
   * - 所有操作在同一个事务中完成
   * - 没有嵌套异步操作
   * - 事务完成后才返回成功
   * 
   * @param page 页面对象（包含更新后的 content）
   * @param project 关联的项目对象
   * @returns Promise<boolean> 是否保存成功
   */
  public async savePage(page: WebPage, project: WebProject): Promise<boolean> {
    console.log('[WebProjectDB] savePage 开始执行');
    console.log('[WebProjectDB] savePage - page:', page);
    console.log('[WebProjectDB] savePage - project:', project);
    
    try {
      const result = await this.executeWriteTransaction([PAGES_STORE, PROJECTS_STORE], async (transaction) => {
        console.log('[WebProjectDB] savePage - 事务创建成功');
        const pageStore = transaction.objectStore(PAGES_STORE);
        const projectStore = transaction.objectStore(PROJECTS_STORE);
        
        return new Promise<boolean>((resolve, reject) => {
          console.log('[WebProjectDB] savePage - 准备更新页面，pageId:', page.id);
          const pageRequest = pageStore.put(page);
          
          pageRequest.onsuccess = () => {
            console.log('[WebProjectDB] savePage - 页面更新成功');
          };
          
          pageRequest.onerror = (event) => {
            console.error('[WebProjectDB] savePage - 页面更新失败', event);
            reject(new Error(`更新页面失败：${(event.target as IDBRequest).error?.message}`));
          };
          
          console.log('[WebProjectDB] savePage - 准备更新项目时间戳，projectId:', project.id);
          project.updatedAt = Date.now();
          const projectRequest = projectStore.put(project);
          
          projectRequest.onsuccess = () => {
            console.log('[WebProjectDB] savePage - 项目时间戳更新成功');
          };
          
          projectRequest.onerror = (event) => {
            console.error('[WebProjectDB] savePage - 项目时间戳更新失败', event);
            reject(new Error(`更新项目失败：${(event.target as IDBRequest).error?.message}`));
          };
          
          console.log('[WebProjectDB] savePage - 操作完成，等待事务提交');
          // 注意：不在这里设置 transaction.oncomplete
          // executeWriteTransaction 会处理事务完成后的逻辑
          resolve(true);
        });
      });
      
      console.log('[WebProjectDB] savePage - 执行完成，返回:', result);
      return result;
    } catch (error) {
      console.error('[WebProjectDB] savePage - 执行异常:', error);
      throw error;
    }
  }

  /**
   * 更新页面（同时更新项目的 updatedAt）
   * 
   * 与 savePage 的区别：
   * - savePage 主要用于更新 content
   * - updatePage 可以更新页面的任何字段
   * 
   * @param page 页面对象（包含更新后的数据）
   * @param project 关联的项目对象
   * @returns Promise<boolean> 是否更新成功
   */
  public async updatePage(page: WebPage, project: WebProject): Promise<boolean> {
    return this.executeWriteTransaction([PAGES_STORE, PROJECTS_STORE], async (transaction) => {
      const pageStore = transaction.objectStore(PAGES_STORE);
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      
      return new Promise<boolean>((resolve, reject) => {
        // 更新页面
        pageStore.put(page);
        
        // 更新项目的 updatedAt
        project.updatedAt = Date.now();
        projectStore.put(project);
        
        // 注意：不在这里设置 transaction.oncomplete
        // executeWriteTransaction 会处理事务完成后的逻辑
        resolve(true);
        transaction.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 删除页面（同时更新项目的 updatedAt）
   * 
   * 事务操作：
   * 1. 删除页面
   * 2. 更新项目的 updatedAt 时间戳
   * 
   * @param pageId 页面 ID
   * @param project 关联的项目对象
   * @returns Promise<boolean> 是否删除成功
   */
  public async deletePage(pageId: string, project: WebProject): Promise<boolean> {
    return this.executeWriteTransaction([PAGES_STORE, PROJECTS_STORE], async (transaction) => {
      const pageStore = transaction.objectStore(PAGES_STORE);
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      
      return new Promise<boolean>((resolve, reject) => {
        // 删除页面
        pageStore.delete(pageId);
        
        // 更新项目的 updatedAt
        project.updatedAt = Date.now();
        projectStore.put(project);
        
        // 注意：不在这里设置 transaction.oncomplete
        // executeWriteTransaction 会处理事务完成后的逻辑
        resolve(true);
        transaction.onerror = (event) => reject(event);
      });
    });
  }

  /**
   * 清空所有数据（项目和页面）
   * 
   * 使用场景：
   * - 用户主动清空数据
   * - 重置应用状态
   * 
   * @returns Promise<void>
   */
  public async clearAll(): Promise<void> {
    return this.executeWriteTransaction([PROJECTS_STORE, PAGES_STORE], async (transaction) => {
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      const pageStore = transaction.objectStore(PAGES_STORE);
      
      return new Promise<void>((resolve, reject) => {
        // 清空项目存储
        projectStore.clear();
        // 清空页面存储
        pageStore.clear();
        
        // 注意：不在这里设置 transaction.oncomplete
        // executeWriteTransaction 会处理事务完成后的逻辑
        resolve();
        transaction.onerror = (event) => reject(event);
      });
    });
  }
}

// 导出两个管理类供外部使用
export { IndexedDBManager, DatabaseOperationManager };
