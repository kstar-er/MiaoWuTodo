<!-- 选择负责人员弹窗 -->
<template>
  <el-dialog
    v-model="visible"
    :title="'选择' + nextSchedule + '的负责人员'"
    width="100%"
    @close="onClose"
  >
    <div class="dialog-content">
      <el-check-tag
        v-for="(user, index) in users"
        :key="index"
        :checked="isChecked(user)"
        @change="handleCheckUser(user)"
        type="danger"
        style="margin-right: 10px;"
      >
        {{ user }}
      </el-check-tag>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="btn-base btn-danger" @click="onCancel">取消</el-button>
        <el-button class="btn-base btn-default" @click="onConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean, // 控制弹窗显示
  users: Array, // 用户列表
  nextSchedule: String, // 下一步流程
  selectedUsers: Array, // 已选用户
});

const emits = defineEmits(['update:modelValue', 'confirm']);

// 实时监听弹窗显示
const visible = ref(props.modelValue);
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue;
});

const isChecked = (user) => {
  return props.selectedUsers.includes(user);
};

const handleCheckUser = (user) => {
  if (isChecked(user)) {
    // 如果已选中，则移除
    const index = props.selectedUsers.indexOf(user);
    if (index !== -1) {
      props.selectedUsers.splice(index, 1);
    }
  } else {
    // 如果未选中，则添加
    props.selectedUsers.push(user);
  }
};

const onClose = () => {
  visible.value = false;
  emits('update:modelValue', false);
};

const onCancel = () => {
  onClose();
};

const onConfirm = () => {
  emits('confirm', props.selectedUsers);
  onClose();
};
</script>