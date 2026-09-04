# Codex Improvement Lab macOS 定向复测报告

> 状态：本地生成，未发送
> 日期：2026-08-30
> 复测范围：Codex Intake、Proofline（仅复测上一轮未通过项）

## 结论

本轮定向复测 **未全部通过：1 项通过，1 项未通过**。

- **Proofline：通过。** 上一轮缺失的 `PROOFLINE_REPORT.md` 已补齐；35 项测试中 34 项通过、1 项 Windows 专用测试按预期跳过；发布文件门禁 28/28 通过。
- **Codex Intake：未通过。** 上一轮两项 macOS 平台测试问题均已修复，Vitest 为 15/15；但本次交付包缺少项目门禁明确要求的 `.agents/plugins/marketplace.json`，导致干净副本执行 `pnpm release:check` 时在首个 `check:project` 阶段退出码为 1。

结合上一轮已通过且本轮未要求重复验证的 Matchup、Codex Tabs、Codex Decision Inbox，目前五个候选中可确认 **4 项通过、1 项未通过**；整体暂不建议签收。

## 附件与身份核验

- ZIP SHA-256：`ccfebc7feccc878aa0fe13622957017a6b025536a88843be5b1e2e1f073599d2`，与随附 sidecar 一致。
- ZIP CRC：通过。
- 路径穿越与符号链接检查：通过，未发现异常条目。
- `MANIFEST.sha256`：通过。
- `SOURCE_SNAPSHOT.json`：123/123 文件的路径、字节数与 SHA-256 全部匹配。

候选身份：

- Codex Intake：`codex-intake@0.1.0+codex.20260826170524`
  - 内容 SHA-256：`32a15ab142dd6588a3e1e8f48c9e2dd5ce105002bb64710ee07c4f443589cd76`
  - 源快照 SHA-256：`321bb0b96288b59d7826f9b14756bb19745b00686ebe3caad2e1fce39e822743`
- Proofline：`codex-proofline-macos-rc-9bdf7995a611f15e`
  - 内容 SHA-256：`9bdf7995a611f15e6d012ce10da39075aea98ce7fc00516439056a1a6a99d746`
  - 源快照 SHA-256：`7a460bc356cbc2b77bc6e157bc36a5fb284ff166c6e2ec8e4b7906cc104556c5`

## 复测明细

| 候选 | 验证结果 | 证据 |
|---|---|---|
| Codex Intake | **未通过** | `pnpm test`：3/3 测试文件、15/15 测试通过；其中 `tests/platform.test.js` 5/5，确认 Darwin 断言和 `/var`/`/private/var` realpath 问题已修复。随后在干净交付副本执行 `pnpm release:check`，`check:project` 报错：`.agents/plugins/marketplace.json is missing.`，退出码 1。该文件同时被 `scripts/check-project.mjs` 列为必需文件，并在 README 中作为仓库 marketplace 的正式入口；交付清单中确实没有该文件。 |
| Proofline | **通过** | `PROOFLINE_REPORT.md` 存在；测试共 35 项，34 通过、0 失败、1 项 Windows 专用测试按预期跳过；发布文件门禁通过 28 个工件；候选 ID 与内容摘要匹配。 |

## 最小返修要求

Codex Intake 只需把缺失的 `.agents/plugins/marketplace.json` 纳入交付包，重新生成清单/快照后，再复跑一次干净副本的 `pnpm release:check`。无需重复 Proofline，也无需重复上一轮已通过的另外三个候选。

## 可直接转发的结论

> macOS 定向复测结果：Proofline 已通过。Codex Intake 上一轮两项平台测试问题已修复，15/15 测试通过；但新交付包遗漏了项目发布门禁要求的 `.agents/plugins/marketplace.json`，导致干净副本的 `pnpm release:check` 仍失败。因此本轮整体暂不通过，请补齐该文件、更新清单后仅回传 Intake 复测包。
