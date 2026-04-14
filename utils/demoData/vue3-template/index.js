// Vue 3模板文件内容

// package.json模板
export const packageJsonTemplate = `{
  "name": "__PROJECT_NAME__",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}`;

// tsconfig.json模板
export const tsconfigTemplate = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

// 添加tsconfig.node.json模板
export const tsconfigNodeTemplate = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

// 添加main.ts模板
export const mainTsTemplate = `import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './index.css'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/__COMPONENT_NAME__.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')`;

// 添加App.vue的TypeScript版本
export const appVueTsTemplate = `<template>
  <router-view />
</template>

<script setup lang="ts">
// 使用TypeScript的Vue组件
</script>`;

// vite.config.js模板
export const viteConfigTemplate = `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})`;

// index.html模板
export const indexHtmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__TITLE__</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`;

// main.js模板 - 添加路由配置
export const mainJsTemplate = `import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './index.css'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/__COMPONENT_NAME__.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')`;

// App.vue模板 - 使用vue-router，去除样式和布局
export const appVueTemplate = `<template>
  <router-view />
</template>`;

// README.md模板
export const readmeTemplate = `# __PROJECT_NAME__

由AIgniteGames生成的Vue 3项目

## 项目结构

\`\`\`
src/
├── assets/       # 静态资源
├── views/        # 页面
│   └── __COMPONENT_NAME__.vue  # 您的页面
├── App.vue       # 应用入口组件
└── main.js       # 应用入口文件
\`\`\`

## 项目设置

\`\`\`
npm install
\`\`\`

### 开发环境编译和热重载

\`\`\`
npm run dev
\`\`\`

### 生产环境构建

\`\`\`
npm run build
\`\`\`

### 预览生产构建

\`\`\`
npm run preview
\`\`\``;

// .gitignore模板
export const gitignoreTemplate = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
.DS_Store
dist
dist-ssr
coverage
*.local

/cypress/videos/
/cypress/screenshots/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;

// 添加index.css样式文件模板
export const indexCssTemplate = `body {
  margin: 0;
  padding: 0;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

// 添加示例组件模板
export const exampleComponentTemplate = `<template>
  <div class="example-component">
    <h2>示例组件</h2>
    <p>这是一个可复用的组件示例</p>
  </div>
</template>

<script setup>
// 组件逻辑可以写在这里
</script>

<style scoped>
.example-component {
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f5f5;
  margin: 20px 0;
}
</style>`;

// 添加index.vue模板 - 用于首页自动导入用户组件
export const indexTemplate = `<template>
  <div class="home-page">
    <__COMPONENT_NAME__ />
  </div>
</template>

<script setup>
import __COMPONENT_NAME__ from './__COMPONENT_NAME__.vue';
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
}
</style>`;

// 添加组件模板
export const componentTemplate = `<template>
  <div class="component-container">
    __COMPONENT_CODE__
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.component-container {
  width: 100%;
}
</style>`; 