import { createApp } from "vue";
import router from './router'
import './assets/global.less'; // 全局css
import App from "./App.vue";

// 引入组件库
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import { invoke } from '@tauri-apps/api/core'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册全局通知方法
app.config.globalProperties.$notification = null;

app.use(router)
.use(ElementPlus, {
  locale: zhCn,
})
.mount("#app");

// window.onSecondInstance = () => {
//   // 调用 Rust 命令显示主窗口
//   console.log('onSecondInstance');
//   invoke('show_main_window').then(() => {
//     // 可选：关闭当前实例（第二个实例）
//     window.close()
//   })
// }