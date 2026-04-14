/**
 * 空页面的演示模板
 * 当WebPreview没有源代码时显示的引导页面
 */
export const emptyPageTemplate = `<template>
  <div class="empty-page-container">
    <div class="ai-guide">
      <div class="ai-logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h2v-2h-2v2zm1.61-9.96c-1.2 0-1.61.82-1.61 1.3h-2c0-1.86 1.28-3.29 3.61-3.29 2.35 0 3.39 1.55 3.39 2.92 0 1.35-.68 2.09-1.7 2.82-1.06.73-1.3 1.21-1.3 2.12v.07h-2v-.07c0-1.85.79-2.74 1.95-3.54.59-.39 1.05-.83 1.05-1.41 0-.73-.5-1.01-1.39-1.01z" fill="#6366F1"/>
        </svg>
      </div>
      
      <div class="guide-content">
        <h1>这里将显示您的网页</h1>
        
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">点击右侧的AI助手</div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">描述您想要的网页内容</div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">AI将自动为您生成网页</div>
          </div>
        </div>
        
        <div class="example-container">
          <div class="example-header">示例:</div>
          <div class="example-box">
            <p>"创建一个电商网站首页，包含导航栏、产品轮播图和热门商品展示区"</p>
          </div>
          <div class="arrow-right">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.empty-page-container {
  width: 100%;
  height: 100vh;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.ai-guide {
  width: 90%;
  max-width: 700px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
  text-align: center;
  position: relative;
  margin: auto;
}

.ai-logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
}

.guide-content h1 {
  margin: 0 0 2rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.step {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 1rem;
}

.step-number {
  background-color: #6366F1;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  font-size: 1.1rem;
  color: #374151;
  text-align: left;
}

.example-container {
  background-color: #EEF2FF;
  padding: 1.25rem;
  border-radius: 8px;
  margin: 0 auto;
  position: relative;
  max-width: 550px;
  text-align: left;
}

.example-header {
  font-weight: 600;
  color: #4F46E5;
  margin-bottom: 0.5rem;
}

.example-box {
  background-color: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px dashed #C7D2FE;
}

.example-box p {
  margin: 0;
  color: #111827;
}

.arrow-right {
  position: absolute;
  top: 50%;
  right: -35px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  animation: arrow-pulse 1.5s infinite ease-in-out;
}

@keyframes arrow-pulse {
  0% { transform: translateY(-50%) translateX(0); opacity: 0.7; }
  50% { transform: translateY(-50%) translateX(10px); opacity: 1; }
  100% { transform: translateY(-50%) translateX(0); opacity: 0.7; }
}

@media (max-width: 640px) {
  .ai-guide {
    padding: 1.5rem;
  }
  
  .guide-content h1 {
    font-size: 1.5rem;
  }
  
  .step-text {
    font-size: 1rem;
  }
  
  .arrow-right {
    right: 0;
    top: auto;
    bottom: -30px;
    transform: translateY(0) rotate(90deg);
  }
  
  @keyframes arrow-pulse {
    0% { transform: translateY(0) rotate(90deg) translateX(0); opacity: 0.7; }
    50% { transform: translateY(0) rotate(90deg) translateX(10px); opacity: 1; }
    100% { transform: translateY(0) rotate(90deg) translateX(0); opacity: 0.7; }
  }
}
</style>` 