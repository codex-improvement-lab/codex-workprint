# Workprint 发行包

候选版本：`0.3.0-rc.3`。[GitHub 预发布页面](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3)提供下列发行包；未发布到 npm。

## 推荐入口：便携 ZIP

解压后进入包内目录，使用 Node.js 22.18.0 或更新版本（推荐 Node 24 LTS）：

```text
node ./bin/codex-workprint.js build ./examples/first-run/input.jsonl --title "Synthetic first run" --out ./first-workprint
node ./bin/codex-workprint.js verify ./first-workprint
```

打开 `first-workprint/workprint.html`。内置输入是明确标记的合成示例，不需要账号、API key 或模型调用。

## 文件

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| [codex-workprint-0.3.0-rc.3.tgz](https://github.com/codex-improvement-lab/codex-workprint/releases/download/v0.3.0-rc.3/codex-workprint-0.3.0-rc.3.tgz) | 1038584 | `094ec6a24583f18c6740def2c4cf9b3797b4d9406649b87b96b023a8b43db673` |
| [codex-workprint-0.3.0-rc.3-portable.zip](https://github.com/codex-improvement-lab/codex-workprint/releases/download/v0.3.0-rc.3/codex-workprint-0.3.0-rc.3-portable.zip) | 1073058 | `386df2a3e23329afdce97780809cba2b16883ed028cea6977b9733a675cb2710` |

校验文件与归档同名，后缀为 `.sha256`，与归档一起提供在 Release 中。归档不随源码提交。

[安装验证记录](PACKAGE_VERIFICATION.json) · [发行准备说明](../docs/RELEASE_PREPARATION_2026-09-05.md) · [功能与 UI 分析](../docs/PRODUCT_AND_UI_OPPORTUNITIES_2026-09-05.md)

包内为已生成的 JavaScript，避免 Node 对 node_modules 中 TypeScript 的限制。离线安装、命令入口、stdin/file 一致性、三种 Profile 与便携包均已验证。rc.2 的 Mac 基线验收保留；rc.3 没有新实机 Mac 验收。托管结果以该版本提交的 [Actions 记录](https://github.com/codex-improvement-lab/codex-workprint/actions)为准。
