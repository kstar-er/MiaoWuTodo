<template>
  <div class="group-management">
    <!-- 加载动画 -->
    <loadingAnimation :loading="loading" loadingText="加载群组数据中..." />
    <div class="container" v-if="!loading">
      <!-- 顶部搜索 -->
      <div class="filter">
        <el-input
          class="search-input"
          v-model="searchQuery"
          :placeholder="`搜索${currentTab}`"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
        <el-dropdown trigger="click">
          <span class="el-dropdown-link">
            <el-icon size="20" class="add-icon"><Plus /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="ChatLineRound" @click="handleCreateGroup('add', {})">创建群组</el-dropdown-item>
              <el-dropdown-item :icon="CirclePlus" @click="navigateTo('apply')">加好友/群</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 好友通知（好友申请列表） -->
      <!-- 群组通知（申请进入群组） -->
      <div class="top-item-box">
        <div class="item" @click="navigateTo('newFriends')">
          <div class="item-left">
            <div class="item-text">好友通知</div>
            <div class="dot-notification" v-if="friendInformNumber > 0"></div>
          </div>
          <el-icon class="item-icon"><ArrowRight /></el-icon>
        </div>
        <div class="item" @click="navigateTo('groupMessages')">
          <div class="item-left">
            <div class="item-text">群组通知</div>
            <div class="dot-notification" v-if="groupInformNumber > 0"></div>
          </div>
          <el-icon class="item-icon"><ArrowRight /></el-icon>
        </div>
      </div>

      <el-tabs v-model="currentTab" class="sticky-tabs" @tab-click="handleTabClick" stretch>
         <template #default>
               <!-- 群组列表 -->
               <el-tab-pane label="群组" name="群组">
            <template #default>
              <div class="group-list scroll-pane" @scroll="handleScroll">
                <!-- 群组列表内容 -->
                <div 
                  v-for="group in groupList" 
                  :key="group.id" 
                  class="group-item-box" 
                  v-if="groupList.length > 0"
                  @click="navigateTo('groupMemberDetail', group)"
                >
                  <div class="group-item-left">
                    <div class="group-name"> {{ group.groupName }}</div>
                    <div class="group-person">
                      {{ '群组成员：' + group.userNumber + '/' + group.userLimit }}
                    </div>
                  </div>
                  <div class="group-item-right">
                    <el-dropdown>
                      <span class="el-dropdown-link">
                        <el-icon class="group-item-icon"><MoreFilled /></el-icon>
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="handleInviteMember(group)">群组邀人</el-dropdown-item>
                          <el-dropdown-item @click="handleCopyInviteLink(group)" class="invite-link-btn">邀请链接</el-dropdown-item>
                          <el-dropdown-item @click="handleShowEditGroupName(group)">修改群组名</el-dropdown-item>
                          <el-dropdown-item @click="handleDelete(group)">删除群组</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                <div v-if="groupList.length > 0">
                  <div v-if="loadingMore" class="loading-more">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>加载更多...</span>
                  </div>
                  <div v-if="noMore && !loadingMore" class="no-more">没有更多数据了</div>
                </div>
                <div v-else class="no-data">
                  <el-empty description="暂无群组" />
                </div>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane label="好友" name="好友">
            <template #default>
              <!-- 可滚动内容区域 -->
              <div class="friend-list scroll-pane" @scroll="handleScroll">
                <!-- 好友列表内容 -->
                <div v-for="friend in friendList" :key="friend.friendId" class="friend-item-box" v-if="friendList.length > 0">
                  <div class="friend-item-left">
                    <div class="friend-name"> {{ friend.nickName }}</div>
                    <div class="friend-username"> {{ friend.userName }}</div>
                  </div>
                  <div class="friend-item-right">
                    <el-dropdown>
                      <span class="el-dropdown-link">
                        <el-icon class="friend-item-icon"><MoreFilled /></el-icon>
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="handleDelete(friend)">删除好友</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>

                <div v-if="friendList.length > 0">
                  <div v-if="loadingMore" class="loading-more">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>加载更多...</span>
                  </div>
                  <div v-if="noMore && !loadingMore" class="no-more">我也是有底线的</div>
                </div>
                <div v-else class="no-data">
                  <el-empty description="暂无好友" />
                </div>

              </div>
            </template>
          </el-tab-pane>

     
        </template>
      </el-tabs>
    </div>
  </div>
  <applyFriendOrGroup v-model="showApplyDialog" @update="handleApplyUpdate"/>
</template>

<script setup>
import { onMounted, onUnmounted, ref, getCurrentInstance, onBeforeMount, reactive } from "vue";
import loadingAnimation from "../components/public/loadingAnimation.vue";
import { Search, ArrowRight, MoreFilled, Plus, ChatLineRound, CirclePlus} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { createInformWin, createOrEditGroupWin, createGroupMemberDetailWin } from "../../multiwins/action";
import { listen } from "@tauri-apps/api/event";
import applyFriendOrGroup from "./components/applyFriendOrGroupDialog.vue";
import {
  getGroupList,
  dissolveGroup,
  deleteFriend,
  getFriendList,
  getPendingFriendApplyTotal,
  getPendingGroupApplyTotal,
  updateGroupName
} from "../../utils/groupManagement";

const proxy = getCurrentInstance().proxy;

onBeforeMount(() => {
  loading.value = true;
  initData();
  getFriendApplyNumber();
  getGroupInformNumber();
  loading.value = false;
});

const userInfo = ref(null);
let unlistenFn, unlistenFn1, unlistenFn2, unlistenFn3;
onMounted(async() => {
  // 获取当前登录的用户信息
  if (userInfo.value === null) {
    if (sessionStorage.getItem("userInfo")) {
      userInfo.value = JSON.parse(sessionStorage.getItem("userInfo")).user;
    }
  }

  // 监听来自 申请好友/群组 窗口提交的事件
  try {
    unlistenFn = await listen("apply-friend-group", async (event) => {
      getFriendApplyNumber();
      getGroupInformNumber();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  // 监听来自 审批验证好友/群组 窗口提交的事件
  try {
    unlistenFn1 = await listen("verify-apply-friend-group", async (event) => {
      getFriendApplyNumber();
      getGroupInformNumber();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn2 = await listen("group-info-updated", async (event) => {
      const { action, data } = event.payload;
      proxy.$message.success(`${action === "add" ? "新增群组成功" : "群组拉人成功"}`); // 发送提示信息
      currentTab.value = "群组"; // 切换到群组标签
      handleResetParams(); // 重置分页参数
      await getGroupsList(); // 重新加载群组列表
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn3 = await listen("verify-apply-friend-group-accept", async (event) => {
      const { type } = event.payload;
      handleResetParams();
      if (type === "好友") {
        getFriendApplyNumber();
        await getFriendsList();
      } else if (type === "群组") {
        getGroupInformNumber();
        await getGroupsList();
      }
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
})

// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
  unlistenFn1?.();
  unlistenFn2?.();
  unlistenFn3?.();
});

/**
 * 加载数据列表
 * 好友列表、群组列表
 */
const loading = ref(false);
const initData = async () => {
  console.log("---加载数据---");

  try {
    handleResetParams();
    if (currentTab.value === "好友") {
      await getFriendsList();
    } else if (currentTab.value === "群组") {
      await getGroupsList();
    }
  } catch (error) {
    console.error("加载数据时发生错误:", error);
  }
};


/**
 * 分页加载
 * @function handleRestParams 重置分页参数
 */
const searchParams = reactive({
  pageNum: 1,
  pageSize: 20,
  groupName: "",
  nickName: "",
  total: 0
});
const loadingMore = ref(false);
const noMore = ref(false);

const handleScroll = async (e) => {
  const el = e.target;
  if (el.target + el.clientHeight >= el.scrollHeight - 10 && !loadingMore.value && !noMore.value) {
    loadingMore.value = true;
    searchParams.pageNum += 1;
    if (currentTab.value === "好友") {
      await getFriendsList();
    } else {
      await getGroupsList();
    }
  }
}

// 重置分页参数
const handleResetParams = () => {
  searchParams.pageNum = 1;
  searchParams.total = 0;
  noMore.value = false;
}

/**
 * 加载好友列表
 * 加载群组列表
 */
const friendList = ref([]); // 好友列表数据
const groupList = ref([]);  // 群组列表数据

const getFriendsList = async () => {
  try {
    const res = await getFriendList(searchParams);
    if (res.code === 200) {
      if (searchParams.pageNum === 1) {
        friendList.value = res.rows || [];
      } else {
        friendList.value = [ ...friendList.value , ...res.rows] ;
      }
      searchParams.total = res.total;
      noMore.value = friendList.value.length >= res.total;
    } else {
      console.error("获取好友列表失败:", res.message);
    }
  } catch (error) {
    console.error("加载好友列表时发生错误:", error);
  }
};

const getGroupsList = async () => {
  try {
    const res = await getGroupList(searchParams);
    console.log("获取群组列表结果:", res);
    if (res.code === 200) {
      if (searchParams.pageNum === 1) {
        groupList.value = res.data.records || [];
      } else {
        groupList.value = [ ...groupList.value , ...res.data] ;
      }
      searchParams.total = res.data.total;
      noMore.value = groupList.value.length >= res.data.total;
    } else {
      console.error("获取群组列表失败:", res.message);
    }
  } catch (error) {
    console.error("加载群组列表时发生错误:", error);
  }
};


/**
 * 获取好友通知、群组列表数量
 */
const friendInformNumber = ref(0);
const groupInformNumber = ref(0);
const getFriendApplyNumber = async () => {
  const res = await getPendingFriendApplyTotal({ pageNum: 1, pageSize: 999});
  console.log("获取好友申请数量结果:", res);
  if (res.code === 200) {
    friendInformNumber.value = res.data || 0; // 如果没有数据，默认为0
  }
}

const getGroupInformNumber = async () => {
  const res = await getPendingGroupApplyTotal();
  if (res.code === 200) {
    console.log("获取群组申请数量结果:", res);
    groupInformNumber.value = res.data || 0; // 如果没有数据，默认为0
  }
}

const handleApplyUpdate = async (data) => {
  console.log("handleApplyUpdate data:", data);
  if (data.type === 'user') {
    await getFriendApplyNumber();
  } else {
    await getGroupInformNumber();
  }

  showApplyDialog.value = false; // 关闭弹窗
}

/**
 * 切换好友/群组标签
 */
const currentTab = ref("好友"); // 设置默认选择标签

const handleTabClick = async (tab) => {
  console.log("当前选中的标签页:", tab.props.name);
  handleResetParams();
  if (tab.props.name === "好友") {
    await getFriendsList();
  } else{
    await getGroupsList();
  }
};

/**
 * 搜索
 */
const searchQuery = ref(""); // 搜索关键词
const handleSearch = async () => {
  if (currentTab.value === '好友') {
    searchParams.nickName = searchQuery.value;
  } else {
    searchParams.groupName = searchQuery.value;
  }

  await initData();
}

/**
 * 创建或编辑群组
 */const handleCreateGroup = async (type, data) => {
  await resetLocalFormdata();
  if (type === 'add') {
    sessionStorage.setItem("formdata", JSON.stringify({}));
    await createOrEditGroupWin();
    return;
  } else {
    const formdata = {...data};
    sessionStorage.setItem("formdata", JSON.stringify(formdata));
    await createOrEditGroupWin();
    return;
  }
}

/**
 * @function navigateTo 打开 加好友/群组弹窗, 群组成员详情窗口, 消息通知 窗口
 */

const showApplyDialog = ref(false); // 控制加好友/群组弹窗的显示
const navigateTo = async (type, data) => {
  if (type === 'apply') {
    // 加好友或群组弹窗
    showApplyDialog.value = true;
    return;
  } else if (type === 'groupMemberDetail') {
    sessionStorage.removeItem("formdata");
    sessionStorage.setItem("formdata", JSON.stringify(data));
    // 打开群组成员详情窗口
    await createGroupMemberDetailWin();
    return;
  } else {
    // 好友通知、群组通知 窗口
    sessionStorage.removeItem("informType");
    if (type === 'newFriends') {
      sessionStorage.setItem("informType", '好友');
    } else {
      sessionStorage.setItem("informType", '群组');
    }
    await createInformWin();
    return;
  } 
}

/**
 * 邀请好友加入群组
 * @param group 群组信息
 * @param friendId 好友ID
 */
const handleInviteMember = async (group) => {
  handleCreateGroup('edit', group); // 打开编辑群组窗口
}

const handleCopyInviteLink = async (group) => {
  const inviteLink = group.inviteLink; // 假设这是群组的邀请链接
  try {
    await navigator.clipboard.writeText(inviteLink);
    proxy.$message.success("群组邀请链接已复制到剪贴板");
  } catch (error) {
    console.error("复制邀请链接失败:", error);
    proxy.$message.error("复制邀请链接失败，请手动复制");
  }
}

/**
 * 修改群组名
 * @param group 群组信息
 */
const handleShowEditGroupName = async (group) => {
  try {
    const { value, action } = await ElMessageBox.prompt('请输入新的群组名', '修改群组名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '新的群组名不能为空'
    });

    if (action === 'confirm') {
      const res = await updateGroupName({
        groupId: group.id,
        newGroupName: value
      });

      if (res.code === 200) {
        proxy.$message.success("群组名修改成功");
        group.groupName = value; // 更新群组名
      } else {
        proxy.$message.error("修改群组名失败：" + res.message);
      }
    }
  } catch (error) {
    if (error === 'cancel') {
      proxy.$message.info("修改群组名已取消");
      return;
    }
    console.error("修改群组名时发生错误:", error);
  }
};


/**
 * 删除好友或群组
 * @param item 删除的好友或群组
 * @param friendId 好友ID
 * @param groupId 群组ID
 */
const handleDelete = async (item) => {
  proxy.$alert(`是否确认删除${currentTab.value}`, '提示', {
    type: 'error',
    showCancelButton: true,
    cancelButtonText: '再想想',
    confirmButtonText: '确认删除',
    confirmButtonClass: 'delete-confirm-btn',
    callback: async (action) => {
      if (action === 'cancel') return
      else {
        if (currentTab.value === '群组') {
          const groupId = item.id;
          await dissolveGroup({groupId}).then((res) => {
            if (res.code === 200) {
              proxy.$message.success(`成功删除该群组${item.groupName}`);
              initData();
            }
          });
        } else {
          const friendId = item.friendId;
          await deleteFriend({friendId}).then((res) => {
            if (res.code === 200){
              proxy.$message.success(`成功删除该好友${item.nickName}`);
              initData();
            }
          })
        } 
      }
    }
  })
};

/**
 * 重置本地存储
 */
const resetLocalFormdata = async () => {
  if (sessionStorage.getItem("formdata")) {
    sessionStorage.removeItem("formdata");
  }
};

defineExpose({ initData }); // 将加载数据方法暴露给父组件
</script>

<style lang="less" scoped>

.group-management {
  padding: 20px 12px;
  color: #552505;
  font-size: 14px;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
}

.filter {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  align-items: center;
  .search-input {
    width: 98%;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  .add-icon {
    margin-left: 5px;
    cursor: pointer;
    color: #909399;
    background-color: #ffffff;
    padding: 5px;
    border-radius: 3px;
    transition: color 0.3s, background-color 0.3s;
    &:hover {
      color: #c77b48;
      background-color: antiquewhite;
    }
  }
}

.top-item-box {
  background-color: #fffcfa;
  margin-bottom: 12px;
  
  .item {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid #e4e2e1;
    transition: background-color 0.2s ease;
    .item-left {
      display: flex;
      justify-content: flex-start;
      width: 80%;
      .dot-notification {
        color: #fff;
        background-color: #bd0b0b;
        border-radius: 50%;
        width: 8px;
        height: 8px;
      }
    }
    .item-icon {
      display: inline-block;
      width: 20%;
      text-align: right;
      color: #909399;
    }
    &:hover {
      background-color: #f8eadf;
    }
  }

  
}

.sticky-tabs {
  margin: 0 5px;
  position: sticky;
  top: 0;
}

.scroll-pane {
  height: calc(100vh - 313px); // 根据实际布局调整高度
  overflow-y: auto;
}

.friend-list {
  .friend-item-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    margin: 5px 0;
    border-bottom: 1px solid #e4e2e1;
    background-color: #fffcfa;
    border-radius: 2px;
    cursor: default;

    .friend-item-left {
      display: flex;
      flex-direction: column;

      .friend-name {
        font-weight: bold;
        color: #333;
      }

      .friend-username {
        opacity: 0.7;
        font-size: 12px;
      }
    }

    .friend-item-right {
      position: relative;
      display: flex;
      align-items: center;

      .friend-item-icon {
        cursor: pointer;
        color: #909399;
      }
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
    cursor: default;

    .group-item-left {
      display: flex;
      flex-direction: column;

      .group-name {
        font-weight: bold;
        color: #333;
      }

      .group-person {
        opacity: 0.7;
        font-size: 12px;
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

.friend-list, .group-list {
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
  font-size: 12px;
}
</style>
