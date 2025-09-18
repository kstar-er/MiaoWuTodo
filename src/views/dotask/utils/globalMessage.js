// utils/globalMessage.js
import { ElMessage, ElMessageBox } from "element-plus";

export const showMessage = (type, message) => {
  ElMessage({
    type,
    message,
  });
};

export const showAlert = (title, content, options) => {
  return ElMessageBox.alert(content, title, options);
};