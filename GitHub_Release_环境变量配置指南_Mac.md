# GitHub Release 环境变量配置指南 (Mac) - 简化版

本指南将帮助你在 Mac 上为 MiaoWuTodo 项目配置 GitHub Release
本指南将帮助你在 Mac 上生成、导出和上传 MiaoWuTodo 项目所需的 GitHub Secrets 环境变量。

## 关于 Apple 公证的重要说明

**为什么需要公证？**

Apple 公证（Notarization）是 macOS 10.15+ 系统的安全要求：

1. **用户体验**: 未公证的应用会显示"无法验证开发者"的警告，用户需要手动绕过安全设置
2. **分发要求**: 通过网络分发的 macOS 应用必须经过公证
3. **系统兼容**: 新版本 macOS 对未公证应用的限制越来越严格

**公证流程**:
1. 代码签名 (使用开发者证书)
2. 上传到 Apple 进行扫描 (使用 API Key)
3. Apple 验证后返回公证票据
4. 将票据附加到应用包中

## 需要配置的环境变量

根据你的 `release.yml` 文件，需要配置以下 GitHub Secrets：

### 1. Apple 开发者证书相关
- `APPLE_CERTIFICATE` - Apple 开发者证书 (base64 编码)
- `APPLE_CERTIFICATE_PASSWORD` - 证书密码
- `APPLE_SIGNING_IDENTITY` - 代码签名身份标识 (自动从证书中提取)
- `APPLE_ID` - Apple ID 邮箱
- `APPLE_ID_PASSWORD` - Apple ID 密码 (建议使用 App-specific password)
- `APPLE_PASSWORD` - Apple ID 密码 (同上)
- `APPLE_TEAM_ID` - Apple 开发者团队 ID (**同时用作 API Issuer**)
- `APPLE_API_KEY_CONTENT` - Apple API Key 文件内容 (**必需，用于公证**)
- `APPLE_API_KEY_ID` - Apple API Key ID (**必需，用于公证**)

**注意**: `APPLE_API_ISSUER` 在 GitHub Actions 中自动使用 `APPLE_TEAM_ID` 的值，无需单独配置。

### 2. 简化配置说明

对于 Tauri 应用的完整签名和公证，**所有以下变量都是必需的**：
- `APPLE_CERTIFICATE` (必需)
- `APPLE_CERTIFICATE_PASSWORD` (必需)
- `APPLE_ID` (必需)
- `APPLE_ID_PASSWORD` (必需)
- `APPLE_TEAM_ID` (必需)
- `APPLE_API_KEY_CONTENT` (必需，用于公证)
- `APPLE_API_KEY_ID` (必需，用于公证)

**重要说明**: Apple 公证是 macOS 应用分发的必需步骤。没有公证的应用在用户下载后会显示安全警告，影响用户体验。

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

### 步骤 2: 获取 Apple API Key (必需，用于公证)

1. **登录 Apple Developer Portal**
   - 访问 https://developer.apple.com/account/
   - 使用你的 Apple ID 登录

2. **创建 API Key**
   - 进入 "Certificates, Identifiers & Profiles"
   - 在左侧菜单选择 "Keys"
   - 点击 "+" 创建新的 API Key
   - 输入 Key Name (例如: "MiaoWuTodo Notarization Key")
   - 勾选 "App Store Connect API" 权限
   - 点击 "Continue" 然后 "Register"

3. **下载 API Key 文件**
   - 创建完成后，**立即下载** .p8 文件 (只能下载一次!)
   - 记录显示的 Key ID (10位字符，如: ABCD123456)
   - 文件名格式: `AuthKey_ABCD123456.p8`

4. **获取 API Key 信息**
   ```bash
   # 获取 API Key 文件内容并保存到文件
   cat AuthKey_S4WMHL3ATR.p8 > api_key_content.txt
   # 查看文件内容
   cat api_key_content.txt
   # 记录 Key ID (文件名中的 ABCD123456 部分)
   ```

   **重要提示**: 
   - API Key 文件只能下载一次，请妥善保存
   - 如果丢失，需要重新创建新的 API Key
   - 确保文件内容包含完整的头部和尾部：
   ```
   -----BEGIN PRIVATE KEY-----
   [key content]
   -----END PRIVATE KEY-----
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
   | `APPLE_API_KEY_CONTENT` | [api_key_content.txt中的内容] | .p8文件的完整内容 (**必需**) |
   | `APPLE_API_KEY_ID` | ABCD123456 | API Key的ID (**必需**) |

   **注意**: 
   - `APPLE_SIGNING_IDENTITY` 不需要手动配置，它会在 GitHub Actions 运行时自动从导入的证书中提取
   - `APPLE_API_KEY_CONTENT` 和 `APPLE_API_KEY_ID` 是公证必需的，不能省略

### 步骤 5: 验证配置

1. **本地测试命令**
   ```bash
   # 验证证书是否正确安装
   security find-identity -v -p codesigning
   
   # 验证 API Key 格式
   cat AuthKey_ABCD123456.p8
   
   # 验证 API Key 权限 (需要安装 Xcode Command Line Tools)
   xcrun altool --validate-app -f /path/to/app.dmg -t osx -u "your-apple-id" -p "app-specific-password" --primary-bundle-id "com.kstar.miaowutodo"
   ```

2. **推送测试标签**
   ```bash
   # 创建并推送测试标签
   git tag v1.0.3-test
   git push origin v1.0.3-test
   ```

3. **验证公证状态**
   
   构建完成后，可以验证应用是否已正确公证：
   ```bash
   # 下载构建的 .dmg 文件后
   spctl -a -vvv -t install /path/to/MiaoWuTodo.dmg
   
   # 成功的输出应该包含:
   # /path/to/MiaoWuTodo.dmg: accepted
   # source=Notarized Developer ID
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

**如果 API Key 丢失或损坏**:
1. 登录 Apple Developer Portal
2. 进入 "Certificates, Identifiers & Profiles" → "Keys"
3. 找到对应的 Key，点击 "Revoke" 撤销
4. 重新创建新的 API Key
5. 更新 GitHub Secrets 中的 `APPLE_API_KEY_CONTENT` 和 `APPLE_API_KEY_ID`

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