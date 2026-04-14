import { defineNuxtPlugin } from '#app'
import Varlet from '@varlet/ui'
import {
  Button, 
  Select,
  Option,
  Switch,
  Slider,
  Icon,
  Progress,
  Loading,
  Tooltip
  // 不直接导入Toast组件
} from '@varlet/ui'

// 导入样式
import '@varlet/ui/es/style'

export default defineNuxtPlugin((nuxtApp) => {
  // 注册所有组件
  nuxtApp.vueApp.use(Varlet)
  
  // 或者注册特定组件
  // nuxtApp.vueApp.use(Button)
  // nuxtApp.vueApp.use(Select)
  // nuxtApp.vueApp.use(Option)
  // nuxtApp.vueApp.use(Switch)
  // nuxtApp.vueApp.use(Slider)
  // nuxtApp.vueApp.use(Icon)
  // nuxtApp.vueApp.use(Progress)
  // nuxtApp.vueApp.use(Loading)
  // nuxtApp.vueApp.use(Tooltip)
}) 