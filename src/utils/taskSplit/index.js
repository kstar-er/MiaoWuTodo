import { pbRequest } from "../../public/pbRequest/index.js";

/**
 * 分析任务是否可拆分
 * @param {number} taskId - 任务ID
 * @param {boolean} forceAI - 是否强制使用AI分析
 * @returns {Promise} 拆分分析结果
 */
export const analyzeTaskSplit = (taskId, forceAI = false) => {
  return pbRequest({
    url: `/eam/taskSplit/analyze/${taskId}`,
    method: "POST",
    params: { forceAI }
  });
};

/**
 * 确认拆分并创建子任务
 * @param {Object} confirmData - 拆分确认数据
 * @param {number} confirmData.taskId - 原任务ID
 * @param {Array} confirmData.subtasks - 子任务信息列表
 * @returns {Promise} 创建的子任务列表
 */
export const confirmTaskSplit = (confirmData) => {
  return pbRequest({
    url: "/eam/taskSplit/confirm",
    method: "POST",
    data: confirmData
  });
};