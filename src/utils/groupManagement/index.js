import { pbRequest, loading, changeTime } from "../../public/pbRequest/index"

/**
 * 群组模块
 */

// 创建群组

export async function createGroup(params) {
  const { data } = await pbRequest.post(`/eam/group/createGroup`, params)
  return data.code === 200 ? { data } : message
}

// 修改群组名字 groupId, newGroupName
export async function updateGroupName(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/group/updateGroupName?groupId=${params.groupId}&newGroupName=${params.newGroupName}`)
  return code === 200 ? { code, rows, total } : message
}

// 群组申请
export async function applyGroup(inviteLink) {
  const { data: {code, data, message}  } = await pbRequest.post(`/eam/group/applyGroup`, inviteLink)
  return code === 200 ? { code, data } : message
}

// 群组拉人 userId
export async function addGroupMember(params) {
  const { data: { code, data, message  } } = await pbRequest.post(`/eam/group/addGroupMember`, params)
  return code === 200 ? { code, data } : message
}

// 群组移除人 userId和groupId
export async function removeGroupMember(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/group/exitGroup?groupId=${params.groupId}&userId=${params.userId}`)
  return code === 200 ? { code, rows, total } : message
}

// 解散群组 groupId
export async function dissolveGroup(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.get(`/eam/group/dissolveGroup?groupId=${params.groupId}`)
  return code === 200 ? { code, rows, total } : message
}

// 获取群组列表
export async function getGroupList(params) {
  const { data: { code, data, message  } } = await pbRequest.get(`/eam/group/getGroupList?pageNum=${params.pageNum}&pageSize=${params.pageSize}&groupName=${params.groupName}`)
  return code === 200 ? { code, data } : message
}

// 获取群组成员列表 groupId
export async function getGroupMemberList(params) {
  const { data: { code, data, total  } } = await pbRequest.get(`/eam/group/getGroupMembers?groupId=${params.groupId}`)
  return code === 200 ? { code, data, total } : message
}

// 批量获取群组成员列表 groupIds
export async function getBatchGroupMemberList(params) {
  const { data: { code, data, message  } } = await pbRequest.post(`/eam/group/getBatchGroupMembers`, params)
  return code === 200 ? { code, data } : message
}

// 获取群组申请列表
export async function getGroupApplyList(params) {
  const { data: { code, data, message  } } = await pbRequest.get(`/eam/group/getApplyList?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, data } : message
}

// 验证群组申请 applyId, status: true、false
export async function auditGroupApply(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/group/agreeApply?agree=${params.agree}&applyId=${params.applyId}`)
  return code === 200 ? { code, rows, total } : message
}

// 获取群组申请数量
export async function getPendingGroupApplyTotal() {
  const { data: { code, data, message  } } = await pbRequest.get(`/eam/group/getApplyCount`)
  return code === 200 ? { code, data } : message
}



/**
 * 好友模块
 */

// 审核好友申请 applyId, status: true、false
export async function auditFriendApply(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/friendship/auditFriendApply`, params)
  return code === 200 ? { code, rows, total } : message
}

// 好友申请 friendId
export async function applyFriend(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.post(`/eam/friendship/applyFriend?userName=${params.userName}`)
  return code === 200 ? { code, rows, total } : message
}

// 删除好友 friendId
export async function deleteFriend(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.delete(`/eam/friendship/deleteFriend/${params.friendId}`)
  return code === 200 ? { code, rows, total } : message
}

// 获取好友列表
export async function getFriendList(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.get(`/eam/friendship/getFriendsList?pageNum=${params.pageNum}&pageSize=${params.pageSize}&name=${params.nickName}`)
  return code === 200 ? { code, rows, total } : message
}

// 查看好友申请列表
export async function getFriendApplyList(params) {
  const { data: { code, rows, message, total  } } = await pbRequest.get(`/eam/friendship/getFriendApplyList?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, rows, total } : message
}

// 获取 待审核状态的好友申请列表数量 status: 'pending'
export async function getPendingFriendApplyTotal(params) {
  const { data: { code, data, message  } } = await pbRequest.get(`/eam/friendship/getFriendApplyListPending?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return code === 200 ? { code, data } : message
}

// 获取用户列表
export async function getArchivesList(params) {
  const { data } = await pbRequest.post(`/system/user/list?pageNum=${params.pageNum}&pageSize=${params.pageSize}`, params)
  return data?.code === 200 ? data.data : data.msg
}