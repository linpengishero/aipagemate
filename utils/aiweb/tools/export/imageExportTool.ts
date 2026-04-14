import {
  IMAGE_PLACEHOLDER_CSS_PREFIX,
  IMAGE_PLACEHOLDER_HTML_PREFIX,
  IMAGE_PLACEHOLDER_JS_PREFIX,
  IMAGE_PLACEHOLDER_INLINE_PREFIX,
  IMAGE_PLACEHOLDER_REGEX,
} from '~/utils/aiweb/placeholders';

interface ImageCacheItem {
  id: string;
  base64Data: string;
  type: string;
}

export class ImageExporter {
  public imageCacheMap: Map<string, ImageCacheItem> = new Map();
  private imageIndexCounter = 1;

  private readonly CSS_BASE64_REGEX = /url\(\s*['"]?\s*data:image\/([a-z]+);base64,([^"')]+)\s*['"]?\s*\)/gi;
  private readonly HTML_BASE64_REGEX = /<img\s+[^>]*src\s*=\s*["']data:image\/([a-z]+);base64,([^"']+)["'][^>]*>/gi;
  private readonly INLINE_BASE64_REGEX = /["']data:image\/([a-z]+);base64,([^"']+)["']/gi;
  private readonly ENTITY_BASE64_REGEX = /url\(&quot;data:image\/([a-z]+);base64,([^&"')]+)&quot;\)/gi;
  private readonly JS_BASE64_REGEX = /\(\s*["']data:image\/([a-z]+);base64,([^"']+)["']\s*\)/gi;

  private readonly CSS_PREFIX = IMAGE_PLACEHOLDER_CSS_PREFIX;
  private readonly HTML_PREFIX = IMAGE_PLACEHOLDER_HTML_PREFIX;
  private readonly JS_PREFIX = IMAGE_PLACEHOLDER_JS_PREFIX;
  private readonly INLINE_PREFIX = IMAGE_PLACEHOLDER_INLINE_PREFIX;

  public preprocessCode(sourceCode: string): string {
    this.imageCacheMap.clear();
    this.imageIndexCounter = 1;

    let processedCode = this.decodeHTMLEntities(sourceCode);
    processedCode = this.removeExistingPlaceholders(processedCode);

    processedCode = processedCode.replace(this.ENTITY_BASE64_REGEX, (_m, type, base64Data) => {
      const cacheId = this.generateCacheId();
      this.storeImageToCache(cacheId, type, base64Data);
      return `url(${this.CSS_PREFIX}${cacheId})`;
    });

    processedCode = processedCode.replace(this.CSS_BASE64_REGEX, (_m, type, base64Data) => {
      const cacheId = this.generateCacheId();
      this.storeImageToCache(cacheId, type, base64Data);
      return `url(${this.CSS_PREFIX}${cacheId})`;
    });

    processedCode = processedCode.replace(this.HTML_BASE64_REGEX, (_m, type, base64Data) => {
      const cacheId = this.generateCacheId();
      this.storeImageToCache(cacheId, type, base64Data);
      return `<img src="${this.HTML_PREFIX}${cacheId}" alt="Image" />`;
    });

    processedCode = processedCode.replace(this.JS_BASE64_REGEX, (_m, type, base64Data) => {
      const cacheId = this.generateCacheId();
      this.storeImageToCache(cacheId, type, base64Data);
      return `(${this.JS_PREFIX}${cacheId})`;
    });

    processedCode = processedCode.replace(this.INLINE_BASE64_REGEX, (match, type, base64Data) => {
      if (match.includes('_IMG_')) return match;
      const cacheId = this.generateCacheId();
      this.storeImageToCache(cacheId, type, base64Data);
      return `"${this.INLINE_PREFIX}${cacheId}"`;
    });

    return processedCode;
  }

  private removeExistingPlaceholders(code: string): string {
    return code.replace(IMAGE_PLACEHOLDER_REGEX, 'removed_placeholder');
  }

  private decodeHTMLEntities(code: string): string {
    return code
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  private storeImageToCache(cacheId: string, type: string, base64Data: string): void {
    const cleanBase64 = base64Data.replace(/\s/g, '');
    this.imageCacheMap.set(cacheId, { id: cacheId, base64Data: cleanBase64, type });
  }

  public postprocessCode(processedCode: string, framework: 'html' | 'vue3' | 'react' = 'html'): string {
    let imagePath = './images';
    if (framework === 'vue3') imagePath = '@/assets/images';
    if (framework === 'react') imagePath = '../assets/images';

    processedCode = processedCode.replace(/url\(\s*URL_IMG_([^)]+)\s*\)/gi, (_m, cacheId) => {
      const ext = this.imageCacheMap.get(cacheId)?.type || 'png';
      return `url('${imagePath}/img_${cacheId}.${ext}')`;
    });

    processedCode = processedCode.replace(/<img\s+[^>]*src\s*=\s*["']HTML_IMG_([^"']+)["'][^>]*>/gi, (_m, cacheId) => {
      const ext = this.imageCacheMap.get(cacheId)?.type || 'png';
      return `<img src="${imagePath}/img_${cacheId}.${ext}" alt="Image" />`;
    });

    processedCode = processedCode.replace(/\(\s*JS_IMG_([^)]+)\s*\)/gi, (_m, cacheId) => {
      const ext = this.imageCacheMap.get(cacheId)?.type || 'png';
      return `('${imagePath}/img_${cacheId}.${ext}')`;
    });

    processedCode = processedCode.replace(/["']INLINE_IMG_([^"']+)["']/gi, (_m, cacheId) => {
      const ext = this.imageCacheMap.get(cacheId)?.type || 'png';
      return `"${imagePath}/img_${cacheId}.${ext}"`;
    });

    return processedCode;
  }

  public async createZipPackage(
    processedCode: string,
    framework: 'html' | 'vue3' | 'react' = 'html',
    filename: string = 'index',
  ): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    let fileExtension = '.html';
    if (framework === 'vue3') fileExtension = '.vue';
    if (framework === 'react') fileExtension = '.jsx';

    zip.file(`${filename}${fileExtension}`, processedCode);

    const imagesFolder = zip.folder('images');
    if (!imagesFolder) throw new Error('Cannot create images folder');

    await Promise.all(
      Array.from(this.imageCacheMap.entries()).map(async ([cacheId, imageData]) => {
        const imageBlob = await this.base64ToBlob(imageData.base64Data, `image/${imageData.type}`);
        imagesFolder.file(`img_${cacheId}.${imageData.type}`, imageBlob);
      }),
    );

    return zip.generateAsync({ type: 'blob' });
  }

  public downloadZip(zipBlob: Blob, filename: string = 'web_export.zip'): void {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public getImageCount(): number {
    return this.imageCacheMap.size;
  }

  private generateCacheId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    const counter = (this.imageIndexCounter++).toString().padStart(3, '0');
    const randomByte = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return `${timestamp}-${randomPart}-${randomByte}-${counter}`;
  }

  public async base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        resolve(new Blob([array], { type: mimeType }));
      } catch (error) {
        reject(error);
      }
    });
  }

  public restoreOriginalImages(processedCode: string): string {
    let restoredCode = processedCode;

    restoredCode = restoredCode.replace(/url\(\s*URL_IMG_([^)]+)\s*\)/gi, (_m, cacheId) => {
      const imageCache = this.imageCacheMap.get(cacheId);
      if (!imageCache) return _m;
      return `url(data:image/${imageCache.type};base64,${imageCache.base64Data})`;
    });

    restoredCode = restoredCode.replace(/<img\s+[^>]*src\s*=\s*["']HTML_IMG_([^"']+)["'][^>]*>/gi, (_m, cacheId) => {
      const imageCache = this.imageCacheMap.get(cacheId);
      if (!imageCache) return _m;
      return `<img src="data:image/${imageCache.type};base64,${imageCache.base64Data}" alt="Image" />`;
    });

    restoredCode = restoredCode.replace(/\(\s*JS_IMG_([^)]+)\s*\)/gi, (_m, cacheId) => {
      const imageCache = this.imageCacheMap.get(cacheId);
      if (!imageCache) return _m;
      return `(data:image/${imageCache.type};base64,${imageCache.base64Data})`;
    });

    restoredCode = restoredCode.replace(/["']INLINE_IMG_([^"']+)["']/gi, (_m, cacheId) => {
      const imageCache = this.imageCacheMap.get(cacheId);
      if (!imageCache) return _m;
      return `"data:image/${imageCache.type};base64,${imageCache.base64Data}"`;
    });

    return restoredCode;
  }

  public preprocessElementCode(elementCode: string): string {
    if (!elementCode) return '';

    let processedCode = this.decodeHTMLEntities(elementCode);
    processedCode = processedCode.replace(this.ENTITY_BASE64_REGEX, () => 'url(IMAGE_PLACEHOLDER)');
    processedCode = processedCode.replace(this.CSS_BASE64_REGEX, () => 'url(IMAGE_PLACEHOLDER)');
    processedCode = processedCode.replace(this.HTML_BASE64_REGEX, () => '<img src="IMAGE_PLACEHOLDER" alt="Image" />');
    processedCode = processedCode.replace(this.JS_BASE64_REGEX, () => '("IMAGE_PLACEHOLDER")');
    processedCode = processedCode.replace(this.INLINE_BASE64_REGEX, () => '"IMAGE_PLACEHOLDER"');

    return processedCode;
  }
}

export const createImageExporter = () => new ImageExporter();
