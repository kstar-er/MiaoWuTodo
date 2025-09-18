<template>
  <div>
    <div class="title">
      筛选器
      <el-button
        size="small"
        class="btn-close" type="danger"
        :icon="CloseBold"
        circle
        @click="close"
      />
    </div>
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
      <!-- <el-date-picker
        v-if="item.type==='daterange'"
        v-model="myformData[item.key]"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        unlink-panels
        clearable
        :default-time="defaultTime"
        :value-format="'YYYY/MM/DD HH:mm:ss'"
      /> -->
      <div v-if="item.type==='daterange'" class="daterange-container">
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
      <div v-if="item.type==='date'">
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
    </div>
    <div class="footer">
      <el-button
        size="small" type="danger"
        @click="cancel"
      >
        清空
      </el-button>
      <el-button
        size="small" type="success"
        @click="comfirm"
      >
        确定
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { CloseBold } from "@element-plus/icons-vue";
import { ref, getCurrentInstance, watch, onMounted } from 'vue'
import { ElNotification } from 'element-plus'
const { proxy } = getCurrentInstance()

const props = defineProps({
  leaderList: {
    type: Object,
    default: () => {
      return []
    }
  },
  canFilterWorker: {
    type: Boolean,
    default: true
  }
})

watch(() => props.leaderList.length, () => {
  tableHeader[1].options = [];
  props.leaderList.forEach(element => {
    tableHeader[1].options.push({
      label: element.label,
      value: element.value
    })
  });
})

// 查看是否有本地缓存
let storage = JSON.parse(localStorage.getItem("filter")) ?? {}

const myformData = ref({
  priority: storage.priority, // 优先级
  userIdList: storage.userIdList, // 负责人
})
const defaultTime = new Date()

const tableHeader = props.canFilterWorker ? [
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
  }, {
    title: "负责人",
    dataKey: "userIdList",
    key: 'userIdList',
    type: 'select',
    options: []
  }, {
    title: "创建时间",
    dataKey: "datetimerange",
    type: 'daterange',
    options: [
      {
        label: '开始日期',
        key: 'startTime',
      },
      {
        label: '结束日期',
        key: 'endTime',
      }
    ]
  }, {
    title: "截至时间",
    dataKey: "deadline",
    key: 'deadline',
    type: 'date'
  }
] : [{
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
}, {
  title: "创建时间",
  dataKey: "datetimerange",
  type: 'daterange',
  options: [
    {
      label: '开始日期',
      key: 'startTime',
    },
    {
      label: '结束日期',
      key: 'endTime',
    }
  ]
}, {
  title: "截至时间",
  dataKey: "deadline",
  key: 'deadline',
  width: 200,
  type: 'datetime'
}]

const emits = defineEmits(['doFilter','cancel', 'close'])

const comfirm = () => {
  const startTimeFilled = myformData.value.startTime !== undefined && myformData.value.startTime !== '';
  const endTimeFilled = myformData.value.endTime !== undefined && myformData.value.endTime !== '';
  if (startTimeFilled !== endTimeFilled) { // 检查是否只有一个时间
    ElNotification({
      title: 'Warning',
      message: '创建时间不能只填写其中一个，请填写完整',
      type: 'warning',
      position: 'bottom-right'
    })
    return;
  }
  if (myformData.value.startTime > myformData.value.endTime) {
    ElNotification({
      title: 'error',
      message: '结束日期不能小于开始日期，请重新选择！',
      type: 'error',
      position: 'bottom-right'
    })
    return;
  }
  myformData.value.userIdList = myformData.value.userIdList === undefined ? [] : myformData.value.userIdList
  myformData.value.priority = myformData.value.priority === undefined ? [] : myformData.value.priority
  console.log("111---filter3", myformData.value)
  emits('doFilter', myformData.value)
}

const cancel = () => {
  myformData.value = {};
  console.log("111---filter2")
  localStorage.removeItem("filter"); // 清除本地存储中的筛选条件
  localStorage.removeItem("filterLength"); // 清除筛选条件计数
  emits('cancel')
}

const close = () => {
  emits('close')
}
</script>

<style lang="less" scoped>
.title{
  font-size: 16px;
  border-bottom: 1px dashed #999;
  padding-bottom: 10px;
  color: #2b81a3;
  display: flex;
  justify-content: space-between;
}
.filter-item{
  padding: 10px 0;
  span{
    display: inline-block;
    width: 80px;
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
      margin: 5px 0; /* “至”字上下间距 */
    }
  }
}
.footer{
  display: flex;
  justify-content: flex-end;
}
</style>
