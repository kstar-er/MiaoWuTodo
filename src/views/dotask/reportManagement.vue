<template>
  <main class="container">
    <!-- 加载动画 -->
    <loadingAnimation :loading="loading" loadingText="加载报表数据中..." />

    <!-- 数据 -->
    <div class="report-container" v-if="!loading">
      <div class="report-list-box">
        <!-- 空数据状态 -->
        <div v-if="reportList.length === 0">
          <EmptyState text="暂无报表数据" />
        </div>

        <div class="scrollable-content" v-else>
          <!-- 这里可以放置报表列表，暂时留空，因为主要功能在周报管理页面 -->
          <div class="empty-hint">
            <p>报表管理功能主要包含周报管理，请点击下方按钮进入周报管理页面</p>
            <el-button type="primary" @click="goToWeeklyReport">进入周报管理</el-button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import loadingAnimation from "../components/public/loadingAnimation.vue";
import EmptyState from "@/public/components/EmptyState.vue";

const router = useRouter();
const loading = ref(false);
const reportList = ref([]);

const goToWeeklyReport = () => {
  router.push('/weeklyReportManagement');
};

const initData = async () => {
  loading.value = true;
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

defineExpose({ initData });

onMounted(() => {
  initData();
});
</script>

<style lang="less" scoped>
.container {
  font-size: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.report-container {
  .report-list-box {
    .empty-hint {
      padding: 40px;
      color: #666;
      p {
        margin-bottom: 20px;
      }
    }
  }
}
</style>
