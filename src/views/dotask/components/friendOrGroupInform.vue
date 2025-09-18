<!-- 添加好友或加入群聊-->
<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="title-header">
          <div class="title-content">
            <div class="title-text">
              {{ informType === '好友' ? '好友通知' : '群通知' }}
            </div>
            <el-button
              class="btn-close"
              type="danger" 
              :icon="CloseBold"
              circle
              @click="hideWin"
            />
          </div>
        </div>
      </template>
    </customDragWindow>

    <div class="inform-container">
      <!-- 可滚动内容区域 -->
      <div class="inform-list scroll-pane" @scroll="handleScroll">
        <!-- 用户列表内容 -->
        <div v-for="inform in informList" :key="inform.id" class="inform-item-box" v-if="informList?.length > 0">
          <div class="inform-item-left">
            <div class="inform-item-left-top">
              <div class="inform-name"> {{ inform.senderNickName  }} </div>
              <div class="inform-tip">请求加{{ informType === '好友' ? '为好友' : ('入群组：' + inform.groupName) }}</div>
              <div class="inform-time"> {{ inform.createTime }}</div>
            </div>
            <div class="inform-item-left-bottom">
              <div class="inform-remark"> 留言： {{ inform.remark }}</div>
            </div>
          </div>
          <div class="inform-item-right">
            <div v-if="inform.status === 'pending'">
              <el-button size="small" @click="handleVerify(inform, 'pass')">同意</el-button>
              <el-button size="small" type="danger" @click="handleVerify(inform, 'refuse')">拒绝</el-button>
            </div>
            <div v-if="inform.status === 'accepted'">
              <el-tag type="success">已通过</el-tag>
            </div>
            <div v-if="inform.status === 'rejected'">
              <el-tag type="danger">已拒绝</el-tag>
            </div>

          </div>
        </div>

        <div v-if="informList?.length > 0">
          <div v-if="loadingMore" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载更多...</span>
          </div>
          <div v-if="noMore" class="no-more">没有更多数据了</div>
        </div>

        <div v-else class="no-data">
          <el-empty description="暂无通知" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import {
  onMounted,
  reactive,
  ref,
  onUnmounted,
  getCurrentInstance
} from "vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloseBold, Loading } from "@element-plus/icons-vue";
import { getFriendApplyList, auditFriendApply, getGroupApplyList, auditGroupApply } from "../../../utils/groupManagement";
import customDragWindow from "../../components/public/customDragWindow.vue"; // 封装窗口拖拽

const { proxy } = getCurrentInstance();

let emit_win = 'main_task';
let inform_win = getCurrentWindow('inform_win');

onMounted(async () => {
  console.log("好友通知/群通知 组件已挂载完毕");
  await inform_win.emit("apply-inform-window-ready");
});

const loading = ref(false);
let unlistenFn, unlistenFn1, unlistenFn2;
const ruleFormRef = ref(null); // 子组件表单
onMounted(async () => {
  // 监听来自父窗口的信息
  loading.value = true;
  try {
    unlistenFn = await listen("apply-inform-info", async (event) => {
      await initDataSource(event);
      loading.value = false;
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
});


// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
});

const informType = ref(null); // 好友通知 群组通知
const initDataSource = async (event) => {
  const { applyInformType, token } = event.payload;

  // 存储编辑或新增信息到本地
  sessionStorage.setItem("token", token);
  informType.value = applyInformType;

  console.log("1111---informType", informType.value)

  await initData();
}

// 关闭主界面窗口
const hideWin = (params) => {
  let main_win = getCurrentWindow(emit_win); // 主窗口
  main_win.emit("verify-apply-friend-group");
  unlistenFn?.();
  inform_win.destroy();
}


/**
 * @params searchParams 分页参数 - 用于群组、用户列表加载
 * @function handleResetParams 重置搜索参数
 */

const searchParams = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
});

const handleResetParams = () => {
  searchParams.pageNum = 1;
  searchParams.total = 0;
  noMore.value = false;
}


/**
 * 分页加载
 */
const loadingMore = ref(false);
const noMore = ref(false);
const handleScroll = async (e) => {
  const el = e.target;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !loadingMore.value && !noMore.value) {
    loadingMore.value = true;
    searchParams.pageNum += 1;
    if (informType.value === '好友') {
      await handleGetFriendInformList();
    } else {
      await handleGetGroupInformList();
    }
  }
};


/**
 * 获取好友通知/群通知列表
 */
const informList = ref([]); // 用户列表
const initData = async () => {
  try {
    handleResetParams();
    if (informType.value === '好友') {
      await handleGetFriendInformList();
    } else {
      await handleGetGroupInformList();
    }
  } catch (error) {
    console.error('初始化消息通知数据列表失败', error)
  }
}

// 加载好友申请列表
const handleGetFriendInformList = async () => {
  const res = await getFriendApplyList(searchParams);
  console.log(res)
  if (res.code === 200) {
    if (searchParams.pageNum === 1) {
      informList.value = res.rows || [];
    } else {
      informList.value = [...informList.value, ...res.rows];
    }
    searchParams.total = res.total;
    noMore.value = informList.value.length >= res.total;
    loadingMore.value = false;
  }
}

// 加载群组通知列表
const handleGetGroupInformList = async () => {
  const res = await getGroupApplyList(searchParams);
  console.log(res)
  if (res.code === 200) {
    if (searchParams.pageNum === 1) {
      informList.value = res.data?.records || [];
    } else {
      informList.value = [...informList.value, ...res.data?.records];
    }
    searchParams.total = res.data.total;
    noMore.value = informList.value.length >= res.total;
    loadingMore.value = false;
  }
}


/**
 * 申请加群或好友
 */
const handleVerify = async (data, type) => {
  console.log(data)
  let main_win = getCurrentWindow(emit_win); // 主窗口

  if (informType.value === '好友') {
    let params = {
      applyId: data.id,
      status: type === 'pass' ? true : false
    }
    const res = await auditFriendApply(params)
    if (res.code === 200) {
      proxy.$message.success("操作成功！");
      await handleGetFriendInformList();
      main_win.emit("verify-apply-friend-group-accept", {type: "好友"});
    } else {
      console.error("添加好友or群组失败")
    }
  } else {
    let params = {
      applyId: data.id,
      agree: type === 'pass' ? true : false
    }
    const res = await auditGroupApply(params)
    if (res.code === 200) {
      proxy.$message.success("操作成功！");
      await handleGetGroupInformList();
      main_win.emit("verify-apply-friend-group-accept", {type: "群组"});
    } else {
      console.error("添加好友or群组失败")
    }
  }
  
}

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
.inform-container {
  padding: 0px 20px 10px 20px;
}

.scroll-pane {
  height: calc(100vh - 110px); // 根据实际布局调整高度
  overflow-y: auto;
}

.inform-list {
  .inform-item-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    margin: 5px 0;
    border-bottom: 1px solid #e4e2e1;
    background-color: #fffcfa;
    border-radius: 5px;
    transition: background-color 0.2s ease;

    .inform-item-left {
      display: flex;
      flex-direction: column;

      .inform-item-left-top {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        text-align: center;
        .inform-name {
          color: #813103d5;
          font-size: 14px;
          margin-right: 5px;
        }
        .inform-tip {
          color: #5e5e5e;
          font-size: 13px;
          margin-right: 10px;
        }
        .inform-time {
          color: #9b9a9a;
          font-size: 12px;
        }
      }

      .inform-item-left-bottom {
        .inform-remark {
          color: #9b9a9a;
          font-size: 13px;
        }
      }

      
    }

    .inform-item-right {
      position: relative;
      display: flex;
      align-items: center;
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