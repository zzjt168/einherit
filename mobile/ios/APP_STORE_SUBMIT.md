# 电子继承 App · App Store 上架进度

## 已完成

| 项 | 状态 |
|----|------|
| Bundle ID `com.zzjt.einherit` | ✅ 已建（Developer） |
| iOS 工程 `mobile/ios` | ✅ XcodeGen + WKWebView 壳 |
| 线上服务（正式入口） | ✅ `https://einherit.cn/` |
| 隐私政策 | ✅ `https://einherit.cn/privacy.html` |
| 临时镜像（备用） | `https://zz.zzjt.net/einherit/`（DNS/证书未好时可先用） |
| Release 归档 + IPA | ✅ `mobile/ios/dist/EInherit.ipa` |
| 分发描述文件 | ✅ App Store Distribution |

## 卡点（需苹果账号网页点一下）

当前 ASC API Key **不能创建新 App 记录**（只允许读/改已有 App）。  
上传报错：`Cannot determine the Apple ID from Bundle ID com.zzjt.einherit`。

### 请你现在做这一步（约 1 分钟）

1. 打开：https://appstoreconnect.apple.com/apps  
2. 点「+」→ 新建 App  
3. 平台 iOS；名称 **电子继承**；套装 ID 选 **com.zzjt.einherit**；SKU `einherit001`；主语言简体中文  
4. 建好后跟我说一声「建好了」——我立刻上传 IPA、补商店信息并提交审核。

## 本地命令备忘

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd /Users/admin/ai-hq/电子继承/mobile/ios
# 上传（App 记录建好后）
source /Users/admin/AI_Workspace/zezong-zhiguan/mobile/ios-seal/signing/asc.env
xcrun altool --upload-app -f dist/EInherit.ipa -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
```
