# Cloudflare 手动部署指南

如果你熟悉 Cloudflare 和命令行，或者想自定义/精细控制首次安装与资源配置，可以按照以下指南进行手动部署。日常更新统一由 Cloudflare Workers Builds 完成；本地部署仅用于首次安装和紧急修复。

> 💡 **提示**：如果是通过 AI 助手（Claude Code、Codex、Antigravity、Cursor 等）进行部署，AI 助手应优先参考 [AI Agent Cloudflare Deployment](https://github.com/tianma-if/edgeever/blob/main/docs/agent-deploy-cloudflare.md) 约定。

## 部署步骤

1. **Fork 官方仓库**：
   访问并 Fork 官方仓库：[https://github.com/tianma-if/edgeever](https://github.com/tianma-if/edgeever)

2. **Clone 你的 Fork 仓库**：
   ```sh
   git clone <你的 Fork 仓库 URL>
   cd edgeever
   ```

3. **使用自动化辅助命令部署**：
   ```sh
   # 复制配置文件模板
   cp .env.local.example .env.local

   # 安装依赖
   bun install

   # 执行部署初始化，默认登录账号密码为 admin / admin123
   bun run deploy:setup

   # 诊断部署环境与配置
   bun run deploy:doctor

   # 执行部署
   bun run deploy
   ```

   如果希望首次登录就使用自定义密码，可改为执行 `EDGE_EVER_PASSWORD='<你的密码>' bun run deploy:setup`。部署成功后也可以在个人中心修改密码。

   `deploy:setup` 始终直接使用项目内安装的 Wrangler，不要求全局安装 `wrangler`，并兼容 PowerShell、CMD 与 Git Bash。若尚未授权 Cloudflare，该命令会自动启动 `wrangler login`；浏览器没有自动打开时，请复制终端显示的授权链接到浏览器完成登录，然后保持命令运行到验证结束。

### 完全手动创建 Cloudflare 资源

如果你不想使用 `deploy:setup` 自动化脚本，也可以完全手动使用 Cloudflare CLI (Wrangler) 创建资源：

```sh
# 复制配置文件模板并安装依赖
cp .env.local.example .env.local
bun install

# 手动创建 D1 数据库
bunx wrangler d1 create edgeever

# 手动创建 R2 存储桶
bunx wrangler r2 bucket create edgeever-resources

# 编辑 .env.local，至少填入刚创建的资源配置
# EDGE_EVER_D1_DATABASE_ID=<D1 创建命令返回的 database_id>
# EDGE_EVER_R2_BUCKET_NAME=edgeever-resources
# EDGE_EVER_AUTH_PASSWORD=admin123
# EDGE_EVER_SESSION_TTL_DAYS=400

# 确认配置完整后再部署
bun run deploy:doctor
bun run deploy
```

必须在执行 `bun run deploy` **之前**，将 D1 创建命令返回的 `database_id` 和 R2 bucket 名称写入本机 `.env.local`。模板的初始登录账号密码为 `admin` / `admin123`；如需使用其他初始密码，可修改 `EDGE_EVER_AUTH_PASSWORD`。会话有效期建议保留模板中的 `400` 天；服务端也会把更大的值限制为 400 天。

`bun run deploy` 会构建 Web 应用、执行远程 D1 migration、部署 Worker，并将 `EDGE_EVER_AUTH_PASSWORD` 作为 Worker Secret 上传。首次登录成功后，EdgeEver 会将加盐的 PBKDF2-SHA256 哈希写入 D1。已有实例可以继续使用 `EDGE_EVER_AUTH_PASSWORD_HASH`；两个 Secret 同时存在时优先使用哈希。部署完成后，请使用 `.env.local` 中的 `EDGE_EVER_AUTH_USERNAME` 和配置的密码登录验证。

`.env.local` 只供本机 EdgeEver 脚本读取，不会作为文件自动上传到 Cloudflare，也不应手工上传或提交到 Git。若从 Cloudflare Dashboard 直接触发构建，该文件中的 D1、R2 和密码配置不会自动生效；请使用 `bun run deploy` 完成首次部署，再使用 `bun run deploy:builds:setup` 将必要配置安全地写入 Workers Builds。

部署命令会先自动执行 `deploy:doctor`，缺少 D1 ID、R2 bucket 或登录密码时会直接停止。远程 D1 migration 会以非交互模式自动执行，不需要用户确认，避免取消操作被 Wrangler 误报为成功。迁移脚本还会在调用 Wrangler 前确认本地 SQL migration 存在，并使用跨平台的绝对迁移目录，避免 Windows 上出现命令成功但没有迁移任何表的情况。部署完成后还会执行 `deploy:verify`，检查远程 D1 的关键数据表和 Worker 鉴权 Secret；任一缺失都会让部署以失败退出。Worker 也采用安全关闭策略：生产实例既没有密码 Secret、又没有有效用户时，会返回 `auth_not_configured`，不会降级成免登录工作区。`/api/health` 会检查 D1 和鉴权初始化状态；只有返回 `200` 且包含 `"ok": true` 才表示实例真正可用。

已有实例无需迁移。如果确实要从哈希配置切换为 `EDGE_EVER_AUTH_PASSWORD`，需要同时从 `.env.local`、Workers Builds 和 Worker 运行时 Secrets 中移除旧的 `EDGE_EVER_AUTH_PASSWORD_HASH`，否则旧哈希仍会优先生效。

### 登录或数据库初始化故障恢复

- 登录页显示“数据库尚未就绪”或接口返回 `database_not_ready`：确认 D1 binding 名称严格为 `DB`，然后执行 `bun run db:migrate:remote && bun run deploy`。
- 登录页显示“实例尚未完成安全配置”或接口返回 `auth_not_configured`：在 `.env.local` 配置 `EDGE_EVER_AUTH_PASSWORD`，然后执行 `bun run deploy`。不要通过清空账号配置绕过登录。
- 已经手工向 `users` 表写入账号密码：不要向 `password_hash` 写明文。EdgeEver 会拒绝无效哈希并在登录页提示安全恢复命令，请执行：

  ```sh
  EDGE_EVER_PASSWORD='<至少 8 位的新密码>' \
    bun run auth:reset-password -- --remote --username admin
  ```

  该命令会生成兼容的 PBKDF2-SHA256 哈希并撤销该账号的旧会话，不会删除笔记数据。

Cloudflare 控制台中的 binding 名称必须严格使用 `DB`（D1）和 `RESOURCES`（R2）。普通变量 `EDGE_EVER_AUTH_USERNAME` 不能代替加密 Secret `EDGE_EVER_AUTH_PASSWORD`。

---

## 开启自动更新

首次部署后，必须将 Worker 连接到 Fork 的 `main` 分支；Cloudflare Workers Builds 是所有 EdgeEver 实例的标准生产发布路径。请先按 [Cloudflare Workers Builds 自动部署](cloudflare-workers-builds.zh-CN.md) 创建仅供配置使用的 **User API Token**（不是 Account API Token），将它私下写入 `.env.local` 的 `EDGE_EVER_BUILDS_API_TOKEN`，然后执行：

```sh
bun run deploy:builds:setup
```

该命令会配置 Git 仓库连接、生产触发器、构建变量和 D1 migration 所需的部署 token。完成后，只需在 Fork 页面点击 **Sync fork**，或推送到 `main`；Cloudflare 会自动构建 Web、应用新的远程 D1 migration 并发布 Worker。不需要 GitHub Actions Secrets，也不需要本地重新部署。

请保留 `bun run deploy` 作为首次安装和紧急修复的入口。
