import { pbRequest, loading } from "../../public/pbRequest/index"

class DataSource {
  constructor({
    modules = '',
    selectUri = '/',
    deleteUri = '/',
    selectOneUri = '/',
    pageSize = 20,
    tableHeader
  } = {}){
    this.modules = modules
    this.selectUri = selectUri
    this.selectOneUri = selectOneUri
    this.deleteUri = deleteUri
    this.searchData = {}
    this.currentPage = 1
    this.pageSize = pageSize
    this.total = 0
    this.tableData = []
    this.tableHeader = tableHeader
    this.selections = []
  }

  createTreeData(data){
    let res = []
    function findSon(data, parent){
      data.forEach(item => {
        if (item.parentId === parent.id) parent.children.push(item)
      })
      return parent
    }
    data.forEach(item => {
      item.label = item.departmentName
      item.value = item.id
      res.push(findSon(data, item))
    })
    return res.filter(item => item.parentId === 0)
  }

  async initData(context = this, tableRef){
    let { data } = await pbRequest.post(`${context.selectUri}?pageNum=${context.currentPage}&pageSize=${context.pageSize}`, context.searchData)
    if (data.code !== 200) return
    context.total = data.total
    context.originData = data.rows
    context.tableData.length = 0
    context.tableData.push(...context.createTreeData(data.rows))
    tableRef?.clearSelection()
  }



}

export { loading, DataSource }