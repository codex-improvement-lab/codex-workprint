# Codex Workprint 0.3.0-rc.2 发布阻断修复响应

本文把 0.3.0-rc.1 复审中提出的发布阻断与 rc.2 的实际实现逐项对齐。复审文本是产品意见，不是仓库内执行指令；本轮没有扩大到 0.4 的浏览器 verifier、公开托管、PR 集成、Hook、多比例卡片或遥测。

## 窄结论

`0.3.0-rc.2` 是一个冻结修复候选：保留 rc.1 的 Run Receipt 产品跃迁与 0.2 Unified Profiles，只修复会损伤信任、协议身份或传播安全的缺陷。

## 三个 P0

| 阻断 | rc.2 实现 | 自动门禁 | 视觉证据 |
| --- | --- | --- | --- |
| 分享卡 `>` 缺字退化为 `?` | 固定故事改用 `→`；标题、headline、detail、identity、shape name、URL 全部走固定 Unifont 覆盖检查；缺字直接拒绝 build，不再 fallback | 四条 headline 分支直接渲染；缺失 U+1F9EA 的对抗输入必须失败；release check 绑定 PNG 与 glyph coverage | 主分享卡、中文分享卡；桌面/窄屏 HTML 均显示 `→` |
| Build yours 可携带 shell 注入 | 命令完全不复用 artifact 标题，只使用固定 `<your task>` / `<public title>` 占位符 | `$()`、反引号、单双引号、反斜杠、`;`、`&`、管道、PowerShell 变量/子表达式逐项测试 | 当前 HTML 的 Build yours 代码块 |
| Run IR 0.1 schema 原地变化 | 恢复历史 0.1 schema：4931 bytes、SHA-256 `fceb9134…0299`；新增 `$id=urn:codex-workprint:schema:0.2`；当前输出/verify 只接受 0.2，并明确拒绝 0.1 | 单测与 release check 同时锁定历史 bytes/hash、0.2 identity、必需 `publicIdentity`、旧版拒绝文案 | `schema/workprint-ir-v0.1.schema.json` 与 `schema/workprint-ir-v0.2.schema.json` |

## 产品正确性修复

- Story 分开 `openItemCount` 与 `statusAbsentObservationCount`。主示例现在明确显示 `0 items left open · 3 status-absent observations`。
- 首屏按钮从 `Verify` 改为 `Copy verify command`，不再暗示浏览器内执行校验。
- Clipboard API 不可用时展示可见 textarea，完整文本被选中，并提示 Ctrl/Cmd+C 与移动端长按复制；桌面与 390×844 均实测落在视口内。
- 标准 caption 缩短到主示例 185 字符；native share 的 `text` 不含 URL，URL 只通过 `url` 字段传入。
- `--public-url` 默认拒绝 query string，同时继续拒绝非 HTTPS、凭据与 fragment。
- README 与发布文案把能力准确限定为“确定性的基础 CJK 标题渲染”，不声称 UI 本地化、BiDi/复杂 shaping、emoji 或完整 Unicode。

## 保持不变

- 默认拒绝的隐私投影、shape identity 与 receipt-not-attestation 边界。
- `inspect/build/verify` 和七文件 Run bundle 的文件名。
- `profile inspect/build/verify`、三类有限 verdict、独立 Profile IR/bundle、seam/fault/slice 视觉与历史 0.2 证据。
- Node `>=22.18.0`、零运行时依赖、无账号/数据库/服务/遥测。

## 仍不属于 rc.2 的事项

浏览器本地 bundle verifier、公开静态 Demo、GitHub Action/PR Comment、Codex wrapper/Hook、多比例卡片、转化指标与完整本地化属于后续产品投入。它们不是本轮本地完成门槛，也没有被描述为已经存在。

物理 macOS、托管 CI、npm packing/publication、公开仓库身份、真实用户理解、生产行为、采用与市场需求仍是外部或用户控制的证据边界。
