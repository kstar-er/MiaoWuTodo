<!-- 创建群组 -->
<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="title-header">
          <div class="title-content">
            <div class="title-text">
              {{ formData?.id ? formData.groupName : '新建群组'}}
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
    
    <publicForm
      ref="ruleFormRef"
      :label-width="'110px'"
      :form-data="formData"
      :form-input-el="addOrEditTask.formInputEl"
      :form-select-el="addOrEditTask.formSelectEl"
      :form-text-area-el="addOrEditTask.formTextAreaEl"
      :form-upload-el="addOrEditTask.formUploadEl"
      :form-time-and-number="addOrEditTask.formTimeAndNumber"
      :form-paste-image-el="addOrEditTask.formPasteImageEl"
      :my-client="myClient"
      @hide-win="hideWin"
      @input-done="addOrEditTask.inputDone"
    >
      <template #append>
        <el-form-item
          v-if="formData?.id"
          label="已有成员"
          prop="exitsmember"
          class="form-item full-width"
        >
          <div class="group-existing-members">
            <el-tag
              v-for="member in groupMembers" 
              :key="member.userId" 
              closable 
              @close="handleRemoveMember(member)"
              :type="member.nickName === userInfo.nickName ? 'danger' : 'primary'"
              class="member-tag"
            >
              {{ member.nickName || member.userName }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item
          label="新增群组成员"
          prop="member"
          class="form-item full-width"
        >
          <div class="group-members-container">
            <!-- 左侧：搜索框 + 好友列表 -->
            <div class="left-panel">
              <div class="search-input">
                <el-input 
                  placeholder="搜索好友" 
                  v-model="searchFriend" 
                  :prefix-icon="Search"
                  @keyup.enter="doSearchFriend"
                />
              </div>
              
              <div class="friends-list">
                <el-scrollbar @scroll="handleScroll">
                  <el-checkbox-group v-model="selectedFriends" class="friend-checkbox-group">
                    <el-checkbox
                      v-for="friend in friendsList" 
                      :key="friend.friendId" 
                      :value="friend.friendId"
                      :disabled="groupMembers.some(member => member.userId === friend.friendId)"
                      class="friend-checkbox-item"
                    >
                      {{ friend.nickName }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-scrollbar>
              </div>
            </div>

            <!-- 右侧：已选好友展示区 -->
            <div class="right-panel">
              <div class="stats">已选 {{ selectedFriends.length }} 个好友</div>
              <div class="selected-friends-list">
                <el-tag 
                  v-for="friendId in selectedFriends" 
                  :key="friendId" 
                  closable 
                  @close="handleClose(friendId)"
                  @click="handleClose(friendId)"
                  class="selected-friend-tag"
                >
                  {{ getFriendName(friendId) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-form-item>
      </template>
    </publicForm>
  </main>
</template>

<script setup>
import {
  onMounted,
  reactive,
  ref,
  onUnmounted,
  getCurrentInstance,
  nextTick
} from "vue";
import publicForm from "../../components/public/publicForm.vue"; // 封装表单
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloseBold, Search } from "@element-plus/icons-vue";
import { addGroupMember, createGroup, getFriendList, getGroupMemberList, removeGroupMember } from "../../../utils/groupManagement";
import customDragWindow from "../../components/public/customDragWindow.vue"; // 封装窗口拖拽

// 注意：myClient 已废弃，publicForm 现在使用安全的临时凭证上传
// 保留此变量是为了向后兼容，但不再使用硬编码的凭证
const myClient = ref({});
const { proxy } = getCurrentInstance();

let emit_win = 'main_task';
let create_group_win = getCurrentWindow("create_edit_group");

onMounted(async () => {
  console.log("创建群组 组件已挂载完毕");
  await create_group_win.emit("create-group-window-ready");
});

const searchParams = {
  pageNum: 1,
  pageSize: 20,
  nickName: '',
  total: 0
};

let unlistenFn;
const formData = ref({}); //表单数据
const userInfo = ref({}); // 用户信息
const ruleFormRef = ref(null); // 子组件表单
const loading = ref(false); // 加载动画标志
onMounted(async () => {
  // 监听来自父窗口的信息
  loading.value = true;
  try {
    unlistenFn = await listen("create-edit-group-info", async (event) => {
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

const initDataSource = async (event) => {
  const { formdata, token, userInfo } = event.payload;

  // 存储编辑或新增信息到本地
  sessionStorage.setItem("token", token);
  formData.value = formdata;
  userInfo.value = userInfo.user;

  console.log("接收到的表单数据:", userInfo.value);
  if (formData.value?.id) {
    // 编辑模式
    addOrEditTask.formTextAreaEl[0].disabled = true; // 备注不可编辑
    addOrEditTask.formTextAreaEl[0].placeholder = formData.value.remark || "暂无群组备注";
    await loadGroupMembers();
  } else {
    // 新建模式
    console.log("新建群组");
    addOrEditTask.formInputEl = [];
    addOrEditTask.formInputEl.push({
      title: "群组名称",
      key: "groupName",
      element: "input",
      rules: [
        {
          required: true,
          message: "该项不能为空",
          trigger: "blur",
        },
      ],
      fullWidth: true
    });
  }

  handleResetParams(); // 重置分页参数
  await handleGetFriendsList();
  nextTick(()=> { // 手动强制刷新表单数据
    ruleFormRef.value?.updateFormData(formData.value);
  })

  console.log("--整合后的数据--", formData.value)
}

// 关闭窗口
const hideWin = (type, params) => {
  let main_win = getCurrentWindow(emit_win);
  if (type === 'groupAddOrEdit') {
    main_win.emit("group-info-updated", {action: formData.value.id ? "updated" : "add", data: params})
  } else {
    main_win.emit(`group-detail-info-close`, {action: "cancel"})
  }
  formData.value = {};
  unlistenFn?.();
  create_group_win.destroy();
}

// 表单数据
const addOrEditTask = reactive({
  formInputEl: [],
  formTimeAndNumber: [],
  formSelectEl: [],
  formTextAreaEl: [
    {
      title: "备注",
      key: "remark",
      element: "input",
      type: "textarea",
      minRows: 2,
      maxRows: 4,
      fullWidth: true,
      disabled: false,
    },
  ],
  formPasteImageEl: [],
  inputDone: async (val) => {
    
    if (formData.value.id) {
      // 编辑群组---拉人
      let params = {
        groupId: formData.value.id,
        userIdList: selectedFriends.value
      }
      addGroupMember(params).then((res) => {
        console.log("----提交的参数4----", res)
        if (res && res.code === 200){
          proxy.$message.success('操作成功');
          hideWin('groupAddOrEdit', params);
        }
      })
    } else {
      let params = { ...formData.value, ...val };
    
      if (selectedFriends.value.length > 0) {
        params.userIdList = selectedFriends.value; // 群组成员
      }

      console.log("----提交的参数3----", params)
      // 新建群组
      createGroup(params).then((res) => {
        console.log("----提交的参数4----", res)
        if (res && res.data?.code === 200){
          proxy.$message.success('操作成功');
          hideWin('groupAddOrEdit', params);
        }
      })
    }
    
  },
});


const searchFriend = ref('');
const friendsList = ref([]); // 假设这是你的全部好友列表
const selectedFriends = ref([]);
const loadingMore = ref(false);
const noMore = ref(false);
const handleGetFriendsList = async () => {
  const res = await getFriendList(searchParams);
  console.log("好友", res)
  if (res.code === 200) {
    if (searchParams.pageNum === 1) {
      friendsList.value = res.rows || [];
    } else {
      friendsList.value = [ ...friendsList.value , ...res.rows];
    }
    searchParams.total = res.total;
    noMore.value = friendsList.value.length >= res.total;
  } else {
    console.error("获取好友列表失败:", res.message);
  }
}

const handleScroll = async (e) => {
  const el = e.target;
  if (el.target + el.clientHeight >= el.scrollHeight - 10 && !loadingMore.value && !noMore.value) {
    loadingMore.value = true;
    searchParams.pageNum += 1;
    await handleGetFriendsList();
  }
}

// 重置分页参数
const handleResetParams = () => {
  searchParams.pageNum = 1;
  searchParams.total = 0;
  noMore.value = false;
}

const doSearchFriend = async () => {
  handleResetParams();
  searchParams.nickName = searchFriend.value;
  await handleGetFriendsList();
}

// 获取好友名称（根据ID）
const getFriendName = (friendId) => {
  console.log("111---selectedFriends",selectedFriends.value)
  const friend = friendsList.value.find(friend => friend.friendId === friendId);
  return friend ? friend.nickName : '';
};

// 移除已选好友
const handleClose = (removeId) => {
  console.log("111---selectedFriends",selectedFriends.value)
  selectedFriends.value = selectedFriends.value.filter(friendId => friendId !== removeId);
};


/**
 * 获取群组成员
 */
const groupMembers = ref([]); // 群组成员列表
const loadGroupMembers = async () => {
  try {
    const res = await getGroupMemberList({
      groupId: formData.value.id
    });
    console.log("群组成员列表:", res);
    if (res.code === 200) {
      groupMembers.value = res.data || [];
    } else {
      console.error("获取群组成员失败:", res.message);
    }
  } catch (error) {
    console.error("加载群组成员时发生错误:", error);
  }
};

/**
 * 移除群组成员
 */
const handleRemoveMember = async (member) => {
  try {
    proxy.$alert(`确定要移除 ${member.nickName} 吗？`, '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '再想想',
      confirmButtonText: '确认移除',
      confirmButtonClass: 'delete-confirm-btn',
      callback: async (action) => {
        if (action === 'cancel') return
        else {
          await removeGroupMember({
            groupId: formData.value.id,
            userId: member.userId
          }).then((res) => {
            if (res.code === 200){
              groupMembers.value = groupMembers.value.filter(m => m.userId !== member.userId);
              proxy.$message.success('成员移除成功');
            } else {
              proxy.$message.error('移除成员失败: ' + res.message);
            }
          })
        }
      }
    })
  } catch (error) {
    console.error("移除群组成员时发生错误:", error);
    proxy.$message.error('移除成员时发生错误');
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

.group-members-container {
  display: flex;
  height: 380px;
  width: 347px;
  background-color: #fff;
  box-shadow: 0 0 0 1px var(--el-input-border-color,var(--el-border-color)) inset;
  border-radius: 5px;
  .left-panel {
    border-right: 1px solid #ebe4da;
    .search-input {
      padding: 10px 10px 5px 10px;
    }
    .friends-list {
      height: calc(100% - 54px); /* 减去搜索框的高度 */
      .friend-checkbox-group {
        margin-left: 10px;
        .friend-checkbox-item {
          display: block;
          margin: 3px;
          border-radius: 4px;
          background-color: #fff;
          transition: all 0.3s;
          display: flex;
          align-items: center;

          &:hover {
            background-color: #f5f7fa;
            border-color: #c6e2ff;
            color: #409eff;
          }
        }
      }
    }
  }
  .right-panel {
    .stats {
      font-size: 13px;
      color: #b1aaa2;
      display: flex;
      justify-content: flex-end;
      padding: 10px 10px 0px 0px;
    }
    .selected-friends-list {
      display: flex;
      flex-direction: column;

      .selected-friend-tag {
        margin: 3px 10px;
        transition: all 0.3s;
        display: flex;
        justify-content: space-between;
        padding: 0px 5px;
        font-size: 13px;

        &:hover {
          background-color: #f5f7fa;
          border-color: #c6e2ff;
          color: #409eff;
        }
      }
    }
  }
}

.left-panel, .right-panel {
  flex: 1;
}

:deep(.el-tag__content) {
  cursor: default;
}

.group-existing-members {
  max-height: 96px;
  overflow-y: auto;
  .member-tag {
    margin-right: 5px;
  }
}

</style>