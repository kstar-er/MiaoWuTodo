<!-- 预览图片页面 -->
<template>
  <main class="container">
    <div v-if="isLoading">加载中...</div>
    <el-image-viewer
      v-else
      :initial-index="0"
      show-progress
      :url-list="srcList"
      @close="hideWin"
    />
  </main>
</template>

<script lang="ts" setup>
import {
  onMounted,
  ref,
  onUnmounted,
  nextTick,
} from "vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

const isLoading = ref(true); // 添加加载状态标志
let unlistenFn;
let current_win = getCurrentWindow("preview_image");

const srcList = ref([]);
onMounted(async () => {
  console.log("预览窗口组件已挂载完毕");
  await current_win.emit("preview-window-ready");
});

onMounted(async() => {
  // 监听来自主窗口的信息
  try {
    console.log("preview-image1");
    unlistenFn = await listen("preview-image-list", async (event) => {
      console.log("preview-image2", event);
      const { imagelist } = event.payload;
      console.log("收到的数据", imagelist)

      srcList.value = imagelist.srcList.map(url => `https://miaowutodo.oss-cn-hangzhou.aliyuncs.com/images/task/${url}`);

      isLoading.value = false;
      
      console.log("整合后的数据", srcList.value)
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
})

onUnmounted(() => {
  unlistenFn?.(); // 在组件卸载时移除监听器
});

const hideWin = () => {
  srcList.value = [];
  current_win.close();
}
</script>

<style lang="less" scoped>

</style>
