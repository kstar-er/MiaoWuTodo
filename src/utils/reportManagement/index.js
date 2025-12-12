import { pbRequest } from '../../public/pbRequest/index.js'

/**
 * 查询周报列表
 * @param {Object} queryParams - 查询参数，包含userId、groupId、startDate、endDate、status等
 * @returns {Promise} 返回周报列表
 */
export function queryReports(queryParams) {
  return pbRequest.post('/eam/reports/query', queryParams)
}

/**
 * 创建周报记录
 * @param {Object} reportData - 周报数据
 * @returns {Promise} 返回创建的周报
 */
export function createReport(reportData) {
  return pbRequest.post('/eam/reports', reportData)
}

/**
 * 获取用户周报配置列表
 * @returns {Promise} 返回周报配置列表
 */
export function getReportConfigs() {
  return pbRequest.get('/eam/reports/config')
}

/**
 * 保存或更新周报配置
 * @param {Object} configData - 周报配置数据
 * @returns {Promise} 返回操作结果
 */
export function saveReportConfig(configData) {
  return pbRequest.post('/eam/reports/config', configData)
}

/**
 * 根据endDate对周报列表进行分组
 * @param {Array} reports - 周报列表
 * @returns {Object} 按endDate分组的对象，键为endDate，值为该endDate下的周报数组
 */
export function groupReportsByEndDate(reports) {
  const grouped = {}
  reports.forEach(report => {
    // 后端返回的endDate是字符串，格式为"yyyy-MM-dd"
    const endDate = report.endDate
    if (!grouped[endDate]) {
      grouped[endDate] = []
    }
    grouped[endDate].push(report)
  })
  return grouped
}