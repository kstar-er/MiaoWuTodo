<template>
  <main class="container">
    <!-- 顶部导航栏 -->
    <div class="custom-segmented">
      <el-segmented v-model="nowSetting" :options="settingItem" />
    </div>

    <!-- 账号设置-->
    <div class="user-box" v-if="nowSetting === '账号设置'">
      <el-card class="user-card has-glow">
        <div class="avatar-item">
          <div class="avatar-upload">
            <el-image
              :src="userInfo.avatar || defaultAvatar"
              class="avatar-image"
              fit="cover"
            >
              <template #error>
                <div class="avatar-image avatar-default">加载失败</div>
              </template>
            </el-image>
            <input
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              class="avatar-input"
            />
          </div>
        </div>

        <div class="user-info" v-if="!editingMode">
          <div class="user-item">
            <div class="left-label">账号</div>
            <div class="right-text">{{ userInfo.username }}</div>
          </div>
          <div class="user-item">
            <div class="left-label">昵称</div>
            <div class="right-text">{{ userInfo.nickname }}</div>
          </div>
          <div class="user-item">
            <div class="left-label">邮箱</div>
            <div class="right-text">{{ userInfo.email }}</div>
          </div>
          <div class="user-item">
            <div class="left-label">帐号状态</div>
            <div class="right-text">
              <el-tag :type="userInfo.status === '0' ? 'success' : 'danger'">{{ userInfo.status === '0' ? '正常' :
                '停用'}}</el-tag>
            </div>
          </div>
        </div>
        
        <div class="update-info" v-else>
          <el-input
            v-if="editingMode === 'info'"
            v-model="updateNickname"
            :prefix-icon="User"
            maxlength="20"
            placeholder="请输入昵称"
            show-word-limit
            type="text"
            style="margin-bottom: 10px;"
            clearable
          />
          <el-input
            v-if="editingMode === 'psw'"
            v-model="updatePsw"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入新密码"
            clearable
          />
        </div>

        <template #footer>
          <div class="footer-actions" v-if="!editingMode">
            <el-tooltip content="修改信息" effect="dark">
              <img src="/editUserInfo.svg"
                class="img-btn"
                alt="修改信息"
                style="width: 25px; height: 25px; margin-right: 30px;"
                @click="startEditInfo"
              />
            </el-tooltip>

            <el-tooltip content="修改密码" effect="dark">
              <img src="/updatepsw.svg"
                class="img-btn"
                alt="修改密码"
                style="width: 25px; height: 25px; margin-right: 30px;"
                @click="startEditPassword"
              />
            </el-tooltip>
            
            <el-tooltip content="切换用户" effect="dark">
              <img src="/changeUser.svg"
                class="img-btn"
                alt="切换用户"
                style="width: 25px; height: 25px;"
                @click="switchUser"
              />
            </el-tooltip>
          </div>

          <div class="footer-actions" v-else>
            <!-- 保存按钮 -->
            <el-tooltip 
              content="保存" 
              placement="bottom" 
              :hide-after="200"
              effect="dark"
            >
              <el-button
                type="primary"
                style="float: right; margin-right: 25px;"
                @click="handleSubmit"
                class="btn-base btn-primary"
                size="large"
                circle
              >
                <el-icon size="20"> <Select /> </el-icon>
              </el-button>
            </el-tooltip>

            <!-- 取消按钮 -->
            <el-tooltip 
              content="取消" 
              placement="bottom" 
              :hide-after="200"
              effect="dark"
            >
              <el-button
                type="danger"
                style="float: right; margin-right: 10px;"
                @click="cancelEdit"
                class="btn-base btn-danger"
                size="large"
                circle
              >
                <el-icon size="20"> <CloseBold/> </el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-card>

    </div>

    <!-- 通用设置-->
    <div v-if="nowSetting === '通用设置'" class="general-settings">
      <el-card class="settings-card">
        <!-- <div class="settings-item">
          <div class="left-label">开启使用提醒</div>
          <div class="right-content">
            <el-switch
              v-model="useToolTip"
              :active-action-icon="View"
              :inactive-action-icon="Hide"
              @change="handleChangeToolTip"
            />
          </div>
        </div> -->
        <div class="settings-item">
          <div class="left-label">重置筛选器设置</div>
          <div class="right-content">
            <el-button class="btn-base btn-primary" @click="resetFilters">重置</el-button>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">清空本地窗口缓存</div>
          <div class="right-content">
            <el-button class="btn-base btn-danger" @click="clearWindowCache">清空</el-button>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">当前版本</div>
          <div class="right-content version-info">
            <span class="version-text">{{ nowVersion }}</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">最新版本</div>
          <div class="right-content version-info">
            <span class="version-text" style="margin-right: 5px;">{{ version }}</span>
            <el-button 
              class="btn-base btn-default"
              @click="showUpdateContent"
            >
              更新内容
            </el-button>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">开启自动更新</div>
          <div class="right-content">
            <el-switch
              v-model="autoUpdate"
              :active-action-icon="Check"
              :inactive-action-icon="Close"
              @change="handleAutoUpdateChange"
            />
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">宠物管理</div>
          <div class="right-content">
            <el-button class="btn-base btn-primary" @click="openPetManagement">切换宠物</el-button>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">帮助</div>
          <div class="right-content">
            <el-button class="btn-base btn-primary" @click="goToHelp">查看帮助</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 帮助设置-->
    <div v-if="nowSetting === '帮助'" class="help-settings">
      <el-card class="settings-card">
        <div class="settings-item">
          <div class="left-label">新手指引</div>
          <div class="right-content">
            <el-button class="btn-base btn-primary" @click="startGuidedTour">新手指引</el-button>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">产品介绍</div>
          <div class="right-content">
            <p class="help-text">喵呜Todo是一款专为团队协作打造的任务管理工具，支持项目创建、任务分配、进度跟踪等功能。</p>
          </div>
        </div>
        <div class="settings-item">
          <div class="left-label">使用技巧</div>
          <div class="right-content">
            <ul class="help-tips">
              <li>• 项目中的进度支持自定义</li>
              <li>• 任务卡片点击下一步按钮，更新任务进度</li>
              <li>• 支持实时协作和消息通知</li>
            </ul>
          </div>
          <div class="left-label">开发计划</div>
          <div class="right-content">
            <ul class="help-tips">
              <li>• AI汇总项目内容自动化周报月报</li>
              <li>• 桌宠更加灵动，用户可以自定义桌宠</li>
              <li>• 快捷键功能开发</li>
              <li>• 新项目上线，不足之处请多多反馈</li>
            </ul>
          </div>
        </div>
        
      </el-card>
    </div>

    <!-- 新手指引组件 -->
    <GuidedTour ref="guidedTourRef" />

  </main>
</template>

<script setup>
import { getCurrentWindow, getAllWindows  } from '@tauri-apps/api/window';
import { onMounted, ref, onUnmounted, getCurrentInstance } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createLoginWin, createPetManagementWin } from "../../multiwins/action";
import { User, Lock } from '@element-plus/icons-vue';
import GuidedTour from "../../components/GuidedTour.vue";
import { clearWindowPositions } from '../../utils';
import packageJson from '../../../package.json';
import { checkUpdate, getVersion } from '../../utils/settings/update';
import { useRouter } from 'vue-router';
import { logout, updateProfile, updatePassword } from '../../utils/login';
import { uploadAvatarToOSS } from '../../utils/upload/secureOSSUpload.js';
import CryptoJS from 'crypto-js';
import { emit } from '@tauri-apps/api/event';
const { proxy } = getCurrentInstance();

// 引导组件引用
const guidedTourRef = ref(null);

const router = useRouter();
const userInfo = ref({});
const initData = async () => {
  console.log("---加载数据---");
  userInfo.value = JSON.parse(sessionStorage.getItem('userInfo')).user;
  if (localStorage.getItem("isShowToolTip")) {
    useToolTip.value = localStorage.getItem("isShowToolTip");
  }
};

defineExpose({ initData }); // 将加载数据方法暴露给父组件

const nowSetting = ref('账号设置');
const settingItem = ref([
  '账号设置', '通用设置'
])

/**
 * 修改头像
 */
const defaultAvatar = ref('/defaultAvatar.png'); // 默认头像
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await uploadAvatarToOSS(file);
    
    if (result.success) {
      let params = {
        ...userInfo.value,
        avatar: result.url
      }

      updateProfile(params).then(response => {
        console.log(response)
        if (response.code === 200) {
          // 更新localStorage中的用户信息
          userInfo.value.avatar = result.url;
          const storedInfo = JSON.parse(sessionStorage.getItem('userInfo'));
          storedInfo.user.avatar = result.url;
          sessionStorage.setItem('userInfo', JSON.stringify(storedInfo));

          // 更新localStorage中的头像与用户的映射信息
          const storeAvatarMap = JSON.parse(localStorage.getItem('userAvatars'));
          storeAvatarMap[userInfo.value.nickname] = result.url;
          localStorage.setItem('userAvatars', JSON.stringify(storeAvatarMap));

          proxy.$message.success("头像上传成功");
        }
      });
    } else {
      proxy.$message.error(`头像上传失败: ${result.error}`);
    }
  } catch (error) {
    console.error('上传失败:', error);
    proxy.$message.error('头像上传失败');
  }
};

/**
 * 分离编辑模式
 */
const editingMode = ref("")

// 取消编辑
const cancelEdit = () => {
  updateNickname.value = '';
  updatePsw.value = '';
  editingMode.value = ''
}

// 修改用户信息
const startEditInfo = () => {
  updateNickname.value = '';
  editingMode.value = 'info';
};

// 修改密码
const startEditPassword = () => {
  updatePsw.value = '';
  editingMode.value = 'psw';
};

// 统一处理
const handleSubmit = async () => {
  if (editingMode.value === 'info') {
    await handleUpdateUserInfo();
  } else if (editingMode.value === 'psw') {
    await handleUpdatePsw();
  }
};

/**
 * 修改密码
 */
const updatePsw = ref("");
const SECRET_KEY = "do-task-secret-key"; // 加密密钥
const handleUpdatePsw = async () => {
  const newPsw = updatePsw.value.trim();
  if (!newPsw) {
    proxy.$message.error('密码不能为空');
    return;
  }

  try {
    proxy.$alert(`确定要修改密码吗？`, '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '再想想',
      confirmButtonText: '确认',
      confirmButtonClass: 'delete-confirm-btn',
      callback: async (action) => {
        if (action === 'cancel') return
        else {
          let params = {
            password: newPsw
          }
          if (!newPsw) delete params.password;

          await updatePassword(params).then(response => {
            console.log(response)
            if (response.code === 200) {

              // 如果修改了密码，需要对应修改localStorage信息
              if (params.password) {
                let lastLoginInfo = {
                  username: userInfo.value.username,
                  password: newPsw
                }
                localStorage.removeItem('lastLoginInfo');
                const encryptedInfo = CryptoJS.AES.encrypt(
                  JSON.stringify(lastLoginInfo),
                  SECRET_KEY
                ).toString();
                localStorage.setItem('lastLoginInfo', encryptedInfo);
              }
              
              // 弹出提示信息，并关闭密码输入
              proxy.$message.success("修改密码成功");
              cancelEdit()
            } else {
              proxy.$message.error("修改密码失败");
            }
          });
        }
      }
    })
  } catch (error) {
    console.error("密码修改发生错误:", error);
    proxy.$message.error('密码修改发生错误');
  }
}

/**
 * 修改信息
 */
const updateNickname = ref("");
const handleUpdateUserInfo = async () => {
  const newNickname = updateNickname.value.trim();
  if (!newNickname) {
    proxy.$message.error('新昵称不能为空');
    return;
  }

  try {
    proxy.$alert(`确定要修改信息吗？`, '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '再想想',
      confirmButtonText: '确认',
      confirmButtonClass: 'delete-confirm-btn',
      callback: async (action) => {
        if (action === 'cancel') return
        else {
          let params = {
            nickname: newNickname
          }
          if (!newNickname) delete params.nickname;

          await updateProfile(params).then(response => {
            console.log(response)
            if (response.code === 200) {

              if (params.nickname) {
                // 更新localStorage中的用户信息
                userInfo.value.nickname = params.nickname;
                const storedInfo = JSON.parse(sessionStorage.getItem('userInfo'));
                storedInfo.user.nickname = params.nickname;
                sessionStorage.setItem('userInfo', JSON.stringify(storedInfo));
              }
              
              // 弹出提示信息，并关闭密码输入
              proxy.$message.success("修改信息成功!");
              cancelEdit()
            } else {
              proxy.$message.error("修改密码失败!");
            }
          });
        }
      }
    })
  } catch (error) {
    console.error("密码修改发生错误:", error);
    proxy.$message.error('密码修改发生错误');
  }
}

/**
 * 通用设置相关
 */
const useToolTip = ref(true); // 是否需要toolTip提醒
const handleChangeToolTip = () => {
  console.log(useToolTip.value)
  localStorage.setItem("isShowToolTip", useToolTip.value);
}

// 清空筛选器
const resetFilters = () => {
  ElMessageBox.confirm(
    '确定要重置筛选器设置吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      let params = {
        taskExecutor: [],
        priority: [],
        startTime: "",
        endTime: "",
        deadline: "",
      }
      localStorage.setItem("filter", JSON.stringify(params));
      localStorage.setItem("filterLength", 0);
      ElMessage.success('已重置筛选器选择');
    })
    .catch(() => {
      ElMessage.info('已取消重置');
    })
}

const clearWindowCache = () => {
  ElMessageBox.confirm(
    '确定要清空本地窗口缓存吗？此操作不可恢复',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      await clearWindowPositions();
      ElMessage.success('缓存已清空');
    })
    .catch(() => {
      ElMessage.info('已取消清空');
    })
}

// 启动新手指引
const startGuidedTour = () => {
  if (guidedTourRef.value) {
    guidedTourRef.value.triggerTour();
    proxy.$message.success('新手指引已启动');
  } else {
    proxy.$message.error('新手指引组件未加载');
  }
}

// 跳转到帮助页面
const goToHelp = () => {
  nowSetting.value = '帮助';
};

// 切换用户 事件
const main_win = getCurrentWindow('main_task');
const switchUser = async () => {
  ElMessageBox.confirm(
    '切换用户将重新登录，确定要切换用户吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {

        // 切换用户时，除了登录窗口、宠物窗口，其他所开的窗口均关闭
        const windows = await getAllWindows(); // 获取所有窗口实例
        const keepWindows = ['login', 'pet', 'main_task'];   // 白名单：保留的窗口 label

        for (const win of windows) {
          console.log(win.label)
          const label = win.label;

          if (!keepWindows.includes(label)) {
            try {
              // 尝试平滑关闭
              await win.close();
            } catch (err) {
              console.warn(`无法关闭窗口 ${label}:`, err);
            }
          }
        }
        
        // 调用后端退出登录接口
        await logout();
        
        // 清理所有相关缓存
        sessionStorage.clear(); // 清除所有 sessionStorage
        
        // 使用 Tauri 事件系统触发清除登录表单的事件
        await emit('logout-clear-form');
        
        await createLoginWin();
        await main_win.destroy();
        ElMessage.success('已退出登录');
      } catch (error) {
        console.error('退出登录失败:', error);
        // 即使后端调用失败，也要清理本地缓存
        sessionStorage.clear();
        localStorage.removeItem('lastLoginInfo');
        
        // 使用 Tauri 事件系统触发清除登录表单的事件
        await emit('logout-clear-form');
        
        await createLoginWin();
        await main_win.destroy();
        
        ElMessage.warning('退出登录时出现错误，已清理本地缓存');
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消切换',
      })
    })
}

const version = ref('')
const autoUpdate = ref(true)
const nowVersion = ref(packageJson.version)
let versionInfo = ref({
  data: {
    versionNumber: '1.0.0',
    downloadUrl: '',
    releaseNotes: ''
  }
})

const updateContent = ref('')

// 获取应用版本和自动更新设置
const getAppVersion = async () => {
  try {
    // 从 localStorage 获取自动更新设置
    const savedAutoUpdate = localStorage.getItem('autoUpdate')
    autoUpdate.value = savedAutoUpdate !== null ? JSON.parse(savedAutoUpdate) : true
    versionInfo = await getVersion()
    version.value = versionInfo.data.versionNumber

    checkUpdate(versionInfo)
    // 获取版本号
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
}

// 处理自动更新开关变化
const handleAutoUpdateChange = async (value) => {
  try {
    // 保存到 localStorage
    localStorage.setItem('autoUpdate', JSON.stringify(value))
    // 如果开启自动更新，立即检查更新
    if (value) {
      await checkUpdate(versionInfo);
    }
  } catch (error) {
    console.error('保存自动更新设置失败:', error)
  }
}

const showUpdateContent = () => {
  router.push({
    name: 'updateContent',
    query: {
      content: updateContent.value
    }
  })
}

// 打开宠物管理页面
const openPetManagement = async () => {
  try {
    await createPetManagementWin();
    ElMessage.success('宠物管理页面已打开');
  } catch (error) {
    console.error('打开宠物管理页面失败:', error);
    ElMessage.error('打开宠物管理页面失败');
  }
}

onMounted(async () => {
  await initData();
  await getAppVersion();
  try {
    console.log('获取版本信息：', versionInfo)
    updateContent.value = versionInfo.data.updatedContent || '暂无更新内容'
  } catch (error) {
    console.error('获取版本信息失败:', error)
    version.value = '获取失败'
    updateContent.value = '获取更新内容失败'
  }
  
})

onUnmounted(() => {

})
</script>

<style lang="less" scoped>
@import "../../assets/global.less"; // 复用按钮样式

@keyframes shine-sweep {
  0%   { transform: translate(-20%, -20%) rotate(0deg); }
  100% { transform: translate(140%, 40%) rotate(0deg); }
}

.container {
  height: 100vh;
  position: relative;

  .custom-segmented {
    padding: 10px 0px;
    display: flex;
    justify-content: center;

    .el-segmented {
      width: 70%;
      font-size: 15px;
      --el-segmented-item-selected-bg-color: #9b6545;
      --el-border-radius-base: 16px;
      --el-segmented-bg-color: #ffffff;
    }
  }

  .user-box {
    padding: 5px 20px;
    
    .user-card {
      border-radius: 5px 30px;
      background-blend-mode: multiply;
      box-shadow: 2px 3px 3px #471c0330;
      transition: all 0.3s ease;

      .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        font-size: 15px;

        .left-label {
          color: #806f5be8;
          text-align: right;
          width: 35%;
          padding-right: 10px;
        }

        .right-text {
          color: rgb(85, 42, 6);
          text-align: left;
          width: 65%;
          padding-left: 15px;
        }
      }

      .avatar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        
        .avatar-upload {
          position: relative;
          width: 80px;
          height: 80px;
          cursor: pointer;
          
          .avatar-image {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid rgba(139, 69, 19, 0.3);
            background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
            transition: all 0.5s ease;
          }

          &:hover {
            border-radius: 50%;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(184, 120, 2, 0.8);
            filter: brightness(1.1) contrast(1.1);
          }
          
          .avatar-default {
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
          }
          
          .avatar-input {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
        }
      }

      &.has-glow {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      &.has-glow::before {
        content: '';
        position: absolute;
        top: -100%;
        left: -50%;
        width: 100%;
        height: 300%;
        background: linear-gradient(
          45deg,
          transparent 0%,
          transparent 35%,
          rgba(255, 255, 255, 0.3) 50%,
          transparent 65%,
          transparent 100%
        );
        transform: rotate(0deg);
        animation: shine-sweep 3.5s linear infinite;
        pointer-events: none;
        z-index: 1;
      }
    }
  }

  .general-settings {
    padding: 5px 20px;

    .settings-card {
      border-radius: 16px;
      background: linear-gradient(145deg, #fdfcf9, #f7ecdc);
      background-blend-mode: multiply;
      box-shadow: 2px 3px 3px #471c0330;
      transition: all 0.3s ease;
      border: none;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
      }

      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding: 8px 16px;
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(155, 101, 69, 0.096);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .left-label {
          color: #72573be8;
          font-size: 15px;
          font-weight: 500;
          width: 55%;
        }

        .right-content {
          width: 45%;
          text-align: right;
          align-items: center;
          display: flex;
          justify-content: flex-end;

          .btn-base {
            transition: all 0.3s ease;
            border-radius: 8px;
            padding: 8px 16px;

            &:hover {
              transform: translateY(-1px);
            }
          }
          
          .connection-status {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            
            .status-indicator {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              transition: all 0.3s ease;
              
              &.connected {
                background-color: #67c23a;
                box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
              }
              
              &.disconnected {
                background-color: #f56c6c;
                box-shadow: 0 0 8px rgba(245, 108, 108, 0.4);
              }
            }
            
            .status-text {
              font-size: 14px;
              color: #606266;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

.footer-actions {
  display: flex;
  justify-content: center;
  .img-btn {
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    background-color: #ebe7e1;
    transition: all 0.3s ease;
  }
  .img-btn:hover {
    background-color: #e0e0ff;
    transform: scale(1.3) rotate(10deg);
    filter: hue-rotate(45deg) brightness(1.2);
  }
}

/* 帮助设置样式 */
.help-settings {
  .settings-card {
    .settings-item {
      .help-text {
        color: #666;
        line-height: 1.6;
        margin: 0;
        font-size: 14px;
      }
      
      .help-tips {
        margin: 0;
        padding-left: 0;
        list-style: none;
        
        li {
          color: #666;
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 4px;
        }
      }
    }
  }
}

</style>