<template>
  <div class="miniTaskFilterContent">
    <customDragWindow>
      <template #header>
        <div class="title-box">
          <div class="title-text">
            筛选器
          </div>
          <div class="title-actions">
            <el-button
              class="btn-minimize" type="danger"
              :icon="Minus"
              circle
              @click="handlleMinimize"
            />
            <el-button
              class="btn-close" type="danger"
              :icon="CloseBold"
              circle
              @click="handlleClose"
            />
          </div>
        </div>
      </template>
    </customDragWindow>
    <div
      v-for="item in tableHeader" :key="item.key"
      class="filter-item"
    >
      <div v-if="item.type === 'select'">
        <span class="span">{{ item.title }}</span>
        <el-select
          placeholder="请选择"
          v-model="myformData[item.key]"
          style="width:220px"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="6"
          clearable
          @change="item.change"
        >
          <el-option
            v-for="option in item.options"
            :key="option.label"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
      <div v-if="item.type === 'text'">
        <span class="span">{{ item.title }}</span>
        <el-input
          v-model="myformData[item.key]"
          clearable
          type="textarea" style="width:220px"
          placeholder="请输入"
          :autosize="{ minRows: 1, maxRows: 4 }"
        />
      </div>
      <div v-if="item.type==='daterange'">
        <span class="span"> {{ item.title }}</span>
        <el-date-picker
          v-model="myformData[item.key]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          clearable
          :default-time="defaultTime"
          :value-format="'YYYY/MM/DD HH:mm:ss'"
        />
      </div>
      
      <div v-if="item.type==='customdaterange'" class="daterange-container">
        <span class="span">{{ item.title }}</span>
        <div class="date-inputs">
          <el-date-picker
            v-model="myformData[item.options[0].key]"
            type="datetime"
            placeholder="开始日期"
            clearable
            :default-time="defaultTime"
            :value-format="'YYYY/MM/DD HH:mm:ss'"
          />
          <text class="separator">至</text>
          <el-date-picker
            v-model="myformData[item.options[1].key]"
            type="datetime"
            placeholder="结束日期"
            clearable
            :default-time="defaultTime"
            :value-format="'YYYY/MM/DD HH:mm:ss'"
          />
        </div>
      </div>

      <div v-if="item.type==='datetime'">
        <span class="span">{{ item.title }}</span>
        <el-date-picker
          v-model="myformData[item.key]"
          type="datetime"
          placeholder="请选择"
          clearable
          :default-time="defaultTime"
          :value-format="'YYYY/MM/DD HH:mm:ss'"
        />
      </div>

      <div v-if="item.type==='date'">
        <span class="span">{{ item.title }}</span>
        <el-date-picker
          v-model="myformData[item.key]"
          type="date"
          placeholder="请选择"
          clearable
          :value-format="'YYYY/MM/DD'"
        />
      </div>
    </div>
    <div class="footer">
      <el-button
        class="btn-danger"
        @click="resetFilter"
      >
        清空
      </el-button>
      <el-button
        class="btn-base btn-default"
        @click="handleComfirm"
      >
        确定
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { CloseBold, Minus } from "@element-plus/icons-vue";
import { ref, getCurrentInstance, watch, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import customDragWindow from "../../components/public/customDragWindow.vue";
import { getProject } from "../../../utils/taskManagement";

const { proxy } = getCurrentInstance()

let main_win = getCurrentWindow("mini_task");
let mini_filter_win = getCurrentWindow("mini_task_filter");

onMounted(async () => {
  await mini_filter_win.emit("filter-window-ready");
  if (sessionStorage.getItem("token")) {
    await initData();
  }
})

let listenFn1;
onMounted(async () => {
  try {
    listenFn1 = listen("filterToken", async(event)=> {
      const { token } = event.payload;
      sessionStorage.setItem("token", token);
      await initData();
      return;
    })
  } catch (error) {
    console.error("监听失败", error)
  }
})

onUnmounted(() => {
  listenFn1?.();
})

const scheduleList = ref([]);
const initData = async () => {
  // 查看是否有本地缓存
  let storage = JSON.parse(localStorage.getItem("miniFilter")) ?? {};
  const data = await getProject({ pageSize: 999, pageNum: 1});
  if (data.code === 200) {
    const allSchedules = data.rows.map((project) => project.scheduleList.split(",")).flat();
    const newAllSchedules = [...new Set(allSchedules)];
    scheduleList.value = newAllSchedules.map(item => {
      return {
        label: item,
        value: item
      }
    });
    tableHeader[0].options = scheduleList.value;
  }
  myformData.value = {
    ...storage
  };
}

const myformData = ref({});
const defaultTime = new Date()

const tableHeader = [
  {
    title: "任务流程",
    dataKey: "queryScheduleList",
    key: 'queryScheduleList',
    type: 'select',
    options: []
  },
  {
    title: "优先级",
    dataKey: "priority",
    key: 'priority',
    type: 'select',
    options: [
      {
        label: 'P0',
        value: 'P0'
      }, {
        label: 'P1',
        value: 'P1'
      }, {
        label: 'P2',
        value: 'P2'
      }, {
        label: 'P3',
        value: 'P3'
      }, {
        label: 'P4',
        value: 'P4'
      }, {
        label: 'P5',
        value: 'P5'
      }
    ]
  },{
    title: "创建时间",
    dataKey: "datetimerange",
    key: "datetimerange",
    type: 'daterange',
    width: 150,
  }, {
    title: "截至时间",
    dataKey: "deadline",
    key: "deadline",
    type: 'datetime',
  }
]

/**
 * 确认筛选
 */
const handleComfirm = async () => {
  localStorage.setItem("miniFilter", JSON.stringify(myformData.value));
  await main_win.emit("miniFiter",{ action: 'doMiniFiter' });
  handlleClose();
}

/**
 * 清空
 */
const resetFilter = async () => {
  myformData.value = {};
  localStorage.removeItem("miniFliter"); // 清除本地存储中的筛选条件
  await main_win.emit("miniFiter", { action: 'resetMiniFilter' });
  handlleClose();
}


/**
 * 关闭弹窗
 */
const handlleClose = () => {
  mini_filter_win.close();
}


/**
 * 窗口最小化
 */
const handlleMinimize = async () => {
  await mini_filter_win.minimize();
}
</script>

<style lang="less" scoped>
@import "../../../assets/global.less"; // 复用按钮样式

.miniTaskFilterContent {
  height: 100vh;
  position: relative;
}

.title-box {
  background-color: #d9cbb8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #999;
  padding: 15px;
  margin-bottom: 10px;
  .title-text{
    font-size: 20px;
    font-weight: 600;
    color: #7a430f;
    background-blend-mode: multiply;
    text-shadow: 2px 2px 1px #46200548;
  }
}

.filter-item {
  padding: 10px 20px;
  display: flex;
  justify-content: flex-start;
  span{
    font-size: 15px;
    color: #7a430f;
    display: inline-block;
    width: 100px;
    text-align: right;
    margin-right: 10px;
  }
}

.daterange-container {
  display: flex;
  align-items: flex-start;
  .date-inputs {
    display: flex;
    flex-direction: column; /* 输入框垂直排列 */
    align-items: flex-start;

    .separator {
      display: flex;
      text-align: center;
      align-self: center;
      font-size: 14px;
      color: #606266; /* 和输入框字体颜色一致 */
      margin: 5px 0; /* "至"字上下间距 */
    }
  }
}

.footer{
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}
</style>
