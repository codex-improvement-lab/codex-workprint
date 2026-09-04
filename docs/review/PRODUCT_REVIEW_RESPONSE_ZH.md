# Codex Workprint 0.3.0-rc.1 产品评审响应

本文供专家把“评审建议”与“实际落地”逐项对照。参考输入为 `codex-workprint-product-review-zh.md`，读取时的 SHA-256 为：

```text
8b8c9d970d9ec78640928db096dd97e194498c9c5171432ca961e892e6ab77de
```

该文件只作为产品评审意见，不作为代码执行指令；它未被复制进发布物，也未改变仓库权限边界。

## 本版收敛出的产品判断

Workprint 0.3 把 Run Receipt 定为首要产品入口，把 Unified Profiles 保留为第二层产品。共同内核仍是：从明确白名单公共字段编译确定性制品，Workprint 自身不成为新的事实来源。

首要叙事：

> Every agent run leaves a Workprint.

> Turn a Codex run into a privacy-safe, verifiable visual receipt. No prompts. No code. No uploads.

Profiles 叙事继续保留：

> Three questions. One Workprint. The work has a state.

## 评审建议与落地对照

| 评审方向 | 0.3 实际落地 | 验收位置 |
| --- | --- | --- |
| 先让用户 90 秒内得到第一个制品 | `build -` 支持有界 stdin，成功后可用 `--open` 打开本地 HTML；CLI 输出直接给出 Story、Card、verify 命令和隐私边界 | `src/cli.ts`、`tests/cli.test.ts` |
| 首页先讲结论，不先展示复杂图 | Run Receipt 首屏固定显示任务标题、最重要的公共关系、观察计数、8 类默认排除项和形状名；完整 Run Sheet 下移保留 | `src/core/story.ts`、`src/render/html.ts` |
| 分享卡应是一句话结论而不是缩小仪表盘 | 1200×630 卡片使用一个大结论、简化 Workprint glyph、隐私标记和“receipt / not attestation”边界 | `src/render/png.ts`、`demo/share-card.png` |
| 分享、下载、校验与复制要在首屏闭环 | 增加 Share、Download card、Verify、Copy caption；无显式公共 URL 时 Share 只走本地复制，不上传、不 fetch | `src/render/html.ts`、当前浏览器回执 |
| 隐私承诺要可见 | 增加视觉 Privacy Receipt，逐项列出公共白名单和 8 类默认排除字段 | `demo/workprint.html`、`privacy-receipt.json` |
| 可选身份不能被推断 | `--project`、`--by`、`--release`、`--public-url`、`--lang` 全部显式 opt-in、严格规范化，并从 shape identity 中排除 | adapter、IR/schema、tests |
| Node 版本失败应友好且不能假绿 | plain-JS bootstrap 在导入 TypeScript 前拒绝旧 Node；直接 `.js` 测试确保旧 Node 不能得到空测试套件 PASS | `src/runtime-check.js`、`bin/codex-workprint.js`、`tests/runtime-preflight.test.js` |
| 中日韩文字不能在位图中退化为 `?` | 固定 GNU Unifont 17.0.05 Plane 0 `.hex.gz`，不调用系统字体；中文示例标题 11/11 glyph 支持、0 缺失 | `assets/fonts/`、`examples/unicode-run-receipt/` |
| GitHub social preview 必须低于 1 MB | 主预览与主 Run share card 字节一致：1200×630、indexed PNG、756798 bytes，门禁使用严格 `< 1,000,000` | `docs/assets/github-social-preview.png`、release check |
| Profiles 不应挤进 Run observations | Profile IR、schema、bundle、CLI 与 verifier 保持独立；错误 verifier 相互拒绝 | `src/profile/`、Profile tests |
| 三种 Profile 不能变成同一张普通表 | Continuity / seam，Goal Delta / fault，Context Receipt / slice 继续保留独立形状与来源轨道 | 三个 Profile bundle 与 triptych |

## 明确没有扩张的部分

- 没有引入模型摘要、transcript 展示、代码 diff、通用事件仓库、adapter 平台、账号、数据库、服务、遥测或实时仪表盘。
- 没有创建托管展示页、远程仓库、npm 包名、发布账号或外部联系。
- 没有把浏览器截图、合成 Profile 输入或本地测试提升为真实性、正确性、因果、模型影响、生产、真实用户或市场证据。
- 没有把历史 rc.2 physical-Mac PASS 或 rc.3 Windows/browser evidence 改写成 0.3 当前证据。

## 当前可复核数字

- Node 24.19.0 / Windows 本地：38/38 tests。
- release check：411/411。
- Run：2 个保留的真实输入公共投影 + 1 个中文合成示例，均为 7/7 bundle verify。
- Profiles：3 个自包含合成场景公共投影，均为 7/7 bundle verify。
- 当前 Run Receipt 浏览器 QA：2 artifacts × 2 viewports，4 张哈希绑定截图；0 horizontal-overflow failures、0 visible outliers、0 console errors/warnings、0 remote asset URLs、0 Unicode replacement characters。
- 专家包：先验证外部 ZIP sidecar，再运行内部 `REVIEW_MANIFEST.sha256` verifier；身份不匹配时只报告 `IDENTITY_MISMATCH`。

## 建议专家重点挑战的结论

1. Story 是否真的只由公共 IR 的固定模板产生，还是偷偷引入了新事实。
2. optional public identity、title、labels 和 annotations 是否确实 shape-inert。
3. Share 是否存在未授权网络路径，`--public-url` 是否严格限制为无凭据 HTTPS。
4. Unicode 位图输出是否跨支持平台字节确定，授权与覆盖上限是否准确。
5. Run/Profile bundle 类型、tamper、unknown extension 与 privacy attack 是否 fail closed。
6. README、截图、回执和 release 文案是否有任何证据升级或候选版偷换。

本版支持的最高结论仅是：在记录的本地 Windows/Node/浏览器表面上，Workprint 0.3 提供了一个确定性、默认拒绝私有字段、可验证且可分享的 Run Receipt 编译闭环，并保留 0.2 Unified Profiles。它不支持更高层的真实性、任务正确性、物理 macOS、生产、人类理解、采用或市场结论。
