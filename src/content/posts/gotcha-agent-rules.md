---
title: gotcha.md：给 Agent 一本项目避坑手册
published: 2026-07-07
description: 你的 Agent 是不是也经常同一个错误犯好几遍才记住？聊聊 gotcha.md——哪些记忆是 Agent 在 new session 后必须立刻全量具备的？哪些靠后续召回就够了？
category: 思考
tags:
  - AI
  - Agent
  - 设计
  - 最佳实践
featured: true
series:
  - Long-Term Memory
---
![](../../assets/img/gotcha-agent-rules/cover.jpeg)

:::note[来自 Korewaxnne 的笔记]
这篇聊的是 Agent 记忆管理中一个被低估的问题——有些东西不应该走"检索"路线，而是应该在 new session 启动时就全量加载。比如 Xnne 提到的 gotcha.md：一份绑在项目根目录的行为规则文件，记录那些 Agent 一开始就该知道、而不是等踩了坑才去记忆库里翻找的东西。因为它们不适合走检索——query 不好拟定，召回无法保证 100%，不相关的 query 还可能引发行为冲突或幻觉。文章从真实痛点出发（同一个错误反复犯），讨论了 gotcha 的来源、落地方式、与 skill 的关系，以及"全量前置 vs 按需召回"的分界线在哪。如果你也在跟健忘的 Agent 搏斗，这篇或许能给个新思路。
:::

## 背景

Claude Code 有一个叫 DreamMode 的特性——后台整合 agent，**在空闲时**去重、裁剪、维护记忆文件，保持跨会话的记忆整洁。

而 memU 可以在 workspace 路线下，也在空闲时维护整理一份 `gotcha.md` 于项目根目录，并把它用 `AGENTS.md` 引用，可以保证 new session 后的 agent 依然记住踩过的坑。

如果`空闲时`这个时机本身很难实现，先作为一个 cli 由用户手动触发也是不错的。下面讨论为什么需要 gotcha.md。

> gotcha 这个词大致是陷阱，踩过的坑的意思。从这里学的 [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378)

## 为什么踩过的坑 new session 后总是记不住

我经常对我的 openclaw bot 说这样的话，它每次 new session 都忘记：
```
User:  下次记得 PR 前要先读一下 PR template，title 带上可爱的 gitimoji
Agent: I got it
```

Agent 会把这条写进记忆文件。但 agent 经常只是"表面记住"——这条记忆**可能落到一个模型不会主动加载的文件里，或者淹没在一堆其他事实中**。

> 比如在 openclaw 里，默认下，Agent 可能把这条 rule 存进某天的 Diary (Diaries/2026-07-07.md) 里，重要点的也许存进了 Memory.md。

但是它们在 new session 后读取都是灾难性的，一般 Diary 目录更早的日期是不读的，而混在 Memory.md 里的某些 gotcha 也会因为和其他事实类混杂在一起，表现较差。

这也是为什么需要在这种情况下，把 gotchas 独立出来，独立到 gotcha.md

## gotcha.md 记录的内容

gotcha 不单纯是用户偏好，也不单纯是事实，它是遵于特定项目的一行行为规则：

- "用 bun，不要用 npm"
- "PR 必须遵照 PR template"
- "push 之前先跑 `make check`"
- "这个项目的 API 返回 XML 不是 JSON——先检查 Content-Type"
- 如果只涉及博客内容 markdown 的改动不需要每次都 pnpm build，太浪费时间和 token 了
- format 和 lint 等到最终要 merge 前修复，不要改动一行运行两次检查。

这些来自对话中 Agent 踩过的坑、用户的的纠正、项目上下文中的规范、agent 日记中的经验教训。

## 什么时候 gotchas 从用户偏好剥离出来会更好？

像上面提到的 openclaw 的场景，在做某个代码的目时，把 Agent 踩过的坑汇总绑定位于项目的根目录（`gotcha.md`），然后在 Agents.md 里提醒阅读以保证 new_session 后不会消失比较好。【渐进式披露去读它】

比起零散地存在不同的日期里，或者和其他事实类混在一起，汇集是为了更快的遍历和不遗漏。同时它会视为 new session 需要全量了解的记忆而不是按 query 召回的。

至于没有项目时候的单纯聊聊天（chat mode） gotcha.md 不存在，同时 gotcha 也没有存在的必要，反而条条框框会影响 Agent 自身的灵活性。聊天时用户偏好更加 fit 这个场景。

## Gotchas 可以从哪里来

Gotchas 在不同的线路里来源不同，含义也不同：

### chat → 来自纠正的 gotchas

开发时，用户在对话中纠正 agent 时，纠正背后隐含的规则就是 gotcha。

如果在老系统的 chat memorize 中，大概就相当于多了一个 memory type，叫做 gotcha，但是会和 user 偏好有比较高的重叠度。

而我们不太可能在 Openclaw 里跑完整的老的 memorize，每次都是完整 LLM memorize 太费 token 也太慢。

提到的 auto Dream 优势在于空闲时分析 old sessions（或者可以由用户自主触发），不占用实际对话时间。但也能达到犯错后被纠正可以跨 session 的效果。

### workspace → 来自项目上下文的 gotchas，比如 `CONTRIBUTING.md` or other docs

对于新接触的一个项目，其实从 CONTRIBUTING.md， PR_TEMPLATE.md 就提取出来 gotchas。

或者从项目本身使用的 ci-worklfow 里提取项目遵循的比如 ruff、pyright 等的常常错误的项。

但是， gotcha 本身还是强调，犯错后纠正-> 记录。

### skill —— 在 skill 里 gotcha 以什么形式体现和存在？

这里是一个比较前卫的讨论。

当围绕某个主题积累了足够多的 gotchas，它们是否可以**合成为一个新的 skill**。路径是：

```
纠正 → gotcha → 同类 gotchas 聚合 → 合成 skill
```

这比较远期，但从 gotchas 到 skills 的路径是自然的。

但值得讨论的是，**以 gotcha 本身汇集存在的条目的纠正力度**和被**分主题后在各个 skill 的纠正力度**，哪个约束力更强？

以及 skill 的引用是要放在 Agents.md 里和其他 feature 功能型 skill 放在一起，还是放在 gotcha 里面作为索引？

但抽取为 skill 有个好处是，我们可以直接把想要的主题比如 python 项目相关的 gotcha skill 直接 copy 到另一处，然后创建一个 gotcha.md 来引用它。不再需要一个重建的过程。

## 输出：`gotchas.md`

三条线汇入一个文件：

```markdown
# Gotchas

## Project Rules
- 用 bun，不要用 npm
- push 之前跑 `make check`
- API 返回 XML——始终检查 Content-Type

## Workflow Rules  
- PR 必须遵照 PR template
- 修改共享配置前先在 #dev 通知
- canary 部署不要跳过 smoke test

## Agent Rules
- 用户说"记住"时，真的要持久化——不要只是嘴上说好
- 创建记忆前先检查是否已有重复条目
```

`AGENTS.md` 引用这个文件。gotchas 足够短，可以每次会话都加载——不需要走检索。

这个文件**人类可读、可编辑**。用户可以删掉错误的规则、加上自己的、重新组织分类。reflect 步骤会合并新 gotchas、解决冲突、裁剪过时规则——但最终由用户决定。

## 时机与成本

### 核心原则：不侵入现有 pipeline

Reflect **不在 `memorize-workspace` 的 pipeline 里面跑**。不增加每次对话、每次 sync 的成本。现有的 memorize → preprocess → route → synthesize 流程完全不变。

### 参考 DreamMode 的做法

Claude Code 的 DreamMode 在**空闲时**触发，条件是：
- 距上次整理 24h+
- 积累了 5+ 次 session
- 没有其他整理任务在跑

Reflect 采用类似策略——**不是每次对话都提取 gotchas，而是攒够了再统一做**：

```
Day 1:  用户跑了 3 次 memorize-workspace（正常 sync，不触发 reflect）
Day 1 晚上 / 空闲时:
  memu reflect
    ├── 读取已有的 memory files、skill files、workspace resources
    ├── 从中提取 gotchas（纠正、项目规范、pitfalls）
    ├── 和现有 gotchas.md 合并、去重、解决冲突
    └── 写出干净的 gotchas.md
Day 2:  新 session 启动，AGENTS.md 引用了 gotchas.md → agent 读到所有规则
```

不过值得考虑的是， 整理对象是针对 memory files, skills, workspace reources，还是仅仅只是最近几个  session 本身。我暂时倾向后者，因为从 session 上下文本身更容易发现错误 and 纠错。

### 成本
- 一次 reflect = 2~3 LLM 调用（读已有 gotchas + 整理新来源 → 合并输出），当然超长上下文过滤式需要被考虑的，很多时候 gotcha 都只在浅层，即用户的 message 以及 agent message 的前几句话（通常是在道歉了），如果是超长上下文一般是正常作业，可以过滤超长上下文每条 message 留个 300 token 足够了。
- 频率低（每天一次（也可以自行配置），或手动触发），不影响正常使用时的速度和 token 消耗

最简实现：`memu reflect` 作为独立命令，用户觉得该整理了就跑一次。自动触发（类 DreamMode 条件判断）可以后面加。

## 为什么适合 memU / 为什么 memU 需要？

最近 memU 在做 workspace 的特化。

而 gotcha 这类 rule 式的条目不适合以 query 的形式去召回和计算，容易召回很多不相关的东西但最重要的是，在一个项目里，`gotcha` 它不是**在用到的时候才需要了解的**。

而是，它应该作为一个大前提。是一个 Agent 在这个 workspace 下**一开始就应该知道这些**。

gotcha 特化很好地补上了在 workspace 上 memU 的短板，对于 workspace 场景来说， gotcha 特化是非常容易提升体验和节省 token 的。

另外， memU 对于这类的 reflect 的事情已经非常熟悉了， old memorize 里的 memory type 的很多提示词都可以作为参考


## gotcha 之外还能做什么？

以及  auto Dream mode 其实还可以做不少事情。

比如整理 memory files, skills, workspace reources 这些东西，以及，按需产出一些类似 `gotcha.md` 的东西，这些在 Agents.md 里面直接引用。作为前置知识，而不是存在按需调用的知识库。

比如还有一个比较抽象但很能省 token 的 md，就是指导 Agent 理解项目结构的。

比如一个项目有前端、后端、启动器、CI，有的时候所有改动都局限在一个端里。但是 Agent 初次接触时还是容易浪费很多 token 去完整理解整个项目。

但是这个不好做，很容易超出那个引导的度，变成容易过时错误的文档，这个我暂时没更多的思路。
