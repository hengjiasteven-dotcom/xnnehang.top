---
title: 当主流 Agent 框架无法适配需求时，我们造了什么
published: 2026-06-23
featured: true
category: 边写边学
tags:
  - Agent
  - LLM
  - 框架设计
  - 实时系统
description: 从 AI 陪伴引擎的实践经验出发，对比 LangChain、Dify、LangGraph、Coze 等主流 Agent 框架的局限性，记录我们为实时陪伴场景自建底层框架的核心设计思路与取舍。
image: ../../assets/img/agent-framework-exploration/hero-bg-1.png
---

> [!NOTE]
> **AI 协作声明：** 本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot)（AI 助手，基于 Claude Opus 4.6）共同撰写。Xnne 提供了技术实践、业务思考与核心设计决策，Korewaxnne 协助组织了全文结构与技术表述。

> 我们从 LangChain/Langgraph 到 Dify/n8n，从 OpenHands/Suna 到 Claude Code，了解过每一个主流 Agent 框架，但没有一个能完美适配我们的业务需求。后来我们发现，问题不在于"选哪个框架"，而在于：**当主流框架的抽象边界和你的业务需求对不齐时，你该怎么办？**

## 一个不太常见的 Agent 场景

大多数 Agent 框架的典型演示都长这样：用户提问，LLM 思考，调用工具，返回结果。一问一答，干净利落。

但我们的场景完全不同。我们在做一个 AI 陪伴引擎——角色扮演、VTuber 互动、游戏伴玩。这意味着 Agent 的一次完整对话轮次，远不是"调一下 LLM"这么简单。它涉及三个截然不同的阶段，每个阶段都有独特的技术需求：

**调用前**：不是用户说了话才响应。游戏伴玩场景中，一个 OCR 主动对话插件会持续轮询屏幕画面，当它检测到游戏内关键事件（比如角色死亡、任务完成、场景切换），会主动触发 LLM 发起对话，而不是等用户开口。这意味着框架必须支持"非用户触发的对话轮次"。

**调用中**：LLM 的流式输出不能简单地拼接成一个完整字符串再返回。每一个 token 都需要实时进入断句器，切成自然语句后立刻发送给 GPT-SoVITS / Qwen-TTS 引擎合成语音，同时提取情绪标签驱动 Live2D 模型表情变化。这是一个 token 级别的多路分发管线，延迟敏感度极高。在同一轮对话中，LLM 还可能调用多个工具（网页搜索、文件读写、截图分析），工具调用完成后继续流式生成。**工具调用的 token 也不会攒成完整 JSON 再解析——框架一边接收流式 token 一边解析出结构化的事件，和文本 token 在同一个流中并行下发。**

**调用后**：一轮对话结束，不是存到 SQLite 就完事了。对话内容会被发送到 Memory Bench 服务，经过 mem0 做记忆抽取和聚合，同时写入 Neo4j 知识图谱，形成结构化的长期记忆。下次对话开始前，这些记忆又会被检索出来注入上下文。

这三个阶段，就是我们框架的核心需求。接下来我们来看看，如果把主流框架套进来，会发生什么。

## 套用主流框架的困境

### Coze：低代码天花板

Coze（扣子）是字节跳动推出的 Agent 构建平台，2024 年开源了核心引擎 Coze Studio。它的设计目标很明确：让非技术用户也能通过可视化界面搭建 AI Bot，快速部署到微信、飞书、Discord 等平台。

Coze 的 Workflow 编辑器用拖拽节点的方式编排流程，配合内置的插件市场和知识库，确实能在几分钟内搭出一个能用的客服机器人或知识问答助手。这是它真正擅长的领域。

但套进我们的场景就会碰壁。首先，Coze 的 Workflow 有明确限制：不支持在工作流中包含流式输出的结束节点，这意味着我们没办法在 token 级别做断句和 TTS 分发。整个语音合成环节就断了。其次，Coze 的插件体系虽然支持第三方 API 接入，但它的生命周期是"请求—响应"模式，没有 `on_before_turn` / `on_after_turn` 这样的钩子。我们的 OCR 主动触发和调用后的记忆图谱化，在 Coze 的架构里找不到挂载点。最后，Coze 的开源社区版和商业版存在功能差异，声音定制等能力仅限商业版，而我们需要的是完全可控的 TTS 管线。

一句话总结：Coze 是给"对话机器人"设计的，不是给"陪伴型 Agent"设计的。

### Dify：工作流的表达力边界

Dify 是一个优秀的 LLMOps 平台，它的核心价值在于可视化工作流编排和一站式 RAG 管理。通过拖拽节点，你可以快速搭建一个带知识库检索、多模型切换、条件分支的 Agent 应用。Dify 的 Agent Node 甚至支持自定义策略插件（ReAct、CoT、ToT 等），并且通过 Plugin Trigger 机制可以订阅外部事件来触发工作流。

从表面上看，Dify 的 Plugin Trigger 似乎能解决我们"OCR 主动触发"的需求——订阅一个外部的 OCR 事件，触发工作流就好了。但问题出在下游。

Dify 的 Agent Node 执行遵循"初始化—迭代循环—最终响应"三阶段模型，每一轮迭代都是一个完整的 LLM 调用。它的输出是结构化的 JSON 响应，而不是我们需要的 token 流。虽然 Dify 的 Chat API 支持 SSE 流式返回，但这个流式是"节点级"的——你能看到一个节点执行完了返回结果，但无法拿到 LLM 生成过程中的逐 token 输出来做实时断句。

更关键的限制在记忆。Dify 的 Agent Node 使用 `TokenBufferMemory` 管理上下文，这是一个 token 窗口滑动策略。它适合控制成本，但我们需要的是外部知识图谱的语义检索——根据当前对话内容从 Neo4j 中召回相关记忆片段，然后注入到用户 prompt 的特定位置。这种"调用前检索、调用后图谱化"的双向记忆流，不在 Dify Agent Node 的设计范围内。

Dify 适合什么？适合企业级 RAG 应用、客服工作流、内容生成管线——这些场景对流式粒度不敏感，对记忆的需求是"窗口内召回"而非"跨会话图谱关联"。

### LangChain：抽象的代价

LangChain 是 Agent 框架领域的先行者，它最大的贡献是定义了"Chain"这个概念——把 Prompt、LLM、Output Parser、Tool 串成一条可组合的管道。在 2023-2024 年，这个抽象极大地降低了构建 LLM 应用的门槛。

LangChain 的核心优势在于它的组合性和生态。它有最丰富的 Integration（数百个第三方工具和向量数据库的官方适配），有成熟的 Document Loader / Text Splitter / Retriever 体系做 RAG，有 LangSmith 做 Tracing 和 Eval。如果你在做一个标准的"检索增强问答"或"文档分析"应用，LangChain 可能仍然是最快的起步选择。

但 LangChain 的问题恰恰也出在它的核心抽象上。

Chain 是线性的。一个标准的 LangChain Agent 执行流程是：接收输入 → 构造 Prompt → 调用 LLM → 解析输出 → 如果需要工具就执行 → 再调 LLM → 最终输出。这是一条单向管道。但我们的场景需要的是：在 LLM 生成的过程中，token 流要同时被多个消费者处理（断句器、情绪提取器、TTS 过滤器、前端显示处理器），而且工具调用会打断文本流、插入工具状态标签、执行完后再恢复流式生成。

这不是一条链，这是一个有环的、有分叉的、有中断恢复的流。

更具体地说，LangChain 的 `AgentExecutor`（已在 2025 年底被标记为废弃）在执行工具调用时，会阻塞整个链直到工具返回。你没有机会在工具执行期间向前端流式输出状态信息。而我们的 `AgentCore` 在遇到工具调用时，会先 yield 一个 `ToolCallEvent(status="running")` 结构化事件让前端立刻展示工具运行状态，然后并发执行所有工具调用，完成后 yield `ToolCallEvent(status="completed")` 并继续流式生成。整个过程中文本 token 和工具事件在同一个 `AsyncIterator` 中分型流出，前端各自消费。

LangChain 的记忆抽象（`ConversationBufferMemory`、`ConversationSummaryMemory` 等）也是为简单场景设计的。它假设记忆是"对话历史的某种压缩形式"，塞进 Prompt 就行。但我们的记忆是一个独立服务，有自己的搜索 API 和写入 API，需要在对话开始前异步检索、在对话结束后异步写入。LangChain 没有为这种"外部异步记忆服务"提供原生的生命周期钩子。

最后，LangChain 的抽象层数太多了。一个工具调用要经过 `Tool` → `ToolKit` → `AgentExecutor` → `OutputParser` 多层包装，调试时你经常要在 LangSmith 里追踪五六层嵌套的 Trace 才能定位问题。对于我们这种需要毫秒级优化的实时流式场景，每一层抽象都是额外的延迟和调试负担。

### LangGraph：最接近但仍然错位

LangGraph 是 LangChain 团队对自身线性架构局限的回应。它引入了有向图（`StateGraph`）来编排 Agent 工作流，支持循环、分支、条件边、人工审批等复杂控制流。自 2025 年 10 月 LangChain 和 LangGraph 同时达到 1.0 里程碑以来，LangChain 的 `create_react_agent()` 底层实际上已经运行在 LangGraph 引擎之上。

LangGraph 的几个设计确实值得学习。它的 State 概念——一个在图节点之间流转的共享状态对象——提供了比 LangChain Chain 更灵活的数据传递方式。Time-Travel Debugging 让你可以回溯到图执行的任意节点重放，这在调试复杂工作流时非常有用。Human-in-the-Loop 机制让你可以在图的任意边上插入人工审批。

但 LangGraph 的图模型和我们的需求之间，存在一个根本性的错位：粒度。

LangGraph 的节点（Node）粒度是"一次完整的操作"——调用一次 LLM、执行一次工具、做一次判断。节点之间通过边（Edge）传递 State。这个设计非常适合编排"先检索文档，再总结，再生成报告，人工确认后发送"这类多步工作流。

但我们的核心需求不在"步骤之间的编排"，而在"一次 LLM 调用内部的 token 级处理"。当 LLM 正在流式生成文本时，每个 token 需要经过 `sentence_divider → actions_extractor → tts_filter → display_processor` 四层装饰器管线处理。这不是"图的一个节点执行完了传给下一个节点"，这是"在一个节点内部，输出流被实时分叉和处理"。LangGraph 的 State Graph 描述不了这个粒度的行为。

此外，我们的 Hook 系统需要的是"对话轮次的生命周期钩子"，而不是"图执行的节点钩子"。`on_before_turn` 在整个图开始前执行记忆检索，`on_after_turn` 在图完成后执行记忆写入，`on_after_playback` 在前端播放完成后才触发（因为有些后处理需要等 TTS 播完）。这三个钩子跨越了 LLM 调用、工具执行、前端播放三个完全不同的时间尺度。LangGraph 的图是围绕"LLM + Tool"的执行流设计的，它没有"前端播放完成"这个概念。

LangGraph 还有一个实际问题：规模化时的性能。随着图的节点和边增加，执行变慢，内存占用上升，调试难度增大。而且它与 LangChain 生态的紧密耦合意味着，如果你想用更轻量的 LLM 客户端（比如直接用 `openai` SDK），你需要写大量胶水代码来适配。

### Harness Engineering：方向对了，但我们需要的不是控制平面

2026 年最热门的概念是 Harness Engineering——"模型提供原始智能，harness 让智能变得可用"。Gartner 预测 2026 年底 40% 的企业应用将包含 AI Agent，而 65% 的 Agent 项目失败源于 harness 层面的缺陷，而非模型推理能力不足。

Microsoft Agent Framework（MAF）在 2026 年 4 月达到 1.0 GA，统一了 AutoGen 和 Semantic Kernel，提供了 Shell 访问、人工审批流、跨会话上下文管理等生产级能力。行业也在围绕 MCP（Model Context Protocol，Agent 到 Tool 的垂直交互）和 A2A（Agent-to-Agent，水平委派）两个协议标准化。

Harness Engineering 强调的五层——工具编排、验证循环、上下文与记忆、护栏、可观测性——和我们的实践高度吻合。但这些框架的典型假设是"单轮请求-响应"或"多步工作流"模式，核心关注点是安全、合规、可观测。它们是为企业 SRE、客服自动化、代码生成这类场景设计的控制平面。

我们需要的不是控制平面，而是一个"让 Agent 能像人一样陪你的表现层"——实时语音、表情、主动对话、情感记忆。这些需求在任何一个 Harness Engineering 框架的 Roadmap 上都看不到。

## 所以我们造了什么

既然套不进去，我们就从业务需求倒推，造了自己的底层架构。不是又一个"通用 Agent 框架"，而是一个面向实时陪伴场景的 Agent 引擎。

核心设计有四个支柱：

### 生命周期钩子（Hook System）

我们定义了三个钩子点，覆盖对话轮次的完整生命周期：

```python
class HookPlugin(ABC):
    async def on_before_turn(self, user_text, ctx) -> str | None:
        """调用前：记忆检索、上下文注入"""
    async def on_after_turn(self, user_text, assistant_text, ctx) -> None:
        """调用后：记忆写入、图谱更新"""
    async def on_after_playback(self, user_text, assistant_text, ctx) -> None:
        """播放后：等 TTS 播完再执行的后处理"""
```

`MemoryPlugin` 就是一个典型实现：`on_before_turn` 中向 Memory Bench 服务发起语义搜索，召回相关记忆片段注入上下文；`on_after_turn` 中将本轮对话异步写入 mem0 做记忆抽取，同时更新 Neo4j 知识图谱。

`MoodChatPlugin` 实现了另一种模式：它不是被动响应，而是根据情绪评分主动调度对话——高兴的时候话多，低落的时候安静。游戏伴玩模式下还会结合 OCR 变化检测来决定是否主动说话。

关键设计决策：钩子返回值被拼接注入到 user prompt 的 `[memory context]` 标签块中，而不是 system prompt。这避免了把瞬时信息当成稳定事实的问题。

### 流式 Tool Calling Loop

`AgentCore.run_turn()` 实现了一个多轮流式工具调用循环，每轮上限 6 次迭代。返回值类型是 `AsyncIterator[str | ToolCallEvent]`——文本 token 以字符串形式流出，工具调用则以结构化事件的形式流出：

```python
max_rounds = 6  # 安全护栏，不是技术上限

for _ in range(max_rounds):
    text_buf = ""
    async for chunk in chat_llm.stream_with_tools(messages, tools=schema):
        if delta.content:
            text_buf += delta.content
            yield delta.content              # 文本 token 立刻流出
        if delta.tool_calls:
            accumulate(tool_calls_buf)       # 收集工具调用片段

    ordered_tool_calls = _ordered_complete_tool_calls(tool_calls_buf)
    if not _should_execute_tool_calls(finish_reason, ordered_tool_calls):
        break   # 没有需要执行的工具，正常结束

    # 工具执行前：发出 running 状态事件
    for tc in ordered_tool_calls:
        yield ToolCallEvent(
            tool_id=tc["id"],
            tool_name=tc["name"],
            args=tc["arguments"],
            status="running",
        )

    # 所有工具并发执行
    results = await asyncio.gather(
        *(_exec_tool(tc, tool_manager, ctx) for tc in ordered_tool_calls)
    )

    # 工具执行后：发出 completed / error 状态事件
    for tc_info, result in zip(ordered_tool_calls, results):
        yield ToolCallEvent(
            tool_id=tc_info["id"],
            tool_name=tc_info["name"],
            args=tc_info["arguments"],
            status="completed" if result.ok else "error",
            result=result_text,
        )

    # 工具结果追加回消息列表，下一轮继续让 LLM 基于结果生成
```

**6 轮上限是延迟与能力之间的一个经验取舍。** 语音场景对响应速度敏感，同时绝大多数正常对话在 1-2 轮工具调用后就能结束（搜索→读文件→回答），6 轮给了充足的余量又不会让用户感知到明显的等待。

两个设计细节值得强调。

第一，工具调用事件是以**结构化对象**而非文本标签流出的。`ToolCallEvent` 是一个 dataclass，包含 `tool_id`、`tool_name`、`args`、`status`、`result` 等字段。这意味着前端——以及管线中下游的每一层——都无需用正则解析文本标签来识别工具事件，直接做类型判断即可。工具状态也拆成了两阶段事件：执行前 `status="running"`，执行后 `status="completed"` 或 `"error"`，前端可以根据状态切换 UI 展示。

第二，同一轮的多个工具调用通过 `asyncio.gather()` 并发执行，不是串行等待。

### Token 级输出管线

从 `AgentCore` 流出的 `str | ToolCallEvent` 混合流，进入 `MemoryAgent` 的装饰器管线：

```python
@tts_filter(config)           # 过滤 TTS 不需要的内容（特殊符号等）
@display_processor(...)        # 处理前端显示的控制标签
@actions_extractor(live2d)     # 提取情绪/动作标签驱动 Live2D
@sentence_divider(...)         # 按自然语句切分，切出一句就立刻往下送
async def chat_with_memory(input_data):
    async for token in core.run_turn(...):
        yield token
```

每个装饰器层的处理逻辑中都做了一个关键判断：

```python
async for chunk in stream:
    if isinstance(chunk, (AudioOutput, ToolCallEvent)):
        yield chunk         # 结构化事件透明穿透
        continue
    # 否则是文本 token，做本层处理
```

`ToolCallEvent` 作为结构化事件在管线中**透明穿透**——断句器不会把它切碎，TTS 过滤器不会尝试合成它，显示处理器不会给它加标签。每一层遇到 `ToolCallEvent` 就原样 yield 出去。最终前端收到的流包含两种消息：处理好的句子（含显示文本、TTS 文本、动作标签），以及结构化的工具调用事件。这比早期版本里用 `<tool>[name]</tool>` 文本标签混入对话流的设计（现已移除）要干净得多。

`sentence_divider` 是管线中对延迟最敏感的一环：它拿到足够的 token 组成一个自然句子后立刻 yield，不等整段话生成完。这样 TTS 引擎可以在 LLM 还在生成后半段时就开始合成前半段的语音，用户感知到的首句延迟大幅降低。

### 四类插件体系

所有能力扩展都通过插件实现，我们定义了四种插件类型：

| 类型 | 职责 | 例子 |
|------|------|------|
| `tool` | 注册可调用工具 | `web_fetch`、`screen_shot`、`web_search_ddg` |
| `hook` | 生命周期钩子 | `memory`（记忆检索+持久化）、`mood_chat`（主动对话） |
| `policy` | 注入 prompt 规则 | `pre_tool_preview`（工具调用前预告）、`tool_call_integrity`（防幻觉工具调用） |
| `skill` | 注入行为指引 | `diary`（日记读写流程） |

每个插件用一个 `plugin.toml` 声明身份和默认配置：

```toml
[plugin]
id = "memory"
type = "hook"

[config]
base_url = "http://localhost:12393"
user_id = "xnne"
agent_id = "congyin"
search_limit = 10
```

Profile TOML 文件决定启用哪些插件、覆盖哪些配置：

```toml
[plugins]
enabled = ["web_search_ddg", "web_fetch", "memory", "diary"]

[plugins.memory]
agent_id = "baoqiao"     # 切换角色就换一个 agent_id
search_limit = 5
```

这意味着同一套代码，换一个 Profile 文件就能切换完全不同的 Agent 人格——不同的角色 Prompt、不同的输出格式、不同的启用插件、不同的记忆空间。两个角色共存于同一个 Neo4j 图中，通过 `agent_id` 隔离，互不干扰。

## 我们做了哪些取舍

任何框架设计都是取舍。诚实地讲，我们放弃了一些东西：

**放弃了 MCP**。我们早期用过 MCP 协议做工具调用，后来全部迁移到进程内的 `BuiltinTool`。原因很实际：MCP 是基于 JSON-RPC 的进程间通信，对于"读个文件""取个时间"这类高频操作，IPC 开销不值得。进程内调用的延迟是微秒级的，MCP 是毫秒级的。在实时语音场景里，这些毫秒攒起来就是明显的卡顿。

**放弃了独立的 Tool Model**。早期我们用一个专门的小模型做工具调用决策，chat 模型只管生成文本。后来发现主流模型的 native function calling 已经足够好了，额外维护一个 tool model 带来的复杂度远大于收益。PR #295 / #296 做了这个简化，移除了 `AgentToolLoop`、`AgentToolLoopRunner` 等一系列组件。

**放弃了通用性**。我们不打算让这个框架适配所有场景。它为实时陪伴场景做了大量定制——流式断句、TTS 管线、Live2D 驱动、情绪提取——这些在 RAG 问答或代码生成场景里完全用不上。这是一个有观点的框架，不是一个万能框架。

## 回到那个问题

一个好的底层 Agent 框架应该是怎样的？

我们的实践给出的回答是：**它应该从业务需求倒推，而不是从抽象概念正推**。

LangChain 的 Chain、LangGraph 的 StateGraph、Dify 的 Workflow Node——这些都是先有抽象概念，再让用户把需求塞进去。当你的需求恰好在抽象覆盖的范围内（线性问答、多步工作流、RAG 检索），它们非常高效。但一旦你的需求跨越了抽象的边界——需要 token 级的流式管线、需要跨越 LLM/Tool/Frontend 三个时间尺度的生命周期钩子、需要声明式的插件配置来切换整套 Agent 行为——这些框架就会从"加速器"变成"绊脚石"。

如果非要总结一个模式，我们的经验是：

1. **定义生命周期，而不是定义执行图**。调用前/调用中/调用后/播放后，每个阶段有明确的钩子点，插件自己决定挂在哪里。这比画一张执行图更灵活，因为真实业务的时间尺度往往超出 LLM 调用本身。

2. **流式优先，而不是请求-响应优先**。从 LLM 调用到工具状态反馈到 TTS 合成，所有环节都是 `AsyncIterator` 驱动的流。阻塞式设计在实时场景里是致命的。

3. **声明式配置，而不是代码编排**。一个 `plugin.toml` 声明插件身份，一个 `profile.toml` 声明场景配置。切换 Agent 行为是换一个文件，不是改一段代码。

4. **让插件彼此隔离，但声明依赖链**。插件之间不能互相 import，共享逻辑必须提升到框架层。但隔离不等于没有关系——有的插件确实需要其他插件作为前置，比如 `mood_chat` 依赖 `vision_boost`。我们区分**前置**与**后置**：A 是 B 的前置，则 B 是 A 的后置。要装后置插件，必须先装齐所有前置，且整个依赖链的解析和校验在配置层面完成，而不是运行时才报错。

这不是"我们比 LangChain/Dify 更好"的论述。它们在各自的目标场景里做得很好。这是一个关于"当主流框架的抽象边界与你的业务需求不对齐时，你应该怎么办"的实践记录。

答案是：别硬塞，造自己的。但造的时候，要想清楚你在做取舍，而不是在做发明。
