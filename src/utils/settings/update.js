import { getCurrentWindow } from "@tauri-apps/api/window";
import packageJson from '../../../package.json';
import { ElMessageBox, ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { pbRequest} from "../../public/pbRequest/index"
// 查询项目列表
export async function getVersion() {
  const { data: { code,data, message  } } = await pbRequest.get(`/eam/versionInformation/getLatestVersion`)
  return code === 200 ? { code, data } : message
}

// 下载并安装更新
export const downloadAndInstall = async (url) => {
  try {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop(); // 获取文件名
    
    // 创建下载完成的事件监听器
    const downloadComplete = new Promise((resolve, reject) => {
      // 监听下载开始事件
      link.addEventListener('click', () => {
        // 创建一个定时器来检查下载是否完成
        const checkInterval = setInterval(async () => {
          try {
            // 使用 Tauri 的 API 检查文件是否存在
            const filePath = await invoke('get_download_path', { filename: link.download });
            const exists = await invoke('check_file_exists', { path: filePath });
            
            if (exists) {
              clearInterval(checkInterval);
              resolve(filePath);
            }
          } catch (error) {
            console.error('检查文件失败:', error);
          }
        }, 1000); // 每秒检查一次
      });
    });

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 等待下载完成
    const downloadPath = await downloadComplete;

    // 使用 Tauri 的 API 打开文件
    await invoke('open_file', { path: downloadPath });

    // 关闭当前应用
    const currentWindow = getCurrentWindow();
    await currentWindow.close();

  } catch (error) {
    console.error('下载安装失败:', error);
    ElMessage.error('下载安装失败，请手动下载安装');
  }
};

// 检查更新
export const checkUpdate = async (versionInfo) => {
  try {
    // 获取自动更新设置
    const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
    if (!autoUpdate) return;

    // 获取当前版本和最新版本
    const currentVersion = packageJson.version;
    const latestVersion = versionInfo.data.versionNumber;

    // 比较版本号
    if (currentVersion !== latestVersion) {
      ElMessageBox.confirm(
        `发现新版本 ${latestVersion}，是否立即更新？`,
        '更新提示',
        {
          confirmButtonText: '立即更新',
          cancelButtonText: '稍后再说',
          type: 'info',
        }
      ).then(async () => {
        // 获取下载链接
        const downloadUrl = versionInfo.data.downloadUrl;
        if (downloadUrl) {
          // 下载并安装更新
          await downloadAndInstall(downloadUrl);
        } else {
          ElMessage.error('获取下载链接失败');
        }
      }).catch(() => {
        ElMessage.info('已取消更新');
      });
    }
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}; 
