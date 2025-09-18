<!-- 查看群组成员详细信息 -->
<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="title-header">
          <div class="title-content">
            <div class="title-text">
              {{ formData.groupName || "群组"}}
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

    <div class="group-existing-members">
      <div class="group-title-header">
        <div class="group-title-text"> 群组成员 </div>
        <div class="group-title-number">{{ formData.userNumber }}/{{ formData.userLimit }}</div>
      </div>
      
      <div class="group-member-list">
        <div 
          v-for="member in groupMembers" 
          :key="member.userId" 
          class="member-item" 
          @click="hanleOpenMemberDetail(member)"
        >
          <div
            type="primary"
            class="member-nickName"
          >
            {{ member.nickName }}
          </div>
          <el-tag
            v-if="member.userId === formData.ownerId"
            type="danger"
            class="member-tag"
          >
            群主
          </el-tag>
          <el-icon v-else @click.stop="handleRemoveMember(member)" class="delete-icon"><CloseBold/></el-icon>
        </div>
      </div>
    </div>

    <el-dialog v-model="memberDetailDialogVisible" title="成员详情" width="80%" :show-close="false">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="成员ID" label-align="right" align="center">{{ currentMember.userId }}</el-descriptions-item>
        <el-descriptions-item label="账号" label-align="right" align="center">{{ currentMember.userName }}</el-descriptions-item>
        <el-descriptions-item label="昵称" label-align="right" align="center">{{ currentMember.nickName }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
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
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloseBold, Search } from "@element-plus/icons-vue";
import { getGroupMemberList, removeGroupMember } from "../../../utils/groupManagement";
import customDragWindow from "../../components/public/customDragWindow.vue"; // 封装窗口拖拽

// 注意：myClient 已废弃，publicForm 现在使用安全的临时凭证上传
// 保留此变量是为了向后兼容，但不再使用硬编码的凭证
const myClient = ref({});
const { proxy } = getCurrentInstance();

let emit_win = 'main_task';
let group_member_win = getCurrentWindow("group_member_detail");

onMounted(async () => {
  console.log("群组成员 组件已挂载完毕");
  await group_member_win.emit("group-member-window-ready");
});

let unlistenFn;
const formData = ref({}); //表单数据
const userInfo = ref({}); // 用户信息
const ruleFormRef = ref(null); // 子组件表单
const loading = ref(false); // 加载动画标志
onMounted(async () => {
  // 监听来自父窗口的信息
  loading.value = true;
  try {
    unlistenFn = await listen("group-member-info", async (event) => {
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

  await loadGroupMembers();

  console.log("--整合后的数据--", formData.value)
}

// 关闭窗口
const hideWin = (type, params) => {
  if (isRemoveGroupMember.value) {
    getCurrentWindow(emit_win).emit("verify-apply-friend-group-accept", {type: "群组"});
  }
  formData.value = {};
  unlistenFn?.();
  group_member_win.destroy();
}


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
 * 查看成员详情
 */
const memberDetailDialogVisible = ref(false);
const currentMember = ref({});

const hanleOpenMemberDetail = (member) => {
  currentMember.value = member;
  memberDetailDialogVisible.value = true;
};

/**
 * 移除群组成员
 */
const isRemoveGroupMember = ref(false);
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
              formData.value.userNumber -= 1; // 更新群组成员数量
              isRemoveGroupMember.value = true;
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
  transform: none;;
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

:deep(.el-tag__content) {
  cursor: default;
}

.group-existing-members {
  padding: 0px 20px 10px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .group-title-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px 20px;
    .group-title-text {
      font-size: 17px;
      color: #7f3a12;
      font-weight: 600;
      background-blend-mode: multiply;
      text-shadow: 2px 3px 1px #8b451330;
    }
    .group-title-number {
      font-size: 15px;
      color: #4e453f;
      margin-left: 10px;
    }

    .group-title-icon {
      display: flex;
      align-items: center;
      margin-left: 30px;
    }
  }

  .group-search {
    width: 90%;
  }

  .group-member-list {
    display: flex;
    flex-direction: column;
    gap: 8px; // 成员之间留点空隙
    max-height: 460px;
    overflow-y: auto; // 超出时滚动
  }

  .member-item {
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
    background-color: #f5f0eb;

    .member-nickName {
      font-size: 15px;
      color: #7f3a12;
      font-weight: 500;
    }

    .delete-icon {
      margin-left: auto;
      color: #7f3a12;
      cursor: pointer;
      transition: color 0.3s ease;

      &:hover {
        color: #d9534f; // 鼠标悬停时的颜色
      }
    }
    
    .member-tag {
      margin-left: auto;
      font-size: 14px;
      color: #fff;
      background-color: #d9534f; // 群主标签颜色
    }

    &:hover {
      background-color: #e6e3e0;
    }
  }
}

</style>