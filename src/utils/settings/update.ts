// src/utils/update.ts
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function performUpdate(
  onProgress: (progress: number) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const update = await check();
    if (!update) return;

    let totalBytes = 0;
    let receivedBytes = 0;
    // 步骤1：下载更新包
    await update.download((event) => {
      switch (event.event) {
        case 'Started':
          totalBytes = event.data.contentLength || 0;
          receivedBytes = 0;
          onProgress(0);
          break;
        case 'Progress':
          receivedBytes += event.data.chunkLength;
          const progress = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;
          onProgress(progress);
          break;
      }
    });

    // 步骤2：安装更新
    await update.install();

    // 步骤3：重启应用
    onComplete();
  } catch (error) {
    console.error('更新失败:', error);
    throw error;
  }
}