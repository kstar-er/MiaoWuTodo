import { getCurrentWindow } from "@tauri-apps/api/window";
import packageJson from '../../../package.json';
import { ElMessageBox, ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { pbRequest} from "../../public/pbRequest/index"
import { check } from '@tauri-apps/plugin-updater';

// 获取最新版本版本
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
    console.log("检查更新:", versionInfo)
    // 获取自动更新设置
    const autoUpdate = localStorage.getItem('autoUpdate') !== 'false';
    if (!autoUpdate) return;

    // 安全获取平台
    const getPlatform = () => {
      if (typeof window.__TAURI__ !== 'undefined' && window.__TAURI__.os) {
        return window.__TAURI__.os.platform();
      }
      if (navigator.userAgent.includes('Mac')) return 'darwin';
      if (navigator.userAgent.includes('Win')) return 'win64';
      return null;
    };

    const platform = getPlatform();
    if (!platform) {
      ElMessage.warning('未知操作系统');
      return;
    }
    const isMac = platform === 'darwin';

    // 获取当前版本和最新版本
    const data = versionInfo.data;
    const currentVersion = packageJson.version;
    const latestVersion = data.version;

    const updateManifest = {
      version: data.version,
      date: data.pub_date || new Date().toISOString(), // 兼容 ISO 格式
      url: isMac ? data.platforms['darwin-x64'].url : data.platforms['windows-x86_64'].url,
      signature: isMac ? data.platforms['darwin-x64'].signature : data.platforms['windows-x86_64'].signature,
      notes: data.notes,
    };

    console.log("检查更新updateManifest:", updateManifest)

    const update = await check(JSON.stringify(updateManifest)); // 获取 updater 实例

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

        // 监听下载进度
        await update.download((event) => {
          if (event.event === 'Started') {
            console.log('开始下载更新', event.data.contentLength);
          } else if (event.event === 'Progress') {
            const total = event.data.contentLength || 0;
            const chunkLength = event.data.chunkLength;
            const percent = total ? Math.floor((chunkLength / total) * 100) : 0;
            console.log(`下载进度: ${percent}%`);
            ElMessage.info(`下载中: ${percent}%`, { duration: 1000 });
          } else if (event.event === 'Finished') {
            ElMessage.success('下载完成，即将安装...');
            // 安装更新
            update.install().catch(err => {
              console.error('安装失败:', err);
              ElMessage.error('安装失败，请手动更新');
            });
          }
        });
      }).catch((error) => {
        console.error("error", error)
        ElMessage.info('已取消更新');
      });
    }
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}; 
