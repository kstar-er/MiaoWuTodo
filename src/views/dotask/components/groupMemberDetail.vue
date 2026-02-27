<!-- 查看群组成员详细信息 -->
<template>
  <main class="container">
    <customDragWindow>
      <template #header>
        <div class="title-header">
          <div class="title-content">
            <div class="title-box">
              <div class="title-text">
                {{ formData.groupName || "群组"}}
              </div>
              <div class="title-action" v-if="isGroupOwner">
                <el-tooltip content="修改群名">
                  <el-icon class="title-icon" @click.stop="handleEditGroupName"><EditPen /></el-icon>
                </el-tooltip>
              </div>
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
          <div class="member-nickName">
            {{ member.nickName }}
          </div>
          <el-tag
            v-if="member.userId === formData.ownerId"
            type="danger"
            class="member-tag"
          >
            群主
          </el-tag>

          <el-icon 
            v-if="isGroupOwner && member.userId !== formData.ownerId" 
            @click.stop="handleRemoveMember(member)" 
            class="delete-icon"
          >
            <CloseBold/>
          </el-icon>
        </div>
        <div class="group-member-actions">
          <el-tooltip
            v-if="isGroupOwner"
            content="群组邀人" 
            placement="bottom"
            effect="dark"
          >
            <el-button
              style="float: left; margin-right: 15px; width: 35px; height: 35px;"
              @click="handleInviteMember"
              class="btn-base btn-primary"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip
            content="复制邀请链接"
            effect="dark"
          >
            <el-button
              @click="handleCopyInviteLink"
              class="btn-base btn-default link-button"
            >
              <div class="icon-link"></div>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      
      <div class="footer-actions" v-if="isGroupOwner">
        <el-tooltip
          content="解散群组"
          effect="dark"
        >
          <el-button
            @click="handleDelete"
            class="btn-base btn-danger delete-button"
          >
            <div class="delete"></div>
          </el-button>
        </el-tooltip>
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
import { CloseBold, EditPen, Search } from "@element-plus/icons-vue";
import { getGroupMemberList, removeGroupMember, updateGroupName,dissolveGroup } from "../../../utils/groupManagement";
import customDragWindow from "../../components/public/customDragWindow.vue"; // 封装窗口拖拽
import { ElMessageBox } from 'element-plus';
import { createOrEditGroupWin } from "../../../multiwins/action";

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

let unlistenFn, unlistenFn1;
const formData = ref({}); //表单数据
const loginUser = ref({}); // 用户信息
const isGroupOwner = ref(false); // 登录用户是否是群主

onMounted(async () => {
  // 监听来自父窗口的信息
  try {
    unlistenFn = await listen("group-member-info", async (event) => {
      await initDataSource(event);
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }

  try {
    unlistenFn1 = await listen("group-member-updated", async (event) => {
      await loadGroupMembers();
      return;
    });
  } catch (error) {
    console.error("事件监听设置失败:", error);
  }
});


// 在组件卸载时移除监听器
onUnmounted(() => {
  unlistenFn?.();
  unlistenFn1?.();
});

const initDataSource = async (event) => {
  const { formdata, token, userInfo } = event.payload;

  // 存储编辑或新增信息到本地
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("userInfo", JSON.stringify(userInfo))
  formData.value = formdata;
  loginUser.value = userInfo.user || userInfo;

  console.log("接收到的表单数据:", userInfo);

  if (loginUser.value.userId === formdata.ownerId) isGroupOwner.value = true;

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
  unlistenFn1?.();
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
 * 复制邀请链接
 */
const handleCopyInviteLink = async () => {
  const inviteLink = formData.value.inviteLink; // 群组的邀请链接
  try {
    await navigator.clipboard.writeText(inviteLink);
    proxy.$message.success("群组邀请链接已复制到剪贴板");
  } catch (error) {
    console.error("复制邀请链接失败:", error);
    proxy.$message.error("复制邀请链接失败，请手动复制");
  }
}

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

/**
 * 修改群组名
 * @param group 群组信息
 */
const handleEditGroupName = async () => {
  try {
    const { value, action } = await ElMessageBox.prompt('请输入新的群组名', '修改群组名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '新的群组名不能为空'
    });

    if (action === 'confirm') {
      const res = await updateGroupName({
        groupId: formData.value.id,
        newGroupName: value
      });
      
      if (res.code === 200) {
        proxy.$message.success("群组名修改成功");
        formData.value.groupName = value; // 更新群组名
        getCurrentWindow(emit_win).emit("group-name-change", {type: "群组", data: formData.value})
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
 * 邀请好友加入群组
 */
const handleInviteMember = async () => {
  sessionStorage.setItem("formdata", JSON.stringify(formData.value));
  await createOrEditGroupWin('group_member_detail');
}

/**
 * 删除群组
 */
const handleDelete = async () => {
  proxy.$alert(`是否确认解散群组：${formData.value.groupName}`, '提示', {
    type: 'error',
    showCancelButton: true,
    cancelButtonText: '再想想',
    confirmButtonText: '确认解散',
    confirmButtonClass: 'delete-confirm-btn',
    callback: async (action) => {
      if (action === 'cancel') return
      else {
        await dissolveGroup({groupId: formData.value.id}).then(async(res) => {
          if (res.code === 200) {
            await getCurrentWindow('main_task').emit("group-delete", {type: "群组", data: formData.value})
            formData.value = {};
            unlistenFn?.();
            unlistenFn1?.();
            group_member_win.destroy();
          } else {
            proxy.$message.error("解散群组失败：" + res.message);
          }
        });
      }
    }
  })
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
    .title-box {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      
      .title-text {
        cursor: default;
        font-size: larger;
        color: #7f3a12;
        font-weight: 600;
        background-blend-mode: multiply;
        text-shadow: 2px 3px 1px #8b451330;
      }

      .title-action {
        display: flex;
        margin-left: 10px;
        .title-icon {
          padding: 5px;
          background-color: #ffffff56;
          border-radius: 50%;
          cursor: pointer;
          color: #8b4513;
          font-size: 16px;
          transition: all 0.3s ease;
          &:hover {
            color: #fff;
            background-color: #8b4513;
            transform: scale(1.1) rotate(10deg);
          }
        }
      }
    }
  }
}

:deep(.el-tag__content) {
  cursor: default;
}

.group-existing-members {
  padding: 0px 20px;
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
    height: 430px;
    overflow-y: auto; // 超出时滚动
    .group-member-actions {
      padding: 5px 0px;
    }
  }

  .member-item {
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    justify-content: space-between;
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
      transition: all 0.3s ease;

      &:hover {
        color: #d9534f; // 鼠标悬停时的颜色
        transform: rotate(90deg) scale(1.3);
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

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    .delete-button {
      width: 35px;
      height: 35px;
      .delete {
        width: 18px;
        height: 18px;
        background-image: url('/deleteRed.svg');
        background-size: cover;
        transition: all 0.3s ease;
      }
      &:hover .delete {
        background-image: url('/deleteWhite.svg');
      }
    }
  }
}

.link-button {
  margin-left: 0px;
  float: left;
  width: 35px;
  height: 35px;
  .icon-link {
    width: 18px;
    height: 18px;
    background-image: url('/link.svg');
    background-size: cover;
    transition: all 0.3s ease;
  }
  &:hover .icon-link {
    background-image: url('/linkHover.svg');
  }
}
</style>