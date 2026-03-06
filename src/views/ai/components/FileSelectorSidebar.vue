<template>
  <div class="file-selector-sidebar">
    <div class="path-input-section">
      <div class="input-group">
        <input 
          v-model="currentPath"
          type="text"
          placeholder="输入文件夹路径"
          @keydown.enter="loadDirectory"
        />
        <button @click="openFolderDialog" class="browse-btn" title="浏览文件夹">
          📁
        </button>
      </div>
      <button @click="loadDirectory" class="load-btn">加载</button>
    </div>

    <div class="files-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="files.length === 0" class="empty">
        {{ currentPath ? '该文件夹为空' : '请输入文件夹路径' }}
      </div>
      <div v-else class="file-items">
        <div 
          v-for="file in files" 
          :key="file.path"
          :class="['file-item', { 'selected': file.path === selectedFile }]"
          @click="selectFile(file)"
        >
          <span class="file-icon">{{ file.isDir ? '📁' : '📄' }}</span>
          <span class="file-name" :title="file.name">{{ file.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { readDir } from '@tauri-apps/plugin-fs'

const props = defineProps({
  selectedFile: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const currentPath = ref(localStorage.getItem('ai_last_folder_path') || '')
const files = ref([])
const loading = ref(false)
const error = ref('')

// 打开文件夹对话框
const openFolderDialog = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false
    })

    if (selected) {
      currentPath.value = selected
      await loadDirectory()
    }
  } catch (err) {
    console.error('打开文件夹失败:', err)
    error.value = '打开文件夹失败'
  }
}

// 加载目录内容
const loadDirectory = async () => {
  if (!currentPath.value) {
    error.value = '请输入文件夹路径'
    return
  }

  loading.value = true
  error.value = ''
  files.value = []

  try {
    const entries = await readDir(currentPath.value)
    
    // 过滤并排序：文件夹在前，文件在后
    files.value = entries
      .map(entry => ({
        name: entry.name,
        path: `${currentPath.value}/${entry.name}`,
        isDir: entry.isDirectory
      }))
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1
        if (!a.isDir && b.isDir) return 1
        return a.name.localeCompare(b.name)
      })
    
    // 保存路径到缓存
    localStorage.setItem('ai_last_folder_path', currentPath.value)
  } catch (err) {
    console.error('加载目录失败:', err)
    error.value = '加载目录失败，请检查路径是否正确'
  } finally {
    loading.value = false
  }
}

// 选择文件
const selectFile = (file) => {
  if (file.isDir) {
    // 如果是文件夹，进入该文件夹
    currentPath.value = file.path
    loadDirectory()
  } else {
    // 如果是文件，触发选择事件
    emit('select', file.path)
  }
}

// 组件挂载时自动加载上次的文件夹
onMounted(() => {
  if (currentPath.value) {
    loadDirectory()
  }
})
</script>

<style lang="less" scoped>
.file-selector-sidebar {
  width: 280px;
  background: #fff9f5;
  border-left: 1px solid #d9bfb8;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 15px;
    border-bottom: 1px solid #d9bfb8;
    background: #fbf2c450;

    h4 {
      margin: 0;
      color: #80695b;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .path-input-section {
    padding: 12px;
    border-bottom: 1px solid #d9bfb8;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .input-group {
      display: flex;
      gap: 6px;

      input {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #d9bfb8;
        border-radius: 4px;
        background: #fffcfa;
        color: #80695b;
        font-size: 12px;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: #8b4513;
          background: #fbf2c450;
        }

        &::placeholder {
          color: #c9b1a7;
        }
      }

      .browse-btn {
        padding: 8px 10px;
        background: #8b4513;
        color: #fffcfa;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #a0522d;
          transform: translateY(-2px);
        }
      }
    }

    .load-btn {
      width: 100%;
      padding: 8px;
      background: #8b4513;
      color: #fffcfa;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s;

      &:hover {
        background: #a0522d;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
      }
    }
  }

  .files-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .loading,
    .error,
    .empty {
      padding: 20px;
      text-align: center;
      color: #c9b1a7;
      font-size: 13px;
    }

    .error {
      color: #d9534f;
    }

    .file-items {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .file-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;

        &:hover {
          background: #fbf2c450;
          border-color: #d9bfb8;
        }

        &.selected {
          background: #8b4513;
          color: #fffcfa;
          border-color: #8b4513;

          .file-name {
            color: #fffcfa;
          }
        }

        .file-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          color: #80695b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
