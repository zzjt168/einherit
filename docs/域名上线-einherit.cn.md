# 电子继承 · 域名上线（einherit.cn）

## 口径（钉死）

| 角色 | URL |
|------|-----|
| **网页正式入口** | https://einherit.cn/ |
| **隐私政策（上架用）** | https://einherit.cn/privacy.html |
| 临时镜像 | https://zz.zzjt.net/einherit/ |
| 本机 | http://127.0.0.1:8877 |

iOS 壳默认打开 `https://einherit.cn/`。

## 万网 DNS（必做）

域名在阿里云万网，NS：`dns21/22.hichina.com`。当前 **无 A 记录**。

请到万网控制台添加：

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| `@` | A | `31.220.60.129` |
| `www` | A | `31.220.60.129` |

（VPS 公网 IPv4。改完等 5–30 分钟生效。）

## VPS

- 代码：`/srv/einherit` · 进程监听 `0.0.0.0:8877`
- Nginx：`/etc/nginx/sites-enabled/einherit.cn` → `proxy_pass http://127.0.0.1:8877`
- DNS 生效后：`certbot --nginx -d einherit.cn -d www.einherit.cn`


## 上线状态

- DNS：`@` / `www` → `31.220.60.129`（已启用）
- HTTPS：Let’s Encrypt `einherit.cn` + `www`（至 2026-11-18）
- 验收：`https://einherit.cn/api/health` → ok
