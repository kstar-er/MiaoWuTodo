# GitHub Release 环境变量配置指南 (Mac) - 简化版

本指南将帮助你在 Mac 上为 MiaoWuTodo 项目配置 GitHub Release
本指南将帮助你在 Mac 上生成、导出和上传 MiaoWuTodo 项目所需的 GitHub Secrets 环境变量。

## 需要配置的环境变量

根据你的 `release.yml` 文件，需要配置以下 GitHub Secrets：

### 1. Apple 开发者证书相关
- `APPLE_CERTIFICATE` - Apple 开发者证书 (base64 编码)
- `APPLE_CERTIFICATE_PASSWORD` - 证书密码
- `APPLE_SIGNING_IDENTITY` - 代码签名身份标识 (自动从证书中提取)
- `APPLE_ID` - Apple ID 邮箱
- `APPLE_ID_PASSWORD` - Apple ID 密码 (建议使用 App-specific password)
- `APPLE_PASSWORD` - Apple ID 密码 (同上)
- `APPLE_TEAM_ID` - Apple 开发者团队 ID
- `APPLE_API_KEY_CONTENT` - Apple API Key 文件内容 (可选)
- `APPLE_API_KEY_ID` - Apple API Key ID (可选)

### 2. 简化配置说明

对于基本的 Tauri 应用代码签名，**最核心的变量是**：
- `APPLE_CERTIFICATE` (必需)
- `APPLE_CERTIFICATE_PASSWORD` (必需)
- `APPLE_ID` (必需)
- `APPLE_ID_PASSWORD` (必需)
- `APPLE_TEAM_ID` (必需)

API Key 相关的变量 (`APPLE_API_KEY_CONTENT` 和 `APPLE_API_KEY_ID`) 主要用于特定的 Apple 服务，如果你的应用不需要这些服务，可以先尝试不配置这些变量。

## 详细配置步骤

### 步骤 1: 获取 Apple 开发者证书

1. **登录 Apple Developer Portal**
   - 访问 https://developer.apple.com/account/
   - 使用你的 Apple ID 登录

2. **创建/下载开发者证书**
   - 进入 "Certificates, Identifiers & Profiles"
   - 选择 "Certificates" → "+" 创建新证书
   - 选择 "Developer ID Application" (用于分发到 Mac App Store 外)
   - 按照指引生成 CSR 文件并上传
   - 下载生成的证书文件 (.cer)

3. **导出 P12 证书文件**
   ```bash
   # 双击 .cer 文件安装到钥匙串
   # 在钥匙串访问中找到证书，右键选择"导出"
   # 选择 .p12 格式，设置密码
   ```

4. **转换为 base64 编码**
   ```bash
   # 将 P12 证书转换为 base64 并保存到文件
   base64 -i /path/to/your/certificate.p12 > certificate_base64.txt
   # 查看生成的 base64 编码
   cat certificate_base64.txt
   ```

### 步骤 2: 获取 Apple API Key

2. **获取 API Key 信息**
   ```bash
   # 获取 API Key 文件内容并保存到文件
   cat /path/to/AuthKey_XXXXXXXXXX.p8 > api_key_content.txt
   # 查看文件内容
   cat api_key_content.txt
   # 记录 Key ID (文件名中的 XXXXXXXXXX 部分)
   ```

### 步骤 3: 获取其他必要信息

1. **Apple Team ID**
   - 在 Apple Developer Portal 右上角可以看到
   - 或者在终端运行：
   ```bash
   xcrun altool --list-providers -u "your-apple-id@example.com" -p "your-app-specific-password"
   ```

2. **Apple Signing Identity (代码签名身份)**
   
   `APPLE_SIGNING_IDENTITY` 变量在 GitHub Actions 中是**自动获取**的，你不需要手动配置这个 Secret。
   
   工作流程如下：
   - GitHub Actions 会自动导入你的 `APPLE_CERTIFICATE`
   - 然后通过以下命令自动提取签名身份：
   ```bash
   security find-identity -v -p codesigning build.keychain | grep "Developer ID Application"
   ```
   - 提取的身份标识会自动设置为 `APPLE_SIGNING_IDENTITY` 环境变量
   
   如果你想在本地验证签名身份，可以运行：
   ```bash
   # 查看所有可用的代码签名身份
   security find-identity -v -p codesigning
   
   # 输出示例：
   # 1) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX "Developer ID Application: Your Name (TEAM_ID)"
   ```

3. **创建 App-specific Password**
   - 访问 https://appleid.apple.com/
   - 登录后进入 "Sign-In and Security"
   - 选择 "App-Specific Passwords"
   - 生成新的应用专用密码

### 步骤 4: 在 GitHub 中配置 Secrets

1. **进入 GitHub 仓库设置**
   - 打开你的 GitHub 仓库
   - 点击 "Settings" 标签
   - 在左侧菜单选择 "Secrets and variables" → "Actions"

2. **添加以下 Secrets**

   点击 "New repository secret" 并逐一添加：

   | Secret Name | Value | 说明 |
   |-------------|-------|------|
   | `APPLE_CERTIFICATE` | [certificate_base64.txt中的内容] | P12证书的base64编码 |
   | `APPLE_CERTIFICATE_PASSWORD` | [证书密码] | 导出P12时设置的密码 |
   | `APPLE_ID` | your-apple-id@example.com | Apple ID 邮箱 |
   | `APPLE_ID_PASSWORD` | [App专用密码] | App-specific password |
   | `APPLE_PASSWORD` | [App专用密码] | 同上 |
   | `APPLE_TEAM_ID` | XXXXXXXXXX | 10位团队ID |
   | `APPLE_API_KEY_CONTENT` | [api_key_content.txt中的内容或空字符串] | .p8文件的完整内容 (可选) |
   | `APPLE_API_KEY_ID` | [YYYYYYYYYY或空字符串] | API Key的ID (可选) |

   **注意**: `APPLE_SIGNING_IDENTITY` 不需要手动配置，它会在 GitHub Actions 运行时自动从导入的证书中提取。

### 步骤 5: 验证配置

1. **本地测试命令**
   ```bash
   # 验证证书是否正确安装
   security find-identity -v -p codesigning
   
   # 验证 API Key 格式
   cat AuthKey_XXXXXXXXXX.p8
   ```

2. **推送测试标签**
   ```bash
   # 创建并推送测试标签
   git tag v1.0.3-test
   git push origin v1.0.3-test
   ```

## 常见问题解决

### 问题 1: 证书导入失败
```bash
# 清理钥匙串
security delete-keychain build.keychain
# 重新创建
security create-keychain -p "password" build.keychain
```

### 问题 2: API Key 格式错误
确保 .p8 文件内容包含完整的头部和尾部：
```
-----BEGIN PRIVATE KEY-----
[key content]
-----END PRIVATE KEY-----
```

### 问题 3: 团队ID获取
```bash
# 使用 Xcode 命令行工具
xcrun altool --list-providers -u "apple-id" -p "app-password"
```

## 安全建议

1. **定期轮换密码**: 每3-6个月更新 App-specific password
2. **最小权限原则**: API Key 只授予必要的权限
3. **监控使用**: 定期检查 GitHub Actions 的运行日志
4. **备份证书**: 安全保存证书文件的备份

## 测试发布

配置完成后，通过推送标签来测试：

```bash
# 创建新版本标签
git tag v1.0.3
git push origin v1.0.3

# 查看 GitHub Actions 运行状态
# 访问: https://github.com/your-username/your-repo/actions
```

---

**注意**: 请确保所有敏感信息都通过 GitHub Secrets 管理，不要在代码中硬编码任何密码或密钥。