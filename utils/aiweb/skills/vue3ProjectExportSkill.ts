import JSZip from 'jszip';
import { ImageExporter } from '~/utils/aiweb/tools';

export interface PageData {
  name: string;
  content: string;
}

export interface Vue3ExportOptions {
  cssFramework?: 'none' | 'tailwind';
  seoSupport?: boolean;
  metadata?: {
    description?: string;
    author?: string;
    keywords?: string;
  };
}

const safeName = (value: string) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const buildAppVue = (firstPageName: string) => `<template>
  <${firstPageName} />
</template>

<script setup lang="ts">
import ${firstPageName} from './pages/${firstPageName}.vue'
</script>
`;

const buildMainTs = () => `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
`;

const buildIndexHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue 3 Project</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

const buildStyleCss = (cssFramework?: 'none' | 'tailwind') => {
  if (cssFramework === 'tailwind') {
    return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
  }

  return `* { box-sizing: border-box; }\nbody { margin: 0; font-family: Inter, Arial, sans-serif; }\n`;
};

const extractVuePageCode = (code: string) => {
  const text = (code || '').trim();
  if (text.includes('<template') && text.includes('<script') && text.includes('<style')) {
    return text;
  }

  return `<template>\n  <div class="page-root">\n${text}\n  </div>\n</template>\n\n<script setup lang="ts">\n</script>\n\n<style scoped>\n.page-root { padding: 16px; }\n</style>\n`;
};

export async function generateVue3Project(
  projectName: string,
  pages: PageData[],
  options: Vue3ExportOptions = {}
): Promise<Blob> {
  const zip = new JSZip();

  const root = zip.folder(safeName(projectName) || 'vue3-project');
  if (!root) {
    throw new Error('Failed to create root folder.');
  }

  const src = root.folder('src');
  const pagesFolder = src?.folder('pages');
  const publicFolder = root.folder('public');
  const assetsFolder = publicFolder?.folder('images');

  if (!src || !pagesFolder || !publicFolder || !assetsFolder) {
    throw new Error('Failed to create project folders.');
  }

  const exporter = new ImageExporter();

  const normalizedPages = pages.length > 0 ? pages : [{ name: 'Home', content: '<div>Home</div>' }];

  const componentNames = normalizedPages.map((page, index) => {
    const base = safeName(page.name || `page-${index + 1}`) || `page-${index + 1}`;
    return base.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  });

  normalizedPages.forEach((page, index) => {
    const componentName = componentNames[index] || `Page${index + 1}`;
    const preprocessed = exporter.preprocessCode(page.content || '');
    const restored = exporter.postprocessCode(preprocessed, 'vue3');
    const vueCode = extractVuePageCode(restored);
    pagesFolder.file(`${componentName}.vue`, vueCode);
  });

  await Promise.all(
    Array.from(exporter.imageCacheMap.entries()).map(async ([cacheId, imageData]) => {
      const blob = await exporter.base64ToBlob(imageData.base64Data, `image/${imageData.type}`);
      assetsFolder.file(`img_${cacheId}.${imageData.type}`, blob);
    })
  );

  const firstPage = componentNames[0] || 'Home';

  root.file('index.html', buildIndexHtml());
  root.file('package.json', JSON.stringify({
    name: safeName(projectName) || 'vue3-project',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      vue: '^3.5.0'
    },
    devDependencies: {
      vite: '^5.4.0',
      typescript: '^5.6.0'
    }
  }, null, 2));

  root.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: false,
      jsx: 'preserve',
      lib: ['ES2020', 'DOM']
    }
  }, null, 2));

  root.file('vite.config.ts', `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n\nexport default defineConfig({\n  plugins: [vue()]\n})\n`);
  root.file('README.md', `# ${projectName}\n\nGenerated Vue 3 project package.\n`);

  src.file('main.ts', buildMainTs());
  src.file('App.vue', buildAppVue(firstPage));
  src.file('style.css', buildStyleCss(options.cssFramework));

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export function downloadVue3Project(zipBlob: Blob, projectName: string): void {
  const name = safeName(projectName || 'vue3-project') || 'vue3-project';
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-vue3.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
