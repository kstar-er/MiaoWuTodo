# 宠物右键菜单组件 (ContextMenu)

## 功能概述

这是一个为宠物窗口设计的右键菜单组件，提供了以下功能：

### 主要功能

1. **任务栏** - 打开主任务管理窗口
2. **小窗口** - 创建任务管理小窗口
3. **切换宠物** - 打开宠物管理窗口
4. **创建任务** - 创建新任务
5. **创建项目** - 创建新项目

### 技术特性

- 悬浮覆盖在宠物窗口上方
- 右键点击触发显示
- 点击外部自动关闭
- 平滑的动画效果
- 响应式设计

## 使用方法

### 在宠物组件中集成

```vue
<template>
  <div class="content-area" @contextmenu="showContextMenu">
    <!-- 宠物内容 -->
    
    <!-- 右键菜单 -->
    <ContextMenu 
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup>
import ContextMenu from './components/ContextMenu.vue';

// 右键菜单状态
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 显示右键菜单
const showContextMenu = (e) => {
  e.preventDefault();
  contextMenuPosition.value = {
    x: e.clientX,
    y: e.clientY
  };
  contextMenuVisible.value = true;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
};
</script>
```

### 组件属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| visible | Boolean | false | 控制菜单是否显示 |
| position | Object | { x: 0, y: 0 } | 菜单位置坐标 |

### 组件事件 (Events)

| 事件名 | 说明 | 参数 |
|--------|------|------|
| close | 菜单关闭时触发 | 无 |

## 样式定制

组件使用 Element Plus 图标和 Less 预处理器，可以通过以下方式定制样式：

```less
.context-menu {
  // 自定义背景色
  background: #your-color;
  
  // 自定义阴影
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-item {
  // 自定义悬停效果
  &:hover {
    background-color: #your-hover-color;
    color: #your-text-color;
  }
}
```

## 依赖项

- Vue 3 Composition API
- Element Plus Icons
- Tauri API (窗口管理)
- 多窗口管理模块

## 注意事项

1. 确保在宠物窗口的根元素上绑定 `@contextmenu` 事件
2. 菜单会自动处理点击外部关闭的逻辑
3. 所有功能都会在操作完成后自动关闭菜单
4. 组件使用 `position: fixed` 定位，确保在宠物窗口上方正确显示
