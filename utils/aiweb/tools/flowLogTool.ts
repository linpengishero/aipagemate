/**
 * 流程日志工具：统一输出业务阶段日志，便于排查卡顿和状态问题。
 */
export const logFlowStage = (stage: string, payload?: any) => {
  if (payload !== undefined) {
    console.log(`[AI-FLOW] ${stage}`, payload);
  } else {
    console.log(`[AI-FLOW] ${stage}`);
  }
};
