import { defineNuxtPlugin } from '#app'
import { Toast, Dialog, Button, Field, Loading, Icon } from 'vant'

// 导入样式
import 'vant/lib/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  // 注册Vant组件
  nuxtApp.vueApp.use(Toast)
  nuxtApp.vueApp.use(Dialog)
  nuxtApp.vueApp.use(Button)
  nuxtApp.vueApp.use(Field)
  nuxtApp.vueApp.use(Loading)
  nuxtApp.vueApp.use(Icon)
}) 