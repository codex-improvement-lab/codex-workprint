# Codex Improvement Lab macOS 验收报告

> 状态：本地生成，未发送
>
> 验收日期：2026-08-30

## 1. 验收对象

- 候选包：`Codex-Improvement-Lab-macOS-retest-candidates-2026-08-30.zip`
- ZIP SHA-256：`2ba18c0bf49e9e015baeb17a3c1ac9c4af51240e7394f56f0da73a57e7d4c25d`
- 候选项目：Codex Matchup、Codex Tabs、Codex Decision Inbox、Codex Intake、Codex Proofline

## 2. 验收环境与范围

- 硬件：MacBook Pro（Mac15,6），Apple M3 Pro，arm64
- 系统：macOS 15.5（24F74）
- 方式：无人工交互的本机自动化验证，使用仓库自带 fixture 或合成数据
- 范围：包完整性、基础测试、离线产品路径、五个签名交互、页面运行错误检查
- 边界：未使用真实私人任务或账号数据，未执行发布、上传或对外发送；未把候选包内的操作说明自动视为用户授权

## 3. 总体结论

**整包暂不通过：5 个候选中 3 个通过，2 个未通过。**

| 项目 | 结论 | 验收摘要 |
| --- | --- | --- |
| Codex Matchup | PASS | 16/16 测试通过；离线 wheel 构建及运行资源检查通过；Identity Seal 可在盲选锁定后正确揭示身份 |
| Codex Tabs | PASS | 24/24 测试、release check、smoke 和 platform 检查通过；Airspace 可触发；关闭并重新打开 tab 不会删除底层任务 |
| Codex Decision Inbox | PASS | 7/7 测试及 smoke 通过；Quiet Queue 可进入、推进，并保留 parked 决定记录 |
| Codex Intake | FAIL | 核心、CLI 和构建通过，Provenance Lens 正常；15 项测试中 2 项在真实 macOS 下失败 |
| Codex Proofline | FAIL | 34 项测试通过、1 项 Windows 专属测试跳过；实现检查和 Gap Tour 通过，但候选包缺少发布检查明确要求的文件 |

## 4. 未通过项

### 4.1 Codex Intake

真实 macOS 下有两处可稳定复现的平台测试失败：

1. 测试在 Darwin 上仍期望验证器返回“not running on Darwin”，与实际运行平台矛盾。
2. 测试直接比较 `/var/folders/...` 与 macOS 规范化后的 `/private/var/folders/...`，未统一真实路径表示。

影响：候选的完整 macOS 自动门禁目前无法全绿。产品核心、CLI、静态构建和 Provenance Lens 交互均已通过。

建议最小修复：根据运行平台调整断言；路径比较前统一使用 `realpath`/规范化结果。无需重构产品。

### 4.2 Codex Proofline

`scripts/release-check.mjs` 将 `PROOFLINE_REPORT.md` 声明为必需发布文件，README 也链接该文件，但候选包中不存在，因此发布检查直接失败。

影响：候选包的发布材料不自洽，不能判定为完整通过。

建议最小修复：补入正确的 `PROOFLINE_REPORT.md`，重新执行 release check，并刷新包清单与候选哈希。无需增加新的审计框架。

## 5. 非阻塞环境说明

Codex Matchup 首次使用 PATH 中的 Git 2.15.0 时，因不支持 `git init -b` 而失败；切换到 macOS 系统自带 Git 2.39.5 后，16/16 测试全部通过。建议项目声明所需的最低 Git 版本或在 doctor 中给出明确提示，但本次不将其列为候选阻塞项。

## 6. 完整性与交互验证

- ZIP CRC：通过
- 路径穿越检查：通过
- 压缩包符号链接检查：通过，未发现符号链接
- `MANIFEST.sha256`：299 个条目全部匹配
- `SOURCE_SNAPSHOT.json`：292 个源码文件全部匹配；5 个项目的文件数和字节数与候选声明一致
- Identity Seal：通过
- Airspace：通过
- Quiet Queue：通过
- Provenance Lens：通过；S01 的 8 个关联信号被高亮，S02/S03 及无关信号被弱化，未观察到新增虚假来源关系
- Gap Tour：通过；浏览缺口前后 readiness 保持 `0/6`、missing 保持 `6`，浏览动作未把状态改为 verified
- 五个本地页面控制台错误：0

## 7. 复验通过条件

对方只需提交一次小范围修订包，并证明：

1. Codex Intake 的 15 项测试在真实 macOS 上全部通过。
2. Codex Proofline 包含 `PROOFLINE_REPORT.md`，且 release check 返回 0。
3. 更新后的 manifest、源码快照和 ZIP SHA-256 自洽。

满足以上三点后，可对两项失败候选做定向复验，无需重跑已经通过且源码未变化的三个项目。
