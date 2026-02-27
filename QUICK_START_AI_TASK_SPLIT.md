# AI任务拆分功能 - 快速开始

## 🚀 快速启动

### 1. 启动AI服务
```bash
cd scriptAI
python api_server.py
```

看到以下输出表示启动成功：
```
============================================================
🚀 喵呜Todo AI服务API服务器已启动
============================================================
📍 服务地址: http://localhost:8122
🔑 API密钥: miaowu-todo-api-key-812222

📋 可用接口:
  POST /api/v1/generate-weekly-report  - 生成周报
  POST /api/v1/stream-chat           - 流式聊天
  POST /api/v1/analyze-task-split    - 任务拆分分析
============================================================
```

### 2. 测试接口
```bash
cd scriptAI
python test_task_split.py
```

### 3. 启动Java后端
```bash
cd pet-task
mvn spring-boot:run
```

## 📝 使用流程

### 前端调用示例

```javascript
// 1. 分析任务是否可拆分
const analyzeResult = await fetch('/eam/taskSplit/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    taskId: 123,
    forceAI: true  // 强制使用AI分析
  })
});

const data = await analyzeResult.json();

if (data.canSplit) {
  // 2. 展示拆分结果给用户确认
  console.log('拆分类型:', data.splitType);  // AI_BASED 或 RULE_BASED
  console.log('子任务列表:', data.subtasks);
  
  // 3. 用户确认后创建子任务
  const confirmResult = await fetch('/eam/taskSplit/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: 123,
      subtasks: data.subtasks
    })
  });
}
```

## 🔧 配置说明

### Java配置 (application.yml)
```yaml
ai:
  server:
    url: http://localhost:8122  # 本地开发
    # url: https://your-domain.com  # 生产环境
    api-key: miaowu-todo-api-key-812222
```

### Python配置 (api_server.py)
```python
API_KEY = "miaowu-todo-api-key-812222"
SERVER_PORT = 8122
```

## 📊 拆分策略

### 规则拆分（优先）
适用于已格式化的任务：
```
1. 第一步
   详细说明
2. 第二步
   详细说明
```

### AI拆分（智能）
适用于自然语言描述：
```
需要开发一个电商网站，包括用户管理、商品管理、
订单处理等功能，要求界面美观，性能良好。
```

AI会自动分析并拆分为：
1. 需求分析与设计
2. 用户管理模块开发
3. 商品管理模块开发
4. 订单处理模块开发
5. 界面优化与测试

## ⚠️ 注意事项

1. **AI服务必须先启动**
   - 确保 `api_server.py` 正在运行
   - 检查端口8122未被占用

2. **网络配置**
   - 本地开发：使用 `localhost:8122`
   - 生产环境：配置实际的AI服务地址

3. **任务内容要求**
   - 建议500字以内
   - 描述清晰具体
   - 避免过于简单的任务

4. **超时设置**
   - AI分析需要时间（通常5-15秒）
   - 已配置30秒读取超时
   - 网络不稳定时可能需要重试

## 🐛 故障排查

### AI服务无法访问
```bash
# 检查服务是否运行
curl http://localhost:8122/api/v1/analyze-task-split

# 检查端口占用
netstat -ano | findstr 8122
```

### Java连接失败
1. 检查 `application.yml` 中的URL配置
2. 确认API密钥正确
3. 查看Java日志中的错误信息

### AI返回结果异常
1. 查看Python控制台输出
2. 检查AI模型是否正常
3. 验证任务内容格式

## 📚 相关文档

- [详细功能说明](pet-task/AI_TASK_SPLIT_README.md)
- [实现总结](AI_TASK_SPLIT_IMPLEMENTATION.md)
- [API文档](http://localhost:9820/eam/swagger-ui.html)

## 💡 示例任务

### 适合拆分的任务
```
任务：开发用户认证系统
详情：实现完整的用户认证功能，包括注册、登录、
密码重置、邮箱验证、权限管理等功能。
```

### 不适合拆分的任务
```
任务：修复按钮颜色
详情：将登录按钮的颜色改为蓝色
```

## 🎯 最佳实践

1. **任务描述要具体**
   - ✅ "开发电商网站的用户管理、商品管理和订单系统"
   - ❌ "做个网站"

2. **合理使用强制AI**
   - 已格式化的任务：不强制AI（更快）
   - 自然语言任务：强制AI（更智能）

3. **验证拆分结果**
   - 检查子任务是否合理
   - 调整顺序和内容
   - 补充遗漏的步骤

4. **反馈优化**
   - 记录拆分效果
   - 优化任务描述方式
   - 积累最佳实践
