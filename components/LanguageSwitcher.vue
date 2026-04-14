<template>
  <div class="language-switcher">
    <div class="relative" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
      <button class="flex items-center p-2 rounded hover:bg-gray-100">
        <img :src="getLanguageIcon(currentLanguage)" alt="Current language" class="w-6 h-6 rounded-full object-cover border border-gray-200">
        <span class="ml-2">{{ languageLabels[currentLanguage] || currentLanguage.toUpperCase() }}</span>
        <svg class="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <div v-if="showDropdown" class="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md z-50 py-1 min-w-[160px] max-h-[300px] overflow-y-auto">
        <div class="sticky top-0 bg-white p-2 border-b">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索国家..."
            class="w-full px-2 py-1 border rounded text-sm"
            @click.stop
          />
        </div>
        <button 
          v-for="(label, code) in filteredLanguages" 
          :key="code"
          @click="switchLanguage(code)"
          class="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
        >
          <img :src="getLanguageIcon(code)" alt="Language icon" class="w-6 h-6 rounded-full object-cover border border-gray-200 mr-2">
          {{ label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// 导入国家图标
import unknown from '../assets/icons/country/unknown.svg'
import us from '../assets/icons/country/us.svg'
import fr from '../assets/icons/country/fr.svg'
import es from '../assets/icons/country/es.svg'
import de from '../assets/icons/country/de.svg'
import ru from '../assets/icons/country/ru.svg'
import gb from '../assets/icons/country/gb.svg'
import cn from '../assets/icons/country/cn.svg'
import jp from '../assets/icons/country/jp.svg'
import za from '../assets/icons/country/za.svg'
import mx from '../assets/icons/country/mx.svg'
import tr from '../assets/icons/country/tr.svg'
import th from '../assets/icons/country/th.svg'
import vn from '../assets/icons/country/vn.svg'
import ua from '../assets/icons/country/ua.svg'
import nl from '../assets/icons/country/nl.svg'
import pt from '../assets/icons/country/pt.svg'
import it from '../assets/icons/country/it.svg'
import sa from '../assets/icons/country/sa.svg'
import ad from '../assets/icons/country/ad.svg'
import se from '../assets/icons/country/se.svg'
import no from '../assets/icons/country/no.svg'
import pl from '../assets/icons/country/pl.svg'
import au from '../assets/icons/country/au.svg'
import ca from '../assets/icons/country/ca.svg'
import in_icon from '../assets/icons/country/in.svg'
import br from '../assets/icons/country/br.svg'
import ar from '../assets/icons/country/ar.svg'
import zw from '../assets/icons/country/zw.svg'
import zm from '../assets/icons/country/zm.svg'
import ye from '../assets/icons/country/ye.svg'
import yt from '../assets/icons/country/yt.svg'
import ws from '../assets/icons/country/ws.svg'
import vu from '../assets/icons/country/vu.svg'
import wf from '../assets/icons/country/wf.svg'
import vi from '../assets/icons/country/vi.svg'
import vg from '../assets/icons/country/vg.svg'
import ve from '../assets/icons/country/ve.svg'
import vc from '../assets/icons/country/vc.svg'
import va from '../assets/icons/country/va.svg'
import uz from '../assets/icons/country/uz.svg'
import uy from '../assets/icons/country/uy.svg'
import um from '../assets/icons/country/um.svg'
import ug from '../assets/icons/country/ug.svg'
import tz from '../assets/icons/country/tz.svg'
import tw from '../assets/icons/country/tw.svg'
import tv from '../assets/icons/country/tv.svg'
import tt from '../assets/icons/country/tt.svg'
import to from '../assets/icons/country/to.svg'
import tn from '../assets/icons/country/tn.svg'

// 图标映射
const iconMap: Record<string, string> = {
  unknown,
  us,
  fr,
  es,
  de,
  ru,
  gb,
  cn,
  jp,
  za,
  mx,
  tr,
  th,
  vn,
  ua,
  nl,
  pt,
  it,
  sa,
  ad,
  se,
  no,
  pl,
  au,
  ca,
  'in': in_icon, // 'in' 是 JavaScript 关键字，需要使用不同的变量名
  br,
  ar,
  zw,
  zm,
  ye,
  yt,
  ws,
  vu,
  wf,
  vi,
  vg,
  ve,
  vc,
  va,
  uz,
  uy,
  um,
  ug,
  tz,
  tw,
  tv,
  tt,
  to,
  tn
}

const { locale, locales } = useI18n();
// @ts-ignore
const availableLocales = computed(() => locales.value.map(l => typeof l === 'string' ? l : l.code));

// 优先使用 i18n locale，如果不可用则回退到 'us'
const initialLang = availableLocales.value.includes(locale.value) ? locale.value : 'us';
const currentLanguage = ref(initialLang);
const showDropdown = ref(false);
const searchQuery = ref('');

// 常用语言及其中文标签
const commonLanguages: Record<string, string> = {
  us: '英语 (美国)',
  fr: '法语',
  de: '德语',
  es: '西班牙语',
  ru: '俄语',
  jp: '日语',
  cn: '中文',
  gb: '英语 (英国)',
  it: '意大利语',
  pt: '葡萄牙语',
  nl: '荷兰语',
  se: '瑞典语',
  no: '挪威语',
  pl: '波兰语',
  th: '泰语',
  tr: '土耳其语',
  kr: '韩语',
  ua: '乌克兰语',
  vn: '越南语',
  ar: '阿拉伯语',
  sa: '沙特阿拉伯',
  ca: '加拿大',
  mx: '墨西哥',
  br: '巴西',
  in: '印度',
  au: '澳大利亚',
  za: '南非',
  ad: '安道尔'
};

// 可用的图标代码列表（基于实际导入的图标）
const availableIconCodes = Object.keys(iconMap).filter(code => code !== 'unknown');

// 合并所有语言标签
const languageLabels = computed(() => {
  const labels: Record<string, string> = { ...commonLanguages };
  
  // 添加其他没有预设标签的国家代码
  availableIconCodes.forEach(code => {
    if (!labels[code]) {
      labels[code] = code.toUpperCase();
    }
  });
  
  // 确保已配置的 locale 都有条目
  availableLocales.value.forEach(loc => {
    if (!labels[loc]) {
      labels[loc] = commonLanguages[loc] || loc.toUpperCase();
    }
  });
  
  return labels;
});

// 根据搜索过滤语言列表
const filteredLanguages = computed(() => {
  const query = searchQuery.value.toLowerCase();
  
  if (!query) return languageLabels.value;
  
  const result: Record<string, string> = {};
  Object.entries(languageLabels.value).forEach(([code, label]) => {
    if (code.toLowerCase().includes(query) || label.toLowerCase().includes(query)) {
      result[code] = label;
    }
  });
  
  return result;
});

// 获取语言对应的国家图标
function getLanguageIcon(code: string) {
  // 检查是否有对应的图标，如果没有则使用 unknown
  return iconMap[code] || iconMap.unknown;
}

// 切换语言
function switchLanguage(lang: string) {
  currentLanguage.value = lang; // 总是更新当前显示的语言/图标
  showDropdown.value = false;
  searchQuery.value = '';
  
  // 仅当选择的语言存在于 i18n 配置的 locales 中时，才切换 $i18n.locale
  if (availableLocales.value.includes(lang)) {
    locale.value = lang;
  }
}

// 当 i18n locale 从外部改变时，同步 currentLanguage
watch(locale, (newLocale) => {
  if (languageLabels.value[newLocale]) {
    currentLanguage.value = newLocale;
  } 
});
</script>

<style scoped>
.language-switcher {
  font-size: 14px;
}
</style> 