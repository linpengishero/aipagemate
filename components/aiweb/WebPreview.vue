<template>
  <div class="relative w-full h-full">
    <div
      ref="previewContainer"
      class="preview-container h-full overflow-auto"
      :class="[isMobileView ? 'mobile-container' : '']"
    >
  </div>


    <!-- 文本编辑对话框 -->
    <TextEditor
      v-model:show="textEditDialog.show"
      :element="textEditDialog.element"
      :content="textEditDialog.content"
      :style="textEditDialog.style"
      @save="handleTextSave"
    />

    <!-- 图片编辑对话框 -->
    <ImageEditor
      v-model:show="imageEditDialog.show"
      :element="imageEditDialog.element"
      :imageUrl="imageEditDialog.previewUrl"
      :style="imageEditDialog.style"
      @save="handleImageSave"
    />

    <!-- 元素样式编辑对话框 -->
    <ElementEditor
      v-model:show="elementEditDialog.show"
      :element="elementEditDialog.element"
      @save="handleElementStyleSave"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  reactive,
  watch,
  createApp,
  type App,
} from "vue";
import { compileSourceCode } from "@/utils/complier/vueComplier";
import TextEditor from "@/components/aiweb/webedit/TextEditor.vue";
import ImageEditor from "@/components/aiweb/webedit/ImageEditor.vue";
import ElementEditor from "@/components/aiweb/webedit/ElementEditor.vue";
import { emptyPageTemplate } from "@/utils/demoData/emptyPageTemplate";
import {
  WebInspector,
  showToast,
  isTextNodeElement,
  isImageElement,
  resetHighlightState,
  sanitizeInspectorClasses,
  type HighlightInfo,
  extractCodeFromDOM,
  getImageUrl,
  applyImageToElement,
  isLinkElement,
  setLinkAttributes,
  applyStylesToElement,
} from "@/utils/aiweb/tools";

const emit = defineEmits(["element-selected"]);

const error = ref("");
const isCompiling = ref(false);
const previewContainer = ref<HTMLElement | null>(null);
let app: App<Element> | null = null;
// 保存当前运行的源代码
const currentSourceCode = ref("");

// 检查模式状态
const isInspectMode = ref(false);
// 移动端预览模式状态
const isMobileView = ref(false);

const highlightInfo = reactive<HighlightInfo>({
  show: false,
  tagName: "",
  id: "",
  className: "",
  element: null,
});

// 创建Inspector实例
let inspector: WebInspector | null = null;

// 文本编辑对话框
const textEditDialog = reactive({
  show: false,
  content: "",
  element: null as HTMLElement | null,
  style: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "normal",
    fontFamily: "Arial, sans-serif",
  },
});

// 图片编辑对话框
const imageEditDialog = reactive({
  show: false,
  element: null as HTMLElement | null,
  imageUrl: "",
  previewUrl: "",
  originalUrl: "",
  file: null as File | null,
  style: {
    borderRadiusValue: 0,
    borderRadius: "0px",
    opacityValue: 1,
    opacity: "1",
  },
});

// 元素样式编辑对话框
const elementEditDialog = reactive({
  show: false,
  element: null as HTMLElement | null,
});

// 添加选中元素引用
const selectedElement = ref<HTMLElement | null>(null);

// 拖拽状态
const dragState = reactive({
  dragging: false,
  moved: false,
  startMouseX: 0,
  startMouseY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
});

const DRAG_X_ATTR = 'data-aiweb-drag-x';
const DRAG_Y_ATTR = 'data-aiweb-drag-y';
const SCALE_ATTR = 'data-aiweb-scale';
const ROTATE_ATTR = 'data-aiweb-rotate';

const TRANSFORM_SCALE_MIN = 0.2;
const TRANSFORM_SCALE_MAX = 5;

const CONTROL_BTN_SIZE = 18;
const CONTROL_GAP = 4;

const selectionControlsEl = ref<HTMLElement | null>(null);
const transformModeState = reactive({
  mode: '' as '' | 'scale' | 'rotate',
  startMouseX: 0,
  startScale: 1,
  startRotate: 0,
});

const parseInlineTranslate = (transformValue: string) => {
  const matched = transformValue.match(/translate\(\s*(-?\d+(?:\.\d+)?)px\s*,\s*(-?\d+(?:\.\d+)?)px\s*\)/);
  if (!matched) {
    return { x: 0, y: 0 };
  }

  return {
    x: Number(matched[1]) || 0,
    y: Number(matched[2]) || 0,
  };
};

const getElementDragOffset = (element: HTMLElement) => {
  const attrX = Number(element.getAttribute(DRAG_X_ATTR));
  const attrY = Number(element.getAttribute(DRAG_Y_ATTR));

  if (Number.isFinite(attrX) && Number.isFinite(attrY)) {
    return { x: attrX, y: attrY };
  }

  return parseInlineTranslate(element.style.transform || '');
};

const getElementScale = (element: HTMLElement) => {
  const value = Number(element.getAttribute(SCALE_ATTR));
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const getElementRotate = (element: HTMLElement) => {
  const value = Number(element.getAttribute(ROTATE_ATTR));
  return Number.isFinite(value) ? value : 0;
};

const applyElementTransform = (element: HTMLElement, x: number, y: number, scale: number, rotate: number) => {
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  const safeScale = Math.min(TRANSFORM_SCALE_MAX, Math.max(TRANSFORM_SCALE_MIN, scale));
  const safeRotate = Math.round(rotate * 10) / 10;

  element.style.transform = `translate(${roundedX}px, ${roundedY}px) scale(${safeScale}) rotate(${safeRotate}deg)`;
  element.style.transformOrigin = 'center center';

  element.setAttribute(DRAG_X_ATTR, String(roundedX));
  element.setAttribute(DRAG_Y_ATTR, String(roundedY));
  element.setAttribute(SCALE_ATTR, String(safeScale));
  element.setAttribute(ROTATE_ATTR, String(safeRotate));
};

const applyElementDragOffset = (element: HTMLElement, x: number, y: number) => {
  applyElementTransform(element, x, y, getElementScale(element), getElementRotate(element));
};

const getPreviewContentElement = () => {
  return previewContainer.value?.querySelector('.preview-content') as HTMLElement | null;
};

// 切换移动端预览模式
const toggleMobileView = (value?: boolean) => {
  // 允许父组件显式指定状态；未传值时做本地切换
  if (typeof value === 'boolean') {
    isMobileView.value = value;
  } else {
    isMobileView.value = !isMobileView.value;
  }

  // 重新调整预览内容
  nextTick(() => {
    updatePreviewLayout();
  });
};

// 更新预览布局
const updatePreviewLayout = () => {
  if (previewContainer.value) {
    // 通过nextTick确保DOM已更新
    nextTick(() => {
      // 刷新预览容器
      const previewContent = previewContainer.value.querySelector(".preview-content");
      if (previewContent) {
        if (isMobileView.value) {
          previewContent.style.width = "375px";
          previewContent.style.height = "auto";
          previewContent.style.minHeight = "667px";
          previewContent.style.margin = "0 auto";
          previewContent.style.border = "12px solid #333";
          previewContent.style.borderRadius = "24px";
          previewContent.style.overflow = "visible";
          previewContent.style.paddingBottom = "100px"; // 确保底部有足够空间
        } else {
          previewContent.style.width = "100%";
          previewContent.style.height = "auto";
          previewContent.style.minHeight = "100%";
          previewContent.style.margin = "";
          previewContent.style.border = "";
          previewContent.style.borderRadius = "";
          previewContent.style.overflow = "visible";
          previewContent.style.paddingBottom = "100px"; // 确保底部有足够空间
        }
      }

      // 明确设置预览容器为可滚动状态
      if (previewContainer.value) {
        previewContainer.value.style.overflow = "auto";
        previewContainer.value.style.position = "relative";
        previewContainer.value.style.zIndex = "1";
      }
    });
  }
};

// 监听模式变化
watch([isMobileView], () => {
  updatePreviewLayout();
});

// 切换检查模式
const toggleInspectMode = (value?: boolean) => {
  if (typeof value === 'boolean') {
    isInspectMode.value = value;
  }

  const contentEl = getPreviewContentElement();

  if (isInspectMode.value) {
    // 创建Inspector实例
    if (!inspector) {
      inspector = new WebInspector(previewContainer.value, highlightInfo);
    }
    // 进入检查模式
    inspector.activate(handleElementClick, handleElementDblClick);

    // 启用拖拽监听（按住左键可拖动）
    contentEl?.addEventListener('mousedown', handleElementMouseDown, true);
  } else {
    // 退出检查模式
    if (inspector) {
      inspector.deactivate();
      // 清除选中元素的引用
      inspector.selectedElement = null;
    }

    contentEl?.removeEventListener('mousedown', handleElementMouseDown, true);
    endDrag();
    endTransformMode();
    removeSelectionControls();
    resetHighlightState(highlightInfo);
    
    // 移除选中元素的样式
    if (selectedElement.value) {
      selectedElement.value.classList.remove('element-selected');
      selectedElement.value = null;
    }
  }
};

// 统一更新选中元素状态
const updateSelectionControlsPosition = () => {
  if (!selectionControlsEl.value || !selectedElement.value || !previewContainer.value) return;

  const targetRect = selectedElement.value.getBoundingClientRect();
  const containerRect = previewContainer.value.getBoundingClientRect();

  const overlayWidth = CONTROL_BTN_SIZE * 3 + CONTROL_GAP * 2;

  // 紧贴选中框右上角（位于框内，不外飘）
  const left = targetRect.right - containerRect.left + previewContainer.value.scrollLeft - overlayWidth;
  const top = targetRect.top - containerRect.top + previewContainer.value.scrollTop;

  selectionControlsEl.value.style.left = `${left}px`;
  selectionControlsEl.value.style.top = `${top}px`;
};

const removeSelectionControls = () => {
  if (!selectionControlsEl.value) return;
  selectionControlsEl.value.remove();
  selectionControlsEl.value = null;
};

const startTransformMode = (event: MouseEvent, mode: 'scale' | 'rotate') => {
  if (!selectedElement.value) return;

  event.preventDefault();
  event.stopPropagation();

  transformModeState.mode = mode;
  transformModeState.startMouseX = event.clientX;
  transformModeState.startScale = getElementScale(selectedElement.value);
  transformModeState.startRotate = getElementRotate(selectedElement.value);

  window.addEventListener('mousemove', handleTransformMove, true);
  window.addEventListener('mouseup', endTransformMode, true);
};

const handleTransformMove = (event: MouseEvent) => {
  if (!selectedElement.value || !transformModeState.mode) return;

  event.preventDefault();
  event.stopPropagation();

  const offset = getElementDragOffset(selectedElement.value);
  const deltaX = event.clientX - transformModeState.startMouseX;

  if (transformModeState.mode === 'scale') {
    const nextScale = transformModeState.startScale + deltaX * 0.005;
    applyElementTransform(selectedElement.value, offset.x, offset.y, nextScale, getElementRotate(selectedElement.value));
    updateSelectionControlsPosition();
  } else {
    const nextRotate = transformModeState.startRotate + deltaX * 0.8;
    applyElementTransform(selectedElement.value, offset.x, offset.y, getElementScale(selectedElement.value), nextRotate);
    // 旋转时不跟随旋转盒模型变化，保持工具栏稳定
  }
};

const endTransformMode = () => {
  if (!transformModeState.mode) return;

  transformModeState.mode = '';
  window.removeEventListener('mousemove', handleTransformMove, true);
  window.removeEventListener('mouseup', endTransformMode, true);

  if (selectedElement.value) {
    const elementCode = sanitizeInspectorClasses(selectedElement.value.outerHTML);
    emit('element-selected', { element: selectedElement.value, code: elementCode });
    showToast('元素变换已更新');
  }
};

const deleteSelectedElement = (event?: MouseEvent) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!selectedElement.value) return;

  const elementToDelete = selectedElement.value;
  elementToDelete.classList.remove('element-selected');
  elementToDelete.remove();

  selectedElement.value = null;
  if (inspector) {
    inspector.selectedElement = null;
  }

  removeSelectionControls();
  resetHighlightState(highlightInfo);
  emit('element-selected', { element: null, code: '' });
  showToast('元素已删除');
};

const ensureSelectionControls = () => {
  if (!previewContainer.value || !selectedElement.value) return;

  removeSelectionControls();

  const controls = document.createElement('div');
  controls.className = 'selection-controls';

  const scaleBtn = document.createElement('button');
  scaleBtn.type = 'button';
  scaleBtn.className = 'selection-control-btn selection-control-scale';
  scaleBtn.title = '拖动缩放';
  scaleBtn.textContent = '⤢';
  scaleBtn.addEventListener('mousedown', (event) => startTransformMode(event, 'scale'));

  const rotateBtn = document.createElement('button');
  rotateBtn.type = 'button';
  rotateBtn.className = 'selection-control-btn selection-control-rotate';
  rotateBtn.title = '拖动旋转';
  rotateBtn.textContent = '↻';
  rotateBtn.addEventListener('mousedown', (event) => startTransformMode(event, 'rotate'));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'selection-control-btn selection-control-delete';
  deleteBtn.title = '删除元素';
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', deleteSelectedElement, true);
  deleteBtn.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  }, true);

  controls.appendChild(scaleBtn);
  controls.appendChild(rotateBtn);
  controls.appendChild(deleteBtn);
  previewContainer.value.appendChild(controls);
  selectionControlsEl.value = controls;

  updateSelectionControlsPosition();
};

const selectElement = (target: HTMLElement) => {
  if (!target) return;

  // 移除之前选中元素的样式
  if (selectedElement.value) {
    selectedElement.value.classList.remove('element-selected');
  }

  // 设置新的选中元素
  selectedElement.value = target;
  target.classList.add('element-selected');

  // 更新 inspector 的选中元素
  if (inspector) {
    inspector.selectedElement = target;
  }

  ensureSelectionControls();

  const elementCode = sanitizeInspectorClasses(target.outerHTML);
  emit('element-selected', { element: target, code: elementCode });
};

// 元素单击处理函数 - 用于选择元素
const handleElementClick = (event: MouseEvent) => {
  if (!isInspectMode.value) return;

  // 在编辑模式下拦截元素自身点击行为
  event.preventDefault();
  event.stopPropagation();

  const target = event.target as HTMLElement;
  if (!target) return;

  // 忽略预览容器本身
  if (
    target === previewContainer.value ||
    target.classList.contains("preview-content") ||
    target.parentElement === previewContainer.value
  ) {
    return;
  }

  // 仅在未发生拖拽位移时，处理为“点击选中”
  if (!dragState.moved) {
    selectElement(target);
  }
};

const handleDragMove = (event: MouseEvent) => {
  if (!dragState.dragging || !selectedElement.value) return;

  event.preventDefault();
  event.stopPropagation();

  const deltaX = event.clientX - dragState.startMouseX;
  const deltaY = event.clientY - dragState.startMouseY;

  if (!dragState.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
    dragState.moved = true;
  }

  applyElementDragOffset(
    selectedElement.value,
    dragState.startOffsetX + deltaX,
    dragState.startOffsetY + deltaY,
  );
  updateSelectionControlsPosition();
};

const endDrag = () => {
  if (!dragState.dragging) return;

  dragState.dragging = false;

  window.removeEventListener('mousemove', handleDragMove, true);
  window.removeEventListener('mouseup', endDrag, true);
  window.removeEventListener('mouseleave', endDrag, true);

  if (dragState.moved && selectedElement.value) {
    updateSelectionControlsPosition();
    const elementCode = sanitizeInspectorClasses(selectedElement.value.outerHTML);
    emit('element-selected', { element: selectedElement.value, code: elementCode });
    showToast('元素位置已更新');
  }

  dragState.moved = false;
};

const handleElementMouseDown = (event: MouseEvent) => {
  if (!isInspectMode.value || event.button !== 0) return;

  const target = event.target as HTMLElement;
  if (!target) return;

  if (
    target === previewContainer.value ||
    target.classList.contains('preview-content') ||
    target.parentElement === previewContainer.value ||
    target.closest('.selection-controls')
  ) {
    return;
  }

  // 保持与原流程一致：进入拖拽前先选中
  selectElement(target);

  const currentOffset = getElementDragOffset(target);
  dragState.dragging = true;
  dragState.moved = false;
  dragState.startMouseX = event.clientX;
  dragState.startMouseY = event.clientY;
  dragState.startOffsetX = currentOffset.x;
  dragState.startOffsetY = currentOffset.y;

  event.preventDefault();
  event.stopPropagation();

  window.addEventListener('mousemove', handleDragMove, true);
  window.addEventListener('mouseup', endDrag, true);
  window.addEventListener('mouseleave', endDrag, true);
};

// 元素双击处理函数 - 用于编辑元素
const handleElementDblClick = (event: MouseEvent) => {
  if (!isInspectMode.value) return;

  // 阻止默认行为和事件冒泡
  event.preventDefault();
  event.stopPropagation();

  const target = event.target as HTMLElement;
  if (!target) return;

  // 忽略预览容器本身
  if (
    target === previewContainer.value ||
    target.classList.contains("preview-content") ||
    target.parentElement === previewContainer.value
  ) {
    return;
  }

  // 检查是否为可编辑元素类型
  const isTextElement = isTextNodeElement(target);
  const isImageElements = isImageElement(target);

  if (isTextElement) {
    // 显示文本编辑对话框
    showEditTextDialog();
  } else if (isImageElements) {
    // 显示图片编辑对话框
    showEditImageDialog();
  } else {
    // 显示元素样式编辑对话框
    showElementStyleDialog();
  }
};

// 显示文本编辑对话框
const showEditTextDialog = () => {
  if (!highlightInfo.element) return;

  // 获取当前文本内容
  const textContent = highlightInfo.element.textContent || "";

  // 获取当前元素的样式
  const computedStyle = window.getComputedStyle(highlightInfo.element);

  // 设置对话框内容和样式
  textEditDialog.content = textContent;
  textEditDialog.element = highlightInfo.element;
  textEditDialog.style.color = computedStyle.color;
  textEditDialog.style.fontSize = computedStyle.fontSize;
  textEditDialog.style.fontWeight = computedStyle.fontWeight;
  textEditDialog.style.fontFamily = computedStyle.fontFamily || "Arial, sans-serif";

  textEditDialog.show = true;
};

// 处理文本保存
const handleTextSave = (data) => {
  if (!textEditDialog.element) return;

  // 更新元素文本内容
  textEditDialog.element.textContent = data.content;

  // 更新元素样式
  textEditDialog.element.style.color = data.style.color;
  textEditDialog.element.style.fontSize = data.style.fontSize;
  textEditDialog.element.style.fontWeight = data.style.fontWeight;
  textEditDialog.element.style.fontFamily = data.style.fontFamily;

  // 如果是A标签，处理链接属性
  if (isLinkElement(textEditDialog.element) && "href" in data) {
    setLinkAttributes(textEditDialog.element, {
      href: data.href,
      target: data.target,
    });
  }

  // 显示提示
  showToast("文本已更新");

  // 在控制台输出更新后的代码
  setTimeout(() => {
    console.log("用户编辑后的代码:");
    console.log(getCurrentCode());
  }, 100);
};

// 编译Vue组件
const compileAndRun = async (sourceCode: string) => {
  if (isCompiling.value) return;
  // 退出检查模式
  isInspectMode.value = false;
  if (inspector) {
    inspector.deactivate();
  }
  resetHighlightState(highlightInfo);
  
  // 清除选中元素
  selectedElement.value = null;

  try {
    isCompiling.value = true;
    error.value = "";

    // 如果源代码为空，使用演示数据
    if (!sourceCode || !sourceCode.trim()) {
      sourceCode = emptyPageTemplate;
    }

    // 保存当前源代码
    currentSourceCode.value = sourceCode;

    // 清除之前的应用
    unmountApp();
    if (previewContainer.value) {
      previewContainer.value.innerHTML = "";
    }

    const component = await compileSourceCode(sourceCode);
    // 挂载组件
    await mountComponent(component);

    // 应用布局设置
    nextTick(() => {
      updatePreviewLayout();
    });
  } catch (err) {
    console.error("编译错误:", err);
    error.value = err.message || "未知错误";
  } finally {
    isCompiling.value = false;
  }
};

/**
 * 生成中（由外层统一遮罩组件接管，保留空实现兼容调用）
 */
const generationProgress = () => {
  // no-op
};

/**
 * 生成失败（由外层统一遮罩/提示接管，保留空实现兼容调用）
 */
const handleGenerationFailure = (_message: string) => {
  // no-op
};

// 挂载组件
const mountComponent = async (component) => {
  try {
    if (!previewContainer.value) return;

    // 等待DOM更新
    await nextTick();

    // 创建一个div作为根元素
    const el = document.createElement("div");
    el.className = "preview-content";
    previewContainer.value.appendChild(el);

    // 创建并挂载应用
    try {
      // 打印组件选项便于调试
      console.log("组件选项:", JSON.stringify(component, null, 2));

      app = createApp(component);

      // 注册全局错误处理
      app.config.errorHandler = (err, vm, info) => {
        console.error("Vue应用错误:", err, info);
        error.value = `Vue应用错误: ${err.message}`;
      };

      app.mount(el);
      console.log("组件挂载成功");

      // 应用布局设置
      updatePreviewLayout();
    } catch (err) {
      console.error("创建应用错误:", err);
      error.value = `创建应用错误: ${err.message}`;
    }
  } catch (err) {
    console.error("挂载错误:", err);
    throw new Error(`组件挂载失败: ${err.message}`);
  }
};

// 卸载应用
const unmountApp = () => {
  // 停用检查模式
  if (inspector) {
    inspector.deactivate();
  }
  resetHighlightState(highlightInfo);
  
  // 清除选中元素
  selectedElement.value = null;

  if (app) {
    app.unmount();
    app = null;
  }
};

// 组件生命周期
onMounted(() => {
  previewContainer.value?.addEventListener('scroll', updateSelectionControlsPosition, { passive: true });
  window.addEventListener('resize', updateSelectionControlsPosition);
});

onBeforeUnmount(() => {
  // 清理资源
  const contentEl = getPreviewContentElement();
  contentEl?.removeEventListener('mousedown', handleElementMouseDown, true);
  previewContainer.value?.removeEventListener('scroll', updateSelectionControlsPosition);
  window.removeEventListener('resize', updateSelectionControlsPosition);
  endDrag();
  endTransformMode();
  removeSelectionControls();

  if (inspector) {
    inspector.deactivate();
  }
  unmountApp();

  // 移除样式
  document.querySelectorAll("style[data-vue-compiler]").forEach((el) => el.remove());

  // 移除高亮样式
  const highlightStyleEl = document.getElementById("highlight-styles");
  if (highlightStyleEl) {
    highlightStyleEl.remove();
  }
});

// 显示图片编辑对话框
const showEditImageDialog = () => {
  if (!highlightInfo.element) return;

  // 获取图片URL
  const imgSrc = getImageUrl(highlightInfo.element);

  // 获取当前元素的样式
  const computedStyle = window.getComputedStyle(highlightInfo.element);

  // 设置对话框内容和样式
  imageEditDialog.element = highlightInfo.element;
  imageEditDialog.originalUrl = imgSrc;
  imageEditDialog.previewUrl = imgSrc;
  imageEditDialog.imageUrl = imgSrc;
  imageEditDialog.file = null;

  // 提取样式值
  const currentBorderRadius = computedStyle.borderRadius;
  const currentOpacity = computedStyle.opacity;

  // 转换为数值
  let borderRadiusValue = 0;
  if (currentBorderRadius && currentBorderRadius !== "none") {
    borderRadiusValue = parseInt(currentBorderRadius, 10) || 0;
  }

  let opacityValue = 1;
  if (currentOpacity) {
    opacityValue = parseFloat(currentOpacity) || 1;
  }

  // 设置样式值
  imageEditDialog.style.borderRadiusValue = borderRadiusValue;
  imageEditDialog.style.borderRadius = `${borderRadiusValue}px`;
  imageEditDialog.style.opacityValue = opacityValue;
  imageEditDialog.style.opacity = opacityValue.toString();

  // 显示对话框
  imageEditDialog.show = true;
};

// 处理图片保存
const handleImageSave = (data) => {
  if (!imageEditDialog.element) return;

  // 更新图片元素
  applyImageToElement(imageEditDialog.element, data.previewUrl, {
    borderRadius: data.style.borderRadius,
    opacity: data.style.opacity,
    backgroundColor: data.style.backgroundColor,
  });

  // 显示提示
  showToast("图片已更新");

  // 在控制台输出更新后的代码
  setTimeout(() => {
    console.log("用户编辑后的代码:");
    console.log(getCurrentCode());
  }, 100);
};

// 获取当前运行的Vue代码（包含用户编辑后的内容）
const getCurrentCode = () => {
  let code = extractCodeFromDOM(previewContainer.value, currentSourceCode.value);
  return sanitizeInspectorClasses(code);
};


// 显示元素样式编辑对话框
const showElementStyleDialog = () => {
  if (!highlightInfo.element) return;

  // 设置对话框元素
  elementEditDialog.element = highlightInfo.element;
  elementEditDialog.show = true;
};

// 处理元素样式保存
const handleElementStyleSave = (data) => {
  if (!elementEditDialog.element) return;

  // 应用样式到元素
  applyStylesToElement(elementEditDialog.element, data.style);

  // 显示提示
  showToast("元素样式已更新");

  // 在控制台输出更新后的代码
  setTimeout(() => {
    console.log("用户编辑后的代码:");
    console.log(getCurrentCode());
  }, 100);
};

// 清除内容
const clearContent = () => {
  if (isCompiling.value) return;

  removeSelectionControls();
  endTransformMode();

  // 设置空源码，触发使用默认模板
  compileAndRun("");
};

defineExpose({
  generationProgress,
  handleGenerationFailure,
  compileAndRun,
  clearContent,
  getCurrentCode,
  toggleMobileView,
  toggleInspectMode,
  isMobileView,
  isInspectMode,
});
</script>

<style>
.preview-container {
  width: 100%;
  height: 100%;
  overflow: auto !important;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  scroll-behavior: smooth;
  position: relative;
  z-index: 0 !important;
}

.preview-content {
  width: 100%;
  background-color: white;
  min-height: 100%;
  height: auto;
  display: block;
  padding: 0;
  margin: 0;
  /* padding-bottom: 100px; 增加底部填充，确保AI助手展开时内容可见 */
  overflow: visible;
}

.mobile-container .preview-content {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: visible;
  background-color: #fff;
}

/* 隐藏移动端预览中的滚动条 */
.mobile-container .preview-content::-webkit-scrollbar {
  display: none;
}

/* 选中元素的红色虚线边框样式 */
.element-selected {
  outline: 2px dashed #ff3333 !important;
  outline-offset: 2px !important;
  position: relative;
}

.selection-controls {
  position: absolute;
  z-index: 9998;
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

.selection-control-btn {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(17, 24, 39, 0.92);
  color: #fff;
  font-size: 11px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.28);
}

.selection-control-scale,
.selection-control-rotate {
  cursor: ew-resize;
}

.selection-control-delete {
  cursor: pointer;
  color: #fecaca;
}

.selection-control-btn:hover {
  background: rgba(37, 99, 235, 0.95);
}

.selection-control-delete:hover {
  background: rgba(220, 38, 38, 0.95);
  color: #fff;
}
</style>
