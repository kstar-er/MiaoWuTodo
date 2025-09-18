/**
 * 时间数据整合
 */
export function getCurrentFormattedTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


/**
 * 根据索引获取不同的标签颜色
 * @param {number} index - 索引值
 * @returns {string} 颜色类型
 */
export function getTagColor(index) {
  const colors = ['success', 'info', 'warning', 'primary', 'danger'];
  return colors[index % colors.length];
}


/**
 * 根据任务进度获得不同的标签颜色：
 * schedule：待接取、进行中、测试中、待审批、归档、需求分析、准备中、已完成、已延期、流程卡点
 * @param {string} schedule - 任务进度
 * @returns {string} 颜色类型
 */
export function getScheduleTagColor(schedule) {
  const scheduleColorMap = {
    "待接取": "info",
    "进行中": "primary",
    "测试中": "warning",
    "测试中*": "warning",
    "待审批": "info",
    "归档": "success",
    "需求分析": "info",
    "准备中": "warning",
    "已完成": "success",
    "已延期": "danger",
    "流程卡点": "danger",
    "审核中": "primary"
  };
  return scheduleColorMap[schedule] || "warning"; // 默认颜色
}


/**
 * 获取窗口上次保存的位置
 * @param {string} windowId - 窗口标识符
 * @return {object|null} - 返回窗口位置对象 {x, y} 或 null
 */
export function getWindowPosition(windowId) {
  const position = localStorage.getItem(`window_position_${windowId}`);
  return position ? JSON.parse(position) : null;
}

/**
 * 保存窗口当前位置
 * @param {string} windowId - 窗口标识符
 * @param {Object} position - 窗口位置对象 {x, y}
 */
export function saveWindowPosition(windowId, position) {
  localStorage.setItem(`window_position_${windowId}`, JSON.stringify(position));
}


/**
 * 清除窗口保存的位置 - 可用于之后的 通用设置
 */
export function clearWindowPositions() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("window_position_")) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * 清除formdata
 */
export function clearWindowFormdata() {
  Object.keys(sessionStorage).forEach(key => {
    if (key === "formdata" ) {
      sessionStorage.removeItem(key);
    }
  });
}