import { pbRequest, loading, changeTime } from "../../public/pbRequest/index"

// 查询项目列表
export async function getProject(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/projectInformation/select?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, rows, total } : message
}

// 查询所有项目的任务列表
export async function getAllTask(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/taskInformation/selectAll?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, rows, total } : message
}

// 查询项目中的任务列表
export async function getTask(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/taskInformation/select?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, rows, total } : message
}

// 查询项目中的任务列表-----子任务树结构
export async function getTreeTask(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/taskInformation/selectTree?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, rows, total } : message
}

// 新增/修改 项目的任务列表
export async function addOrUpdateTask(params) {
  const { data: { code, data, message } } = await pbRequest.post('/eam/taskInformation/addOrUpdate', params)
  return code === 200 ? { code, data } : message
}

// 获取各个项目下的所属流程的数量
export async function getScheduleNumList(params) {
  const { data: { code, data, message } } = await pbRequest.post('/eam/taskInformation/selectNum', params)
  return code === 200 ? { code, data } : message
}

// 点击next
export async function updateNextSchedule(params) {
  const { data: { code, data, message } } = await pbRequest.post('/eam/taskInformation/next', params)
  return code === 200 ? { code, data } : message
}

// 删除任务
export async function deleteTask(params){
  const { data: { code, data, message } } = await pbRequest.post('/eam/taskInformation/delete', params)
  return code === 200 ? { code, data } : message
}

// 获取项目分类
export async function getProjectClass() {
  const { data: { code, data, message } } = await pbRequest.post('/eam/projectInformation/selectClass')  
  return code === 200 ? { code, data } : message
}

// 新增项目、修改项目
export async function addOrUpdateProject(params) {
  const { data: { code, data, message, rows } } = await pbRequest.post('/eam/projectInformation/addOrUpdate', params)
  return code === 200 ? { code, rows } : message
}

// 删除项目
export async function deleteProject(params){
  const { data: { code, data, message } } = await pbRequest.post('/eam/projectInformation/delete', params)
  return code === 200 ? { code, data } : message
}

// 查询任务日志列表
export async function getTaskLogs(taskId) {
  const { data } = await pbRequest.get(`eam/taskLog/list/${taskId}`)
  // 兼容不同返回结构：期望 data.data 或 data.rows
  if (data && data.code === 200) {
    return { code: 200, list: data.data || data.rows || [] };
  }
  return { code: data?.code ?? 500, list: [], message: data?.message || '获取日志失败' };
}