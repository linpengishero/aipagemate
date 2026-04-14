import * as Vue from "vue/dist/vue.esm-bundler.js";
import {
  parse,
  compileScript,
  compileTemplate,
  compileStyle,
} from "@vue/compiler-sfc";

const STYLE_TAG_SELECTOR = "style[data-vue-compiler]";

// Prevent generated-page styles from leaking into host app UI.
const FORCE_SCOPED_STYLES_IN_PREVIEW = true;

/**
 * 统一流程日志
 */
const logCompiler = (stage: string, payload?: any) => {
  if (payload !== undefined) {
    console.log(`[SFC-COMPILER] ${stage}`, payload);
  } else {
    console.log(`[SFC-COMPILER] ${stage}`);
  }
};

/**
 * 移除旧样式并注入新样式
 */
const applyStyles = (styles: string[]) => {
  document.querySelectorAll(STYLE_TAG_SELECTOR).forEach((el) => el.remove());

  styles.forEach((styleContent) => {
    const styleEl = document.createElement("style");
    styleEl.textContent = styleContent;
    styleEl.setAttribute("data-vue-compiler", "true");
    document.head.appendChild(styleEl);
  });
};

const compileStylesOnly = (descriptor: any, filename: string, scopeId: string) => {
  descriptor.styles.forEach((styleBlock: any, index: number) => {
    const result = compileStyle({
      id: scopeId,
      filename,
      source: styleBlock.content || "",
      scoped: !!styleBlock.scoped,
    });

    if (result.errors && result.errors.length > 0) {
      console.error("SFC style compile errors:", result.errors);
      throw new Error(`Style compile failed at block #${index + 1}`);
    }
  });
};

/**
 * 将 Vue import 转换为运行时可执行的常量声明
 */
const convertVueImportSpecifiers = (specifiers: string) => {
  return specifiers
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+as\s+/g, ": "))
    .join(", ");
};

/**
 * 处理编译产物中的 import：
 * - vue import 转为 const 解构
 * - 外部 import 注释掉（当前预览沙箱不支持外部模块加载）
 */
const sanitizeImports = (code: string) => {
  let output = code;

  output = output.replace(
    /^import\s+\{([\s\S]*?)\}\s+from\s+['"]vue['"];?$/gm,
    (_, specifiers) => `const { ${convertVueImportSpecifiers(specifiers)} } = Vue;`
  );

  output = output.replace(
    /^import\s+[^\n]+from\s+['"][^'"]+['"];?$/gm,
    (line) => `// ${line} (external import is not supported in preview sandbox)`
  );

  return output;
};

/**
 * 将 script 代码转换为可执行并返回组件对象
 */
const buildComponentFromScript = (scriptCode: string) => {
  const sanitized = sanitizeImports(scriptCode)
    .replace(/export\s+default/g, "return")
    .replace(/export\s+\{[\s\S]*?\};?$/gm, "");

  try {
    const fn = new Function(
      "Vue",
      `
      const { defineComponent } = Vue;
      ${sanitized}
      `
    );

    const component = fn(Vue);
    return component || {};
  } catch (error: any) {
    console.error("SFC script execution error:", error);
    throw new Error(`Script execution failed: ${error?.message || error}`);
  }
};

/**
 * 将 template 编译代码转换为 render 函数
 */
const buildRenderFromTemplateCode = (templateCode: string) => {
  const sanitized = sanitizeImports(templateCode)
    .replace(/export\s+function\s+render/g, "function render")
    .replace(/export\s+const\s+/g, "const ");

  try {
    const fn = new Function(
      "Vue",
      `
      ${sanitized}
      return render;
      `
    );

    return fn(Vue);
  } catch (error: any) {
    console.error("SFC template execution error:", error);
    throw new Error(`Template render build failed: ${error?.message || error}`);
  }
};

/**
 * 编译并收集 style 文本（支持 scoped）
 */
const compileStyles = (descriptor: any, filename: string, scopeId: string) => {
  const compiled: string[] = [];

  descriptor.styles.forEach((styleBlock: any, index: number) => {
    const result = compileStyle({
      id: scopeId,
      filename,
      source: styleBlock.content || "",
      scoped: !!styleBlock.scoped,
    });

    if (result.errors && result.errors.length > 0) {
      console.error("SFC style compile errors:", result.errors);
      throw new Error(`Style compile failed at block #${index + 1}`);
    }

    compiled.push(result.code || "");
  });

  return compiled;
};

/**
 * 使用官方 @vue/compiler-sfc 完整编译 SFC
 */
export const compileSourceCode = async (sourceCode: string, options?: { injectStyles?: boolean }) => {
  const filename = "runtime-preview.vue";
  const injectStyles = options?.injectStyles !== false;
  const scopeIdRaw = "runtime-preview";
  const scopeId = `data-v-${scopeIdRaw}`;

  const { descriptor, errors: parseErrors } = parse(sourceCode, { filename });
  if (parseErrors && parseErrors.length > 0) {
    console.error("SFC parse errors:", parseErrors);
    throw new Error("SFC parse failed");
  }

  if (!descriptor.template) {
    throw new Error("组件必须包含<template>部分");
  }

  const hasScopedStyle = FORCE_SCOPED_STYLES_IN_PREVIEW || descriptor.styles.some((style: any) => !!style.scoped);

  logCompiler("parse-success", {
    hasScript: !!descriptor.script,
    hasScriptSetup: !!descriptor.scriptSetup,
    styleBlocks: descriptor.styles.length,
    hasScopedStyle,
  });

  const hasScriptBlock = !!descriptor.script || !!descriptor.scriptSetup;

  const scriptResult = hasScriptBlock
    ? compileScript(descriptor, {
      id: scopeIdRaw,
      inlineTemplate: false,
    })
    : null;

  const templateResult = compileTemplate({
    id: scopeIdRaw,
    filename,
    source: descriptor.template.content,
    scoped: hasScopedStyle,
    compilerOptions: {
      mode: "module",
    },
  });

  if (templateResult.errors && templateResult.errors.length > 0) {
    console.error("SFC template compile errors:", templateResult.errors);
    throw new Error("Template compile failed");
  }

  const render = buildRenderFromTemplateCode(templateResult.code);
  const componentOptions = scriptResult
    ? buildComponentFromScript(scriptResult.content)
    : {};

  if (hasScopedStyle) {
    (componentOptions as any).__scopeId = scopeId;
  }

  componentOptions.render = render;

  if (injectStyles) {
    const styles = compileStyles(descriptor, filename, scopeId);
    applyStyles(styles);
  } else {
    compileStylesOnly(descriptor, filename, scopeId);
  }

  logCompiler("compile-success", {
    stylesInjected: injectStyles ? descriptor.styles.length : 0,
    hasRender: !!componentOptions.render,
  });

  return componentOptions;
};
