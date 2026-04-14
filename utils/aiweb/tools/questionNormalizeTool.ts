import type { RequirementQuestion } from "~/utils/aiweb/roles/types";

/**
 * 问题规范化工具：确保所有选项题都包含 Other 自定义项。
 */
export const normalizeQuestionsWithOther = (questions: RequirementQuestion[]): RequirementQuestion[] => {
  return questions.map((q) => {
    if (q.type !== "option") {
      return q;
    }

    const options = Array.isArray(q.options) ? [...q.options] : [];
    const hasOther = options.some((opt) => opt.id === "other");

    if (!hasOther) {
      options.push({ id: "other", label: "Other (custom input)" });
    }

    return {
      ...q,
      options,
    };
  });
};
