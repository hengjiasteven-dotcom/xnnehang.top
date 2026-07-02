---
title: 站在 C 端开发者的角度看 memU 的架构转向
published: 2026-07-02
category: 思考
tags:
  - memU
  - 架构
  - Agent
  - Memory
  - 产品思考
description: memU ADR0007 推翻了之前的 LLM mode，从 C 端产品开发者和情感陪伴场景聊我的看法
featured: true
image: ../../assets/img/memu-adr0007-ce-duan-perspective/cover.png
---
## 站在 C 端开发者的角度看 memU ADR0007

事情起因是昨天我在拆解 memU 代码 [[memU 是啥？我们来拆开看看]] 的过程中，发现 memU 刚出的 ADR0007 架构设计文档几乎把我拆解和理解的内容全推翻了 =-=。

然后我就停下来了。

以及我找 mentor 唠嗑了一下:

>我看了 ADR 0007，检索从 RAG/LLM 双模式统一到了 hybrid search（embedding + BM25）。我理解这样做的好处是检索路径不再调 LLM，速度和成本都会好很多。<br>
> 但我有个担心：原来 LLM mode 的排序是有推理能力的 — 比如能判断一条 item 虽然关键词不匹配但逻辑上和 query 相关。而且 LLM 本身在不断进化，检索能力可以跟着模型一起提升。换成 hybrid search 之后，这部分是不是就固化了？<br>
> 另外，后续有没有计划通过其他方式（比如 reranker）把 LLM 的推理能力补回到检索路径里？

表达了我其实很喜欢 LLM mode 的设计 =-=，我喜欢 LLM retrieve 但是它在新架构里被完全移除了。

后来他问我站在使用者视角上对这次架构变化的看法。

但我这个使用者又有点奇怪。准确来说我是 C 端开发者。是把 memU 这样的项目封装到自己项目里然后传递给没有开发背景的用户使用的。而且我自己也是自己的用户。我打 galgame 会挂着 XnneHangLab。

所以视角也会有点奇怪。
### agent-loop 能代替 LLM mode 吗？

前面提到把推理能力交给 agent-loop，让 agent 自己多次 query。但 agent 在长上下文下能力会衰减——我在 XnneHangLab 里做过类似的事，依靠 agent 自身能力做记忆检索和提取，长对话后 tool calling 执行率下降很多，tool 链长的 skill 触发率下降，最终不得不改成分步骤的多次 LLM call（拆分 tool call）。agent-loop 把多步骤合并为第一步的一个决策，这第一步的难度会不会太高？

#### 白箱子与失语性

很多 C 端用户希望记忆检索是白箱子——能看到 waifu 的记忆是怎么被唤醒的。老 memU 的 LLM mode 能给出完整推理链，但 ADR0007 之后，检索变成语义相似度排序和关键词匹配。语义相似度本身具有一种失语性：它只能给出"这两者相关"，无法给出"这两者关系是什么"。

这层黑箱也意味着后续优化只能通过 benchmark 判断，而不能通过推理路径来分析和改进。

### 为什么检索不区分 scene？

重构的冲突点在于：workspace 和 chat 是两种不同的输入和检索场景。如果都做 LLM mode + RAG mode，就得隔离维护 retrieve，维护成本太高。于是 ADR0007 统一为 hybrid search，只维护一条 retrieve。

架构上是整洁了。但架构整洁和功能体验往往对立——R 星的荒野大镖客 2 不仅胜在架构和精神内核，更胜在数不清的细节带来的沉浸感。ADR0007 一刀保证整洁性的同时，也一刀切掉了很多磨了很久的细节。

而这两条线原本就是不同的场景：写代码时 workspace 可以一直开着，角色扮演对话场景里 workspace 没有必要。它们为什么一定要用同一种检索方式？

> 但很多时候，作为一个框架层，也许 memU 确实应该考虑架构的整洁。把复杂功能留给 C 端产品开发（比如 Open-LLM-Vtuber, 比如 XnneHangLab）。

### 两条线，两个定位

chat 走陪伴路线【个性化】，workspace 走项目理解【工具化】。对 chat 来说，LLM mode 的推理链和可解释性是核心价值，应该保留。两条线各走各的，架构做好隔离就行。

这本质上是一个产品定位问题：memU 是只面向开发者的代码记忆工具，还是一个更通用的记忆项目？我觉得 memU 完全可以泛化——甚至未来具身智能产品落地后也能适配。为其他使用场景留下扩展空间，不需要直接实现。

### C 端用户视角

我在开发 XnneHangLab，用户群是没有开发背景的 C 端用户，连 deepseek 的 api 怎么买都需要教，至少 80% 都是这样。

memU 在 v1.0 以前，LLM mode 不需要 embedding 模型，开箱即用。v1.0 之后 embedding 成了必选项，门槛一下抬高了。C 端产品开发者面临两种选择：在用户宿主机跑 embedding（限制多平台），或把麻烦丢给用户。Open-LLM-VTuber 引入 mem0 后就把它设为可选项，让愿意折腾的人自己折腾。

我的用户群里，大多用 Only-LLM + skills，享受自己定制 skill 和提示词的过程，哪怕很多时候是负优化。真正愿意开 mem0 的可能只有 10%。

---

ADR0007 给这类用户带来了什么？他们不写代码，主要场景是对话，workspace 的福利吃不到。反而让记忆检索从可解释的推理链变成了一个分数排名——不再知道"为什么唤起了这条记忆"，失去了对检索过程的掌控。

速度体验上确实是变快了，这个是 ADR0007 带来的。

## 调转 Item 和 Category 对情景陪伴和 wiki-link 的影响

事情的起因在这里: https://github.com/NevaMind-AI/memU/issues/458

我提了个 wiki-link 来关联跨 Category 的 item 达成联想能力的 feature issue。

而我的 mentor 提到，他们正在考虑着把 category 和 item 进行一个调换。原本的事件流顺序是这样的：

```python
原始数据 → LLM 提取原子 item → item 归入 category → category summary 由 items 汇总生成
```

后来变成了

```python
原始数据 → LLM 直接更新各个 category 的文档 → 再从 category 内容切片出 item
```

好处是

1. 避免先提取item造成的信息损耗，直接用原始数据更新category更准确
2. 不再有item信息过期的问题，item始终反映最新memory结果

但trade-off可能是

1. item对具体事件类信息（user哪天做了什么）的追踪会变弱，因为category不会记帐一样记发生的事，那切片出的item自然也不会有

mentor 问，作为一个情感陪伴类 memory 使用者有什么看法。

---

调转 item 和 category 之后，同一个 category 每次更新，item 都会在语义上被重组，它就不稳定了，不再适合作为 link 挂载点。而且 category 的覆盖更新，让原本提到的矛盾链、因果链、演进链也变得很难实现。

这样承担 link 的角色只能落到 resource 上，而 resource 是未提炼的原始数据，一段对话里混着很多话题，resource↔resource 的边说不清是哪两个事实在关联，判断成本也高。所以调转之后，link 就没有合适的地方挂了。

好处确实存在：不仅信息完整度更高，而且几乎不再存在过期的 memory item，因为 item 每次由最新的 category 生成。但代价是记忆只保留了语义状态而丢失了情景关联——agent 只记得事实本身，失去了时间先后和因果关系，除非遍历 resource。

从情感陪伴场景来说，这个代价比较大。用户在意的不只是"agent 知道我喜欢猫"（语义状态），而是"我生病那晚猫陪我度过所以我喜欢猫"（具体事件）。状态式的 category 会把事件蒸馏成状态，共同经历就没有了。对工具型场景这无所谓，但对陪伴场景，这些事件本身就是"关系"的载体。

如果调转后还想保留 link，我觉得比较好的做法是新增一条基于时间线的 append-only 情景事件线：category/item 管语义状态（可覆盖更新），事件线管因果链、矛盾链（只追加、不改写）。这条事件线同时也补上了你们提到的"事件类信息追踪变弱"的 trade-off——这两个问题其实是同一个缺口。而且 CAUSED / SUPERSEDES 这类关系本质上就是事件与事件之间的关系，而不是调转后的 item 和 item——记忆与记忆之间的关系。代价是得维护更新两份记忆。
