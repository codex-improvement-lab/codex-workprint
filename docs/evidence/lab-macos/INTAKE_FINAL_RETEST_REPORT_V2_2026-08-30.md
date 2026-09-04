# Codex Improvement Lab macOS Intake 最终复测报告（v2）

> 状态：本地生成，未发送
> 日期：2026-08-30
> 复测范围：仅 Codex Intake 上一轮阻塞项与完整发布门禁

## 结论

**复测通过，Codex Intake 可以验收。**

上一轮遗漏的 `.agents/plugins/marketplace.json` 已纳入本次交付包；在 macOS 外置工作区的干净解压副本中，离线恢复锁定依赖后执行完整 `pnpm release:check`，最终退出码为 0。项目门禁、Vitest、构建、Playwright 和 marketplace 校验全部通过。

结合此前已通过的 Codex Matchup、Codex Tabs、Codex Decision Inbox 和 Proofline，当前五个候选为 **5/5 通过，整体可验收**。

## 附件与源码核验

- ZIP SHA-256：`198a45ee111bee7804f191653c6ec3dd0f3b31f11877d61d9115f147a0a139bb`，与随附 sidecar 一致。
- ZIP CRC：通过。
- `MANIFEST.sha256`：初次及门禁后复核均通过，65/65 文件匹配。
- `SOURCE_SNAPSHOT.json`：59/59 文件、716,422 字节全部匹配，无摘要或字节数差异。
- `.agents/plugins/marketplace.json`：存在且通过项目门禁。
- 依赖安装：锁文件通过供应链策略检查；70 个包全部从既有本地缓存复用，0 下载。

候选身份：

- Candidate ID：`codex-intake@0.1.0+codex.20260826170524`
- Content SHA-256：`74883da55dae3e581fdb22e4cb1db7a58894c38a0041fe4aed69b99e2974454e`
- Source SHA-256：`d95026b00a87d795aeb298673203b3b687518bb9e88af5f5223487896308dc49`
- Whole snapshot SHA-256：`a48b804e5f35d0cf8894291fe58a356ac2fa0f294ad6c73ab35ae4b5da4a6476`

`control/CANDIDATES.json`、`release/REPLACEMENT_CANDIDATE.json` 与生成的 `.codex-package.json` 中 Candidate ID 和 Content SHA-256 完全一致。

## 完整发布门禁

| 门禁 | 结果 |
|---|---|
| `check:project` | **通过**：28 个发布文件、9 个可追溯 demo findings、0 个原始 fixture 泄漏 |
| macOS 静态设计预检 | **通过**：darwin-arm64、darwin-x64 |
| Vitest | **通过**：3/3 测试文件，15/15 测试；`platform.test.js` 5/5 |
| Vite 构建 | **通过**：9 个模块完成转换与产物生成 |
| Playwright | **通过**：Chromium 5/5，包括本地 OCR、Mac handoff 顺序和异常二进制拒绝 |
| Marketplace | **通过**：候选身份正确，内容摘要与控制记录一致 |
| `pnpm release:check` | **通过**：退出码 0 |

完成完整门禁后再次执行 `pnpm marketplace:prepare`，仍生成同一 Content SHA-256：

`74883da55dae3e581fdb22e4cb1db7a58894c38a0041fe4aed69b99e2974454e`

随后再次核验外层 `MANIFEST.sha256`，结果仍为通过。

## 验收处置

- Codex Intake：**PASS**。
- Proofline：沿用上一轮定向复测 **PASS**。
- Codex Matchup、Codex Tabs、Codex Decision Inbox：沿用首轮 **PASS**。
- 五候选整体：**5/5 PASS，可以验收**。

本次验证全部自动完成；浏览器测试仅访问本机 `127.0.0.1`，没有人工操作，也未对外发送任何文件或结果。

## 可直接转发的结论

> Codex Intake macOS 最终定向复测已通过。新交付包已补齐 `.agents/plugins/marketplace.json`；完整 `pnpm release:check` 退出码为 0，Vitest 15/15、Playwright 5/5、构建和 marketplace 校验全部通过，二次打包内容摘要保持一致。至此五个候选均已通过验收，可按 5/5 PASS 收口。
