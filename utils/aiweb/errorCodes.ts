/**
 * 统一错误码定义（前后端共享语义）
 *
 * 命名建议：DOMAIN_ACTION_REASON
 * 示例：AI_CHAT_TIMEOUT / STORAGE_PAGE_SAVE_FAILED
 *
 * 使用建议：
 * 1) code 用于程序分支判断（机器可读）
 * 2) message 用于用户提示或日志说明（人类可读）
 * 3) 前后端统一维护，避免语义漂移
 */
export const ERROR_CODES = {
  /**
   * 未知错误：兜底错误码。
   * 适用于无法归类或异常未携带明确上下文的场景。
   */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  /**
   * 参数/输入校验失败。
   * 例如：必填字段为空、格式非法、业务前置条件不满足。
   */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /**
   * 目标资源不存在。
   * 例如：项目、页面、流程快照不存在或已被删除。
   */
  NOT_FOUND: 'NOT_FOUND',

  /**
   * 通用超时错误。
   * 例如：请求超时、异步任务超时、外部依赖响应过慢。
   */
  TIMEOUT: 'TIMEOUT',

  /**
   * AI Provider 未配置。
   * 例如：未设置模型、API Key、Java 接口地址等必要配置。
   */
  AI_PROVIDER_NOT_CONFIGURED: 'AI_PROVIDER_NOT_CONFIGURED',

  /**
   * AI Provider 请求失败。
   * 例如：网络错误、网关错误、后端返回非 2xx、鉴权失败。
   */
  AI_PROVIDER_REQUEST_FAILED: 'AI_PROVIDER_REQUEST_FAILED',

  /**
   * AI 聊天调用失败。
   * 例如：模型返回异常、内容为空、SDK 调用抛错。
   */
  AI_CHAT_FAILED: 'AI_CHAT_FAILED',

  /**
   * AI 聊天调用超时。
   * 例如：模型端长时间无响应或超过约定超时阈值。
   */
  AI_CHAT_TIMEOUT: 'AI_CHAT_TIMEOUT',

  /**
   * AI 响应解析失败。
   * 例如：期望 JSON 却返回非法格式，或结构字段缺失。
   */
  AI_RESPONSE_PARSE_FAILED: 'AI_RESPONSE_PARSE_FAILED',

  /**
   * 需求分析流程失败。
   * 例如：需求澄清阶段模型分析失败、问题集生成失败。
   */
  FLOW_REQUIREMENT_ANALYSIS_FAILED: 'FLOW_REQUIREMENT_ANALYSIS_FAILED',

  /**
   * 设计方案提案流程失败。
   * 例如：设计规划文本生成失败、结构化方案构建失败。
   */
  FLOW_PLAN_PROPOSAL_FAILED: 'FLOW_PLAN_PROPOSAL_FAILED',

  /**
   * 页面规划提案流程失败。
   * 例如：多页面规划生成失败、页面结构草案不合法。
   */
  FLOW_PAGE_PLAN_PROPOSAL_FAILED: 'FLOW_PAGE_PLAN_PROPOSAL_FAILED',

  /**
   * 站点/页面生成流程失败。
   * 例如：页面生成重试后仍失败、落库前后处理失败。
   */
  FLOW_SITE_GENERATION_FAILED: 'FLOW_SITE_GENERATION_FAILED',

  /**
   * 存储初始化失败。
   * 例如：IndexedDB 初始化失败、数据库结构异常。
   */
  STORAGE_INIT_FAILED: 'STORAGE_INIT_FAILED',

  /**
   * 项目创建失败。
   * 例如：项目写入数据库失败、主键冲突、事务回滚。
   */
  STORAGE_PROJECT_CREATE_FAILED: 'STORAGE_PROJECT_CREATE_FAILED',

  /**
   * 项目更新失败。
   * 例如：项目记录不存在、更新事务失败。
   */
  STORAGE_PROJECT_UPDATE_FAILED: 'STORAGE_PROJECT_UPDATE_FAILED',

  /**
   * 页面创建失败。
   * 例如：页面对象构建成功但持久化失败。
   */
  STORAGE_PAGE_CREATE_FAILED: 'STORAGE_PAGE_CREATE_FAILED',

  /**
   * 页面保存失败。
   * 例如：页面内容写入失败、关联项目更新时间同步失败。
   */
  STORAGE_PAGE_SAVE_FAILED: 'STORAGE_PAGE_SAVE_FAILED',

  /**
   * 编译失败。
   * 例如：SFC 结构非法、模板/脚本/样式编译错误。
   */
  COMPILE_FAILED: 'COMPILE_FAILED',

  /**
   * 导出失败。
   * 例如：代码转换失败、SEO 注入失败、打包下载失败。
   */
  EXPORT_FAILED: 'EXPORT_FAILED',
} as const;

/**
 * 错误码联合类型。
 * 用于约束 code 字段必须来自 ERROR_CODES。
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
