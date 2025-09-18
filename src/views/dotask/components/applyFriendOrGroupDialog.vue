<template>
  <el-dialog v-model="dialogVisible" title="加好友/群" width="80%">
    <el-tabs v-model="currentTab" stretch>
      <el-tab-pane label="用户" name="好友"> <!-- 输入用户ID -->
        <el-input v-model="userName" placeholder="请输入用户账号" clearable></el-input>
      </el-tab-pane>
      <el-tab-pane label="群组" name="群组"> <!-- 输入群组链接 -->
        <el-input v-model="groupLink" placeholder="请输入群组邀请链接" clearable></el-input>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button class="btn-base btn-danger" @click="onClose">取消</el-button>
      <el-button class="btn-base btn-default" @click="sendApplication">发送申请</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, getCurrentInstance, watch } from 'vue';
import { applyFriend, applyGroup } from '@/utils/groupManagement'; // 引入 API

const proxy = getCurrentInstance().proxy;
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// 实时监听弹窗显示
const dialogVisible = ref(props.modelValue);
watch(() => props.modelValue, (newValue) => {
  dialogVisible.value = newValue;
});

const currentTab = ref("好友");
const userName = ref(null);
const groupLink = ref(null);

const sendApplication = async () => {
  let res;
  if (currentTab.value === "好友") {
    res = await applyFriend({ userName: userName.value });
  } else {
    res = await applyGroup(groupLink.value);
  }

  console.log("发送申请结果", res);

  if (res.code === 200) {
    proxy.$message.success(`${currentTab.value}申请已发送`); // 发送提示信息
    dialogVisible.value = false;

    // 触发自定义事件，通知父组件刷新
    emit('update', { type: currentTab.value});
  } else {
    proxy.$message.error(`申请失败: ${res.message}`); // 发送提示信息
    // alert(`申请失败: ${res.message}`);
  }
};

const onClose = () => {
  dialogVisible.value = false;
  emit('update:modelValue', false);
};

const emit = defineEmits(['update:modelValue', 'update'])
</script>

<style lang="less" scoped>
@import "../../../assets/global.less"; // 复用按钮样式
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  transform: none;
}

.full-width {
  grid-column: span 2;
}

.title-header {
  padding: 15px 20px;
  margin-bottom: 15px;
  background-color: #d9cbb8;
  cursor: default;
  .title-number {
    font-size: 13px;
    color: #5b4d48;
  }
  .title-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-text {
      font-size: larger;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }
  }
}

// 弹窗样式
.dialog-header {
  background-color: #f8eee0;
  padding: 10px 20px;
  will-change: transform;
  margin: 0px;
  .dialog-header-content {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    .dialog-title {
      margin: 0;
      font-size: 15px;
      color: #7f3a12;
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .btn-close {
      position: absolute;
      right: 0px;
      top: 5%;
    }
  }
}

.dialog-content {
  height: 300px;
  padding: 10px 15px;
  .apply-info {
    margin-bottom: 15px;
    .name {
      font-size: 15px;
      font-weight: bold;
      color: #813103d5;
    }
    .remark{
      color: #818080;
      font-size: 13px;
    }
  }
  

  .tip-box {
    .tip-info {
      color: #818080;
      font-size: 13px;
    }
  }
}

.dialog-footer-btn {
  height: 50px;
  bottom: 0;
  right: 15px;
  position: absolute;
}

:deep(.el-dialog) {
  padding: 0px;
}


// 窗口主体内容
.apply-container {
  padding: 5px;
}

.top-search {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  align-items: center;
  padding: 0px 20px;
}

.sticky-tabs {
  margin: 0 5px;
  position: sticky;
  top: 0;
}

.scroll-pane {
  height: calc(100vh - 210px); // 根据实际布局调整高度
  overflow-y: auto;
}

.person-list {
  .person-item-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    margin: 5px 0;
    border-bottom: 1px solid #e4e2e1;
    background-color: #fffcfa;
    border-radius: 5px;
    transition: background-color 0.2s ease;

    .person-item-left {
      display: flex;
      flex-direction: column;

      .person-name {
        color: #813103d5;
        font-size: 15px;
      }
      .person-username {
        color: #696969;
        font-size: 13px;
      }
    }

    .person-item-right {
      position: relative;
      display: flex;
      align-items: center;

      .person-item-icon {
        cursor: pointer;
        color: #909399;
      }
    }
    &:hover {
      background-color: #eceae9;
    }
  }
  
  
}

.group-list {
  .group-item-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    margin: 5px 0;
    border-bottom: 1px solid #e4e2e1;
    background-color: #fffcfa;

    .group-item-left {
      display: flex;
      flex-direction: column;

      .group-name {
        font-weight: bold;
        color: #333;
      }

      .group-person {
        margin-top: 5px;
        display: flex;
        flex-wrap: wrap;

        .el-tag {
          margin-right: 5px;
          margin-bottom: 3px;
        }

        .group-person-tips {
          color: #999;
          font-size: 12px;
        }
      }
    }

    .group-item-right {
      position: relative;
      display: flex;
      align-items: center;

      .group-item-icon {
        cursor: pointer;
        color: #909399;
      }
    }
  }
}

.person-list, .group-list {
  margin-bottom: 15px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 10px;
  color: #909399;
  
  .el-icon {
    margin-right: 5px;
  }
}

.no-more {
  text-align: center;
  padding-bottom: 10px;
  color: #909399;
  font-size: 14px;
}
</style>