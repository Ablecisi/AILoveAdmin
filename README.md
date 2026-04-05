# AILove Admin（运营后台）

Vue 3 + Vite + Element Plus + Pinia + ECharts。通过 `VITE_API_BASE` 连接 `AILoveBacked` 的 `/admin/api/v1/*`。

## 文档（需求、架构、规范）

- **规则与产品设计（权威）**：仓库根目录 [`.cursor/rules/ailove-prd-architecture-admin.mdc`](../.cursor/rules/ailove-prd-architecture-admin.mdc)
- **任务 Backlog 与实现快照**：[`.cursor/plans/ailove-prd-architecture-admin-roadmap.md`](../.cursor/plans/ailove-prd-architecture-admin-roadmap.md)

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 主要能力（摘要）

- 驾驶舱：聚合指标、DAU、兴趣关系图；图表配色可与全局主题分离（外观与菜单中配置）。
- 主题：`localStorage` 与 `app_config` 键 `admin.ui.theme` 可选双写，支持恢复默认。
- 业务页：用户、AI 角色、文章、评论、会话与消息、Prompt、数据维护、App 配置等；列表表头中文、字段对齐后端。
- 图片：OSS 上传组件与 URL 展示（见 `src/utils/mediaUrl.js`、`src/api/adminUpload.js`）。
