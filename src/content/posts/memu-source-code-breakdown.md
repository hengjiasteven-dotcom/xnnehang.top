---
title: memU 是啥？我们来拆开看看（长期更新）
published: 2026-06-29
updated: 2026-07-14
category: 边写边学
tags:
  - memU
  - 记忆系统
  - 提示词设计
description: 拆解 memU，专注拆分主线路，以及分析 ADR 架构文档，当前跟进至 ADR 0008。
series:
  - Long-Term Memory
featured: true
pin: true
---
![](../../assets/img/memu-source-code-breakdown/cover.jpeg)

> [!NOTE]
> **AI 协作声明：** 本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot)（赛博猫猫）共同撰写。Xnne 负责内容方向和技术分析，Korewaxnne 协助了结构组织、语法润色和格式整理。<br>
> 并且，这个博客会长期更新。

上次其实已经拆过一次 memU 了。

但是因为处在架构迭代期，并且也没有 ADR0007 的阅读指导。所以这边把上次的 break down 全部都删除了。这无形中又增加了这篇的阅读难度，我尽量地让它更简单。

## memorize / retrieve pipline changes

之前 memorize 是一个单独 python 脚本， retrieve 也是一个单独 python 脚本。

之前 memorize 和 retrieve 的对象是 `单文件(Chat)` + `Skill`。

之前 retrieve 的方式是 `LLM retrieve` + `RAG retrieve`，区分 mode, 一次只走一条路线。

在 [#466](https://github.com/NevaMind-AI/memU/pull/466) 之后。

### memorize

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)
![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-2.png)

memorize 变成了两个脚本—— `memorize.py` + `memorize_workspace.py`

memorize 和 retrieve 的对象新增了一个 `workspace`。

简单来说就是，先前的 memorize 的对象是像 mem0 那样子，是一组对话:

```json
{
"user": "hi",
"assistant": "hi,how can I help you today?",
...
}
```

准确说是一个 single-file。还可能是一个长字符串啥的，它不包含复杂的嵌套层级关系。

workspace 的对象是一个 folder。并且可以是复杂的 folder 比如项目目录。

workspace 的 retrieve 放在后边讲。

### retrieve

![](../../assets/img/memu-source-code-breakdown/retrieve-pipeline.png)

retrieve 在 ADR 0007 里提到了要实现 BM 25 + hybrid search 的方法。不过这个方法目前暂时还没实现，`retrieve-workspace` 也只是简单的 `top-k`。

不知道是不是之前给 mentor 唠嗑的这个 [[站在 C 端开发者的角度看 memU 的架构转向]] 起了作用。好像 mentor 说服 leader 保留 LLM retrieve 和 RAG retrieve 了。在 [#467](https://github.com/NevaMind-AI/memU/pull/467) 里，它们都被加入了 cli:

```python
memu memorize notes/meeting.md
memu memorize-workspace ./workspace
memu retrieve "What are this user's launch preferences?"
memu retrieve-workspace "deploy checklist"
memu export
```

其中 retrieve 是之前 old version 配置 `RAG` 和 `LLM` 任一启用的。

然后同样把 workspace 都独立实现了。

其实还是有一丢丢架构的冗余的，比如 retrieve 是否还需要保留 `RAG mode`，按道理是需要保留的，但是保留后和  `retrieve-workspace` 原理类似但做的内容又不一样。

但如果删了复用 `workspace` 它又和语义不一样。总之这一点会让对架构挑剔度敏感的人有一些不舒服，因为它不对称。完全使用 workspace 替代 `RAG/LLM retrieve` 最舒服的架构，但也得取舍。

但是对于我来说，it's okay。以及，至少咱争取了 `LLM retrieve` 的保留。并且它似乎也真的有留下来的迹象——希望不是分多个 PR 剪除 =-=。


## Data Model Changes



### old memorize 

```
Resource ──1:N──▶ RecallEntry ──N:M──▶ RecallFile
                                  (通过 RecallFileEntry)
```

一个 Resource（原始文件）产出多个 RecallEntry（LLM 提取的条目），条目通过 RecallFileEntry 关联到 RecallFile（主题文档，如 "Profile"、"Goals"）。

### latest memorize（add workspace pipline）

```
Resource ──N:M──▶ RecallFile ──1:N──▶ RecallFileSegment
              (通过 RecallFileResource)
```

workspace 路径跳过了 RecallEntry，Resource 直接通过 RecallFileResource 关联到 RecallFile。然后每个 RecallFile 被切成多个 RecallFileSegment 用于检索。

### Data Model

<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![data-model](../../assets/img/memu-source-code-breakdown/data-model.png)

</div>

### What's new?

**`RecallFileSegment`** —— 最重要的新增。一个 RecallFile 被切成 1~N 个 segment，每个 segment 有自己的 text 和 embedding。检索时搜 segment，命中后 roll up 到所属的 file。切法按 track 不同：
- skill：整个 skill 一个 segment（`name: ...\ndescription: ...`）
- memory：按行切，跳过空行和 markdown heading

**`RecallFileResource`** —— Resource 到 RecallFile 的多对多关联表（provenance）。记录"这个 file 的内容是从哪些 source file 合成来的"。旧路径通过 Entry 间接关联，新路径需要这个直接链接。

**`Resource.track`** —— 新字段，标记来源：`"chat"` / `"skill"` / `"workspace"`，旧路径的 Resource 是 `None`。workspace retrieve 通过 `track="workspace"` 过滤只搜 workspace 来源的 Resource。

### 两条路径共存

旧路径（RecallEntry 那条）**没有被删除**。`memorize.py` 仍然走 Resource → Entry → File 的链路。两条路径**共用同一张 RecallFile 表**，靠 `track` 字段区分（`"memory"` vs `"skill"`）。这也是 ADR 0007 终态要消除的——最终目标是三条 line 各有独立 store，不再靠 `track` 列区分。

### what's track?

track 这个词在数据模型里出现了三次（Resource、RecallFile、RecallFileSegment），但其实是**两层含义**：

**第一层：Resource.track —— "这个源文件从哪来的？"**

由 `memorize_workspace` 按目录名自动分类：

| 顶级目录 | Resource.track | 含义 |
|---|---|---|
| `chat/` | `"chat"` | 对话记录 |
| `agent/` | `"skill"` | agent 执行日志 |
| 其他 | `"workspace"` | 普通项目文件 |
| （旧 memorize） | `None` | 单文件路径，没有 track 概念 |

**第二层：RecallFile.track / RecallFileSegment.track —— "这个文档是什么性质的？"**

只有两个值：`"memory"`（记忆主题文档）和 `"skill"`（技能文档）。

**两层之间的映射：**

```
Resource.track    →    RecallFile.track
─────────────────────────────────────────
"chat"            →    "memory"
"skill"           →    "skill"
"workspace"       →    ❌ 不生成 RecallFile
```

workspace track 的文件只存 Resource（带 caption + embedding），用于 `INDEX.md` 的检索。不合成文档，不切 segment。

RecallFileSegment.track 是从所属 RecallFile 冗余复制过来的，目的是检索时不用 join 就能按 track 过滤。

:::note
后续似乎要把 track 字段丢弃，把 chat、workspace、skill 分别存进不同的数据库表结构中。那样会更干净一些。
:::
### what's entry?

Entry（`RecallEntry`）是旧 memorize 路径的核心中间产物——LLM 从源内容里**提取出来的原子事实**。

举个例子，一段对话：

```python
用户：我下周要去东京出差，帮我订周一的机票
助手：好的，已为您预订了周一飞东京的航班
```

LLM 会从中提取出多条 entry：

| memory_type | summary |
|---|---|
| `event` | 用户下周一去东京出差 |
| `behavior` | 用户倾向于让 AI 直接帮忙订票，不需要确认 |
| `profile` | 用户有出差需求，可能是商务人士 |

`memory_type` 一共有 6 种：`profile` , `event` , `knowledge` , `behavior` , `skill` , `tool`。每种类型有自己的提取 prompt，LLM 按类型分别跑一遍，各自提取属于该类型的条目。

提取出来的 entry 会被 embed，然后通过 `RecallFileEntry` 归类到对应的 `RecallFile`（主题文档）里。多条 entry 汇总到同一个 file，file 的 content 就是这些 entry 的综合摘要。

**workspace 路径为什么跳过了 entry？** 因为 workspace 的源文件（代码、文档、配置）不是对话，不适合按 memory_type 提取原子事实。workspace 路径直接让 LLM 把源内容 route + synthesize 到 RecallFile，省掉了中间的 entry 层。

## 三层记忆关系对应

### 数据模型映射

我们都知道三层记忆关系：**Resource → Category → Memory Item**。

对应到数据模型：

```python
Resource     = Resource        （原始素材，一个文件/一段对话）
Category     = RecallFile      （主题文档，如 "Profile"、"Goals"）
Memory Item  = 看走哪条路径 ↓
```

两条路径的 Memory Item 不一样：

| | 旧路径 memorize | 新路径 workspace |
|---|---|---|
| Memory Item | `RecallEntry`（LLM 提取的原子事实） | `RecallFileSegment`（文档的切片） |

:::note
ADR 0007 里管这三层叫 L0 / L1 / L2（L0 = Resource，L1 = Category，L2 = Memory Item）。含义一样，只是换了个编号。
:::

### 两条路径的顺序反转

旧路径有个**反直觉的地方**：pipeline 先产出 Memory Item（Entry），再合成 Category（File）。顺序是从细到粗：

```python
旧路径执行顺序：Resource → Entry(细) → File(粗)
```


> Q: 我会好奇，这个合成(旧路径 Entry -> Category)是直接拼接，还是说又调了一次 LLM?<br>
> A: 不是直接拼接，又调用了一次 LLM。


新路径则调转过来了：

```python
新路径执行顺序：Resource → File(粗) → Segment(细)
```


> Q: 我会好奇，调转后的提取细粒度，是否会收到影响？是否会因为把整理信息和提取信息放到一起导致提取信息能力不够？<br>
> A: 确实能力会下降，原先对每个 memory type 都做了独立的 entry 提取。相当于分 N 次，然后合成又调用一次。<br>
> **但这不一定是退步**，因为：<br>
> 1. workspace 的源文件（代码、文档）不像对话那样适合 "提取原子事实"——你怎么从一个 Python 文件里提取 standalone memory items？直接合成摘要文档再切反而更合理<br>
> 2. workspace retrieve 有 **segment → file roll-up**：即使单行命中不精确，只要 roll up 到了正确的 file，用户拿到的是完整文档，信息不丢 <br>
> 3. 旧路径的 entry 检索虽然精确，但 entry 是孤立的——你拿到一条 `"用户喜欢黑咖啡"` 没有上下文。新路径 roll up 到 file 后有完整的主题文档 <br>

### 方向之问：为什么 workspace 不适合"分总"？

但是更关键的似乎是：

**信息组织和信息检索的耦合方向反了。**

因为在无穷无尽的 chat memory 里，只需要抓住一点点碎片化的相关片段，就可以反推召回 resource 得到所有相关的信息，且信息是完整独立的。它是适合分总的方式的。

但是在 workspace 里，这种碎片 -> resource 的方式不那么好用了。因为能被碎片召回的也只是代码碎片，比如召回了一个 Data Model，实际上这个 Data Model 在哪里被引用还需要再次搜索，起不到召回所有相关信息的作用。反而召回很多垃圾信息——召回了很多定义，但是对使用处和架构联系毫无关系。

我们需要的是一个 Agent 和人类可读的高层文档。然后从这个文档里面去切出那些碎片。

所以 workspace 整体而言是适合总分的形式。也是我们的新路径。

但也正因为这种特殊性，我觉得应该刻意保持 chat 和 workspace 之间的路径差异化。

---

如果后续 chat 也变成"总分"的话。

似乎也能被接受，但是会有一些信息损失，换来巨大的速度提升和更低的 token 消耗。这个要看取舍了，虽然我真的很喜欢 LLM mode。

## what's different in ADR 0008

[ADR 0008](https://github.com/NevaMind-AI/memU/commit/ff90dac6976bc920667e03d295a75d5da8626f75)

### 输入来源变化 - 注意力聚焦点变化

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)

在 ADR 0007 里我们见过这图，它的要求是 chat/、skill/、workspace/(others) 作为三种来源。然后按照不同来源来走不同的路线。

但是它在设计上其实有个不舒服的点，就是这三个文件夹从哪里来？或者说，在对话进行中，这三个是否会经常改变？skill 肯定大多时候都是稳定的。 workspace 可以是整个项目工作区，而对于一个十万行的项目来说，一次二三十行的 modify，在整个项目面前而言太微不足道了。

这会导致一个问题，模型对于上下文的变化是迟钝的。或者说这三个来源一定程度上是不靠谱的，它难免让模型一直去注意一些无关紧要的事情，而且没有一个很好的约束方案。

ADR 0008 之后**输入来源再次变回了和智能体之间的对话和工具调用记录。并且它作为唯一的原始输入。**

但是 0007 的内核依然没有被抛弃，它把输入的对话数据由 LLM 提取成了不同的待处理的部分`。

分别是 `memory`、`project`、`skill`。

### 从大文件到 embedding 索引

原本定义中的 `MEMORY.md`、`INDEX.md`、`SKILL.md` 三个大文件被拆成文件夹式，L1 子文件 + ~~L2 索引文件。避免每次大文件重新构建要处理很多东西。~~

索引本身并不以文件形式存在磁盘上，它是一个 embedding 的索引，有点意思。好奇是怎么单纯用它作为索引的。是直接把 L1 embedding 存起来还是咋弄呢？

claude say，它不是简单地把 L1 文件转成 embedding，而是对 L1 切片后做 embedding 以及附带 metadata，比如来源文件，所在行数等等。

确实是很好的做法。

后续只要改对应的子文件然后更新索引就行。就是 embedding 比较难受的一点是删除时带来的 metadata 的索引行数变化，以及 embedding 自动删除，当子文件里对应的条目被删除的时候， L2 要如何自动感知并且也做出相同删除以及更新所有条目？

听上去很麻烦，但只是工程控制上的麻烦。但是可以避免这点麻烦，对于大模型来说不需要具体行数，它只需要 grep 一下就能定位了，所以最好的做法是不限定行数来避免数据库内全量的行更新。

不过一开始似乎就没有行引用，只是 claude 举例的。

### CLI 的简化

原本定义中的 `memorize-workspace` 和 `retrieve-workspace` 被移除了。

我比较关心的是，现在是否直接用 `hybrid search` 覆盖了原来的 `old-retrieve`？

以及我需要确定是不是每步 `on_turn` 的 `memorize` 都会先调用一个按照语义拆分对话到三条线的操作。这个也消耗不小呢，虽然异步感知不到。

### on_turn 频率的取舍

和 claude 讨论了一下，既然 `retrieve-workspace` 被移除了，那么 `hybrid search` 的设计就不得不落到了原先 `retrieve` 的设计上来了，也就是说 `old-retrieve` 会因为太重被直接覆盖。

但这也确实更舒服的架构，因为一开始 workspace 和 chat 分流的时候总觉得哪里的架构设计让我不舒服。

而，到底是每轮对话都进行三线拆分还是批量累积提交，这个还在讨论中，因为一方面确实会涉及会不会太重的缘故。而且它会直接影响到几轮跑一次 memU。对 mem0 来说，是每轮对话都跑一次，而对 memU 来说，这个几轮拆一次会直接影响到运行频率。可以交给用户来设定，如果我设计的话我会这么做。

而且主要是由于按照这个设计哲学，我想不到不先拆分三路能做啥。

另外，假设每轮都拆分三路，是不是至少要四个 LLM 调用呢？

claude say yes. 确实也不轻了。而且根据 claude 的分析，老的 memorize 一般不会 run every turn，只会累积一整个长会话后手动批量地进行。而现在 ADR 0008 引入 on_turn 的设计是比较希望可以直接自动触发。但是频率就是个问题了，如果轮轮触发，那么用户会发现自己对话消耗的 token 远没有记忆文件消耗得多。

刚刚突然想到，应该是可以来一个比较轻量的 LLM call 判断当前到上次 memorize 之间是否积攒了足够的消息，这样既可以不用固定死轮数，也可以自动触发。

claude 补充说可以用 count token 的方式来决定是否要 memorize。
