<template>
  <div class="history-sidebar">
    <div class="history-header">
      <h3>{{ title }}</h3>
      <div class="header-buttons">
        <button @click="refreshHistory" class="refresh-btn" title="刷新历史记录">
          🔄
        </button>
        <button @click="clearAllHistory" class="clear-btn" title="清空所有历史">
          🗑️
        </button>
      </div>
    </div>

    <div class="history-list">
      <div v-if="history.length === 0" class="no-history">
        暂无记录
      </div>
      <div
        v-for="(item, idx) in history"
        :key="idx"
        :class="['history-item', { active: currentId === idx }]"
        @click="selectItem(idx)"
      >
        <div class="history-item-title">{{ item.title }}</div>
        <div class="history-item-time">{{ item.timestamp }}</div>
        <button
          @click.stop="deleteItem(idx)"
          class="delete-btn"
          title="删除此记录"
        >
          ✕
        </button>
      </div>
    </div>

    <button @click="createNew" class="new-item-btn">
      + {{ newButtonText }}
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineOptions({ name: 'HistorySidebar' })

const props = defineProps({
  history: {
    type: Array,
    required: true
  },
  currentId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: '历史记录'
  },
  newButtonText: {
    type: String,
    default: '新建'
  }
})

const emit = defineEmits(['select', 'delete', 'clear', 'create-new', 'refresh'])

const selectItem = (idx) => {
  emit('select', idx)
}

const deleteItem = (idx) => {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', idx)
  }
}

const clearAllHistory = () => {
  if (confirm('确定要清空所有记录吗？此操作不可撤销。')) {
    emit('clear')
  }
}

const createNew = () => {
  emit('create-new')
}

const refreshHistory = () => {
  emit('refresh')
}
</script>

<style lang="less" scoped>
.history-sidebar {
  width: 250px;
  background: #fff9f5;
  border-right: 1px solid #d9bfb8;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .history-header {
    padding: 15px;
    border-bottom: 1px solid #d9bfb8;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 14px;
      color: #80695b;
      font-weight: 600;
    }

    .header-buttons {
      display: flex;
      gap: 4px;
    }

    .refresh-btn,
    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background: #fbf2c450;
        transform: rotate(20deg);
      }
    }
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;

    .no-history {
      text-align: center;
      color: #c9b1a7;
      padding: 20px 10px;
      font-size: 13px;
    }

    .history-item {
      padding: 10px;
      margin-bottom: 8px;
      background: #fbf2c450;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      border-left: 3px solid transparent;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;

      &:hover {
        background: #f5e6d3;

        .delete-btn {
          opacity: 1;
        }
      }

      &.active {
        background: #8b4513;
        border-left-color: #8b4513;

        .history-item-title,
        .history-item-time {
          color: #fffcfa;
        }

        .delete-btn {
          color: #fffcfa;
          opacity: 1;
        }
      }

      .history-item-title {
        font-size: 13px;
        color: #80695b;
        font-weight: 500;
        word-break: break-word;
        padding-right: 24px;
      }

      .history-item-time {
        font-size: 11px;
        color: #c9b1a7;
      }

      .delete-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #c9b1a7;
        opacity: 0;
        transition: all 0.3s;
        padding: 4px;

        &:hover {
          color: #8b4513;
        }
      }
    }
  }

  .new-item-btn {
    margin: 10px;
    padding: 10px;
    background: #8b4513;
    color: #fffcfa;
    border: none;
    border-radius: 6px;
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
</style>
