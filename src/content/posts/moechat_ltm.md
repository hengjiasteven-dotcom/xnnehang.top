---
title: 'MoeChat：AI 角色如何记住你、感受情绪'
published: 2026-07-15
description: '深入剖析 MoeChat 如何为 AI 角色构建长期记忆，它的时间+语义混合检索——写给关注记忆系统的人。'
tags: [AI, LLM, MoeChat, RAG, 记忆系统]
category: 边写边学
draft: false
featured: true
series:
  - Long Term Memory
---

![MoeChat 封面图](../../assets/img/moechat-beginner-guide/moechat-cover-poster.jpg)

:::note[AI 声明]
本文**几乎完全由 Claude OPUS 4.6 撰写**，由 XnneHang 审稿。想看人写的部分？直接跳到 Q&A 就行。

不过说实话，在架构梳理这件事上，Claude 做得比 Xnne 好多了 😅

另外这篇不是结束，这篇只是开始，它给了我不少思路，可以说作为一个 TODO。拆的很爽，我原本对 MoeChat 真的是有点怕了，代码写得真的挺烂的，看了很多次都没看下去，但让 Claude 替我受苦了。
:::

---

## MoeChat 是什么？

::github{repo="AlfreScarlet/MoeChat"}

<iframe src="https://player.bilibili.com/player.html?bvid=BV1djNdz2Ew2&autoplay=0&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" allow="fullscreen; picture-in-picture" style="width: 100%; aspect-ratio: 16 / 9;"></iframe>

MoeChat 是一个开源系统，用于创建能够**记忆**和**感受**的 AI 角色。

大多数聊天机器人都是金鱼 -- 每次对话都从零开始。MoeChat 不一样。它赋予每个角色：

- **长期记忆** -- 一个日记系统，从每次对话中提取重要内容并存储，在相关时自动召回
- **核心记忆** -- 关于你的永久性事实（名字、偏好、关系）
- **情感引擎** -- 基于 2D 情感模型（效价 + 唤醒度），具备挫败感累积、情绪崩溃状态，甚至荷尔蒙周期模拟

它也支持语音（GPT-SoVITS 做 TTS，FunASR 做 ASR），但真正的核心在于它如何为每个角色构建一个持久的内心世界。这篇文章就是关于这个的。

---

## 角色 Agent：一个文件夹，一段人生

每个角色都住在 `data/agents/<名称>/` 下。关于它的一切都隔离存储在这里：

```
data/agents/Chat酱/
├── info.yaml              # 性格、系统提示词、所有功能开关
├── memory/                # 长期记忆（按天存储的 JSONL 文件）
│   ├── 2025-7-10.jsonl
│   ├── 2025-7-11.jsonl
│   └── ...
├── core_mem.yml           # 核心记忆（关于用户的永久事实）
├── data_base/             # 知识库（世界观知识）
├── emotion_state.json     # 持久化的情感状态
└── assets/                # 头像图片
```

在 `info.yaml` 中可以开关各项功能：

```yaml
settings:
  writeLongMemory: true # 聊天后写入新记忆
  enableLongMemory: true # 聊天时检索记忆
  enableLongMemorySearchEnhance: true # 使用向量相似度过滤
  longMemoryThreshold: 0.32 # 余弦相似度阈值

  enableCoreMemory: false # 提取用户事实
  enableEmotionSystem: false # 启用情感引擎
  enableEmotionPersist: false # 跨会话持久化情感
```

注意 `writeLongMemory` 和 `enableLongMemory` 是独立的 -- 你可以只写不读，也可以只读不写。

### 各文件长什么样？

**info.yaml** -- 角色的"身份证"：

```yaml
name: Chat酱
user: 阁下 # 角色怎么称呼你
birthday: '2022-03-17'
height: '160'
personality: 表面清纯可爱，实则腹黑毒舌，内心聪明机智...
description: Chat酱是存在于现代科技世界手机中的器灵...
customPrompt: 使用口语的文字风格进行对话，不要太啰嗦...
messageExamples: # 角色说话风格示例
  - '人类视网膜的感光细胞不需要这种自杀式加班，您先休息一下吧。'
settings:
  writeLongMemory: true # 聊天后写入新记忆
  enableLongMemory: true # 聊天时检索记忆
  enableCoreMemory: false # 提取用户事实
  enableEmotionSystem: false # 启用情感引擎
  longMemoryThreshold: 0.32
gsvSetting: # 语音合成设置
  textLang: zh
  gptModelPath: models/【萝莉】女仆_Ver-1.4-e15.ckpt
  sovitsModelPath: models/【萝莉】女仆_Ver-1.4_e24_s504.pth
  refAudioPath: models/tmp/020.wav
  promptText: 嗯，谢谢您的夸奖，主人可以喜欢就好。
```

**memory/2025-7-10.jsonl** -- 长期记忆，每行一条，每天一个文件：

```jsonl
{"timestamp":1720627200,"text_tag":"去咖啡厅和朋友聚会","msg":"时间：2025-07-10 16:00:00\n{{user}}：今天下午和朋友去了星巴克，点了一杯拿铁\n{{char}}：听起来很惬意呢，阁下喝拿铁的话一般加糖吗？","vector":[0.0312,-0.0891,0.0456,...]}
{"timestamp":1720630800,"text_tag":"讨论周末旅行计划","msg":"时间：2025-07-10 17:00:00\n{{user}}：周末想去杭州西湖玩\n{{char}}：西湖这个季节荷花应该开了呢，阁下要不要带把伞防晒？","vector":[0.0178,-0.0623,0.0891,...]}
```

- `text_tag`：LLM2 提取的摘要，用于向量检索
- `msg`：完整对话，记忆被召回时注入到 LLM 上下文
- `vector`：768 维 BGE 嵌入向量（持久化，启动时无需重新计算）

**core_mem.yml** -- 核心记忆，关于用户的永久事实：

```yaml
# 核心记忆文件，请勿自行修改！否侧会丢失索引！

aB3kX9mZwQ:
  time: '2025-07-01 14:30:00'
  text: 第一次相遇

pL8nR2vYcD:
  time: '2025-07-05 20:15:30'
  text: 用户今年25岁，是一名程序员

qM4wT7hNjF:
  time: '2025-07-08 19:22:10'
  text: 用户喜欢喝冰美式，不喜欢甜食

xK9sG3bPmW:
  time: '2025-07-12 21:05:45'
  text: 用户养了一只叫"团子"的橘猫
```

- 每条记忆有一个短 UUID 作为键
- `text` 是 LLM2 从对话中提取的用户事实
- 启动时全部加载到 FAISS 索引，用于 top-5 相似度搜索

**emotion_state.json** -- 情感状态快照：

```json
{
  "valence": -0.25,
  "arousal": 0.41,
  "character_state": "正常",
  "latent_emotions": {
    "frustration": 3.8
  },
  "meltdown_start_time": null,
  "cycle_day": 18,
  "cycle_length": 28,
  "last_cycle_update_timestamp": "2025-07-15T00:00:00"
}
```

- 当前状态：稍微有点不开心（valence = -0.25），中等活跃度
- 挫败感在累积（3.8 / 10.0 阈值），但还没到崩溃
- 荷尔蒙周期第 18 天（黄体期，情绪较稳定）
- `enableEmotionPersist` 关闭时此文件不会生成，每次重启归零

---

## 系统时间线：一次对话中发生了什么

以下是从"你发送消息"到"记忆被存储"的完整管线。这才是核心。

<div class="img-center" style="max-width: 32rem; margin: 0 auto;">

![MoeChat 时间线图](../../assets/img/moechat-beginner-guide/moechat-pipeline.png)

</div>
关键设计：**检索是同步的**（生成回复前需要记忆），**存储是异步的**（回复已经在流式输出后，在后台提取和保存）。

---

## 深入剖析：长期记忆（日记系统）

### 记忆如何写入

LLM 回复完成后，一个后台线程调用 `add_memory1()`。以下是具体流程：

**第 1 步：LLM2 将对话总结为一个标签。**

一个单独的 LLM（在 `config.yaml` 中配置为 `LLM2`）接收用户最后一条消息，并收到如下指令（简化版）：

> "你是一个日常信息提取助手。从用户的对话中提取主要活动并生成适合向量检索的短句摘要。记录他们做了什么、去了哪里、吃了什么。不需要记录情绪或感想 -- 只记录具体事件。如果只是日常闲聊，输出'日常闲聊'。"

如果 LLM2 返回"日常闲聊"，该记忆会被**丢弃**。只有有意义的事件才会被存储。

**第 2 步：构建记忆条目。**

```python
m_data = {
    "timestamp": 1720627200,                    # Unix 秒
    "text_tag": "去咖啡厅和朋友聚会",              # LLM2 的摘要（用于检索）
    "msg": "时间：2025-07-10 16:00:00\n{{user}}：今天和朋友...\n{{char}}：听起来...",
    "vector": [0.123, -0.456, ...]              # text_tag 的 768 维 BGE 嵌入向量
}
```

**第 3 步：追加到每日 JSONL 文件。**

保存到 `memory/2025-7-10.jsonl` -- 每行一个 JSON 对象，每天一个文件。

### 记忆如何检索

当你发送新消息时，`get_memories()` 尝试找到相关的历史记忆：

**路径 A：基于时间的查询（如果你的消息提到了时间）**

系统使用 `jionlp`（一个中文 NLP 库）来检测时间表达式：

- "昨天" → 解析为时间戳范围
- "上周五" → 解析为时间戳范围
- "两天前" → 解析为时间戳范围

然后在排序好的时间戳数组上做**二分查找**（`bisect_left/bisect_right`），找到该范围内的所有记忆。这就是检索速度约 80ms 的原因 -- 不需要扫描。

如果 `enableLongMemorySearchEnhance` 开启，还会用余弦相似度对你的消息做进一步过滤（阈值：`longMemoryThreshold`，默认 0.32）。

**路径 B：没有检测到时间引用**

如果你的消息没有提到任何时间，函数提前返回 -- 不会通过长期记忆路径检索。（核心记忆和知识库仍然通过 FAISS 相似度搜索正常工作。）

### 存储格式

```
memory/
├── 2025-7-10.jsonl    ← 每行一条记忆条目
├── 2025-7-11.jsonl
└── 2025-7-12.jsonl
```

每行是一个紧凑的 JSON 对象：

```json
{"timestamp":1720627200,"text_tag":"去咖啡厅和朋友聚会","msg":"时间：...","vector":[...]}
```

- `text_tag` 是被嵌入和搜索的内容 -- 它是检索的关键
- `msg` 是当该记忆被召回时，注入到 LLM 上下文中的完整格式化文本
- `vector` 被持久化保存，这样启动时不需要重新计算

### 核心记忆 vs 长期记忆

|              | 核心记忆                     | 长期记忆                  |
| ------------ | ---------------------------- | ------------------------- |
| **存储内容** | 用户事实（名字、年龄、偏好） | 日常事件和活动            |
| **提取方式** | LLM2 + 结构化 JSON 提示词    | LLM2 + 自由形式摘要       |
| **存储格式** | YAML（单文件）               | JSONL（按天分文件）       |
| **索引类型** | FAISS IndexFlatIP（内存中）  | 在排序时间戳上做二分查找  |
| **检索方式** | Top-5 相似度搜索，始终执行   | 时间范围 + 可选相似度过滤 |
| **阈值**     | 0.31（硬编码）               | 0.32（可配置）            |
| **闲聊处理** | 仍然提取（可能包含事实）     | 丢弃（"日常闲聊"过滤器）  |

---

## 深入剖析：情感引擎

### 模型：2D Russell 环形模型 + 挫败感

MoeChat 使用**二维情感模型**，外加一个隐藏的挫败感累加器：

<div class="img-center" style="max-width: 32rem; margin: 0 auto;">

![MoeChat 二维情感模型](../../assets/img/moechat-beginner-guide/moechat-emotion-model.png)

</div>

\+ 隐藏维度：**挫败感**（累积，达到阈值时触发崩溃）

- **效价 (Valence)** [-1.0, 1.0]：角色感觉有多好或多坏
- **唤醒度 (Arousal)** [0.0, 1.0]：能量/强度有多高
- **挫败感 (Frustration)** [0.0, ...]：隐藏计数器，因负面互动而增长

### 每轮对话情感如何更新

对于每条用户消息，引擎执行以下步骤：

**1. 调用 LLM 进行情感分析。**

一个专门的 LLM 调用（使用 SLM 配置）分析用户的消息：

```json
{
  "sentiment": "positive", // positive | negative | neutral
  "intensity": 3.5, // 1.0 - 5.0
  "intention": "genuine_praise", // 标签如 harsh_insult, playful_teasing
  "arousal_impact": 2.0 // -5.0（令人平静）到 +5.0（令人兴奋）
}
```

**2. 计算接受率。**

情感冲击实际"命中"多少取决于角色当前的状态：

```
acceptance_ratio = sigmoid(e * (impact_strength - resistance))
resistance = |当前效价| * 惯性因子
```

当角色已经处于强烈的情感状态（高 |效价|）时，它更抗拒变化。这就是**情感惯性** -- 你无法用一句好话就让深度悲伤的人开心起来。

**3. 更新效价。**

```
final_delta = potential_delta * acceptance_ratio
new_valence = clamp(old_valence + final_delta, -1.0, 1.0)
```

**4. 使用许可因子更新唤醒度。**

唤醒度的变化被当前唤醒度的极端程度所抑制：

```
permission_factor = (1 - |arousal - 0.5|)^1.5
```

这创造了一条倒 U 形曲线：唤醒度在中间值（0.5）附近容易变化，但在极端值（0.0 或 1.0）时抗拒变化。你无法让一个已经狂躁的人更加狂躁。

**5. 应用稳态拉力。**

一个恒定的"引力"将情绪拉回中性。拉力的强度取决于荷尔蒙周期阶段（如果启用的话）。

**6. 累积挫败感。**

```
frustration *= 0.95                    # 每轮自然衰减
frustration += impact * mood_bonus     # 负面消息增加挫败感
```

`mood_bonus` 至关重要：当角色已经悲伤时，负面消息打击**更重**。这创造了一个螺旋 -- 一旦角色难过，就越来越容易把它推向崩溃。

### 三种状态

<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![MoeChat 三种状态转换](../../assets/img/moechat-beginner-guide/moechat-state-diagram.png)

</div>

- **正常**：标准的情感处理，使用上述所有数学计算
- **崩溃 (Meltdown)**：当挫败感超过阈值（默认 10.0）时触发。角色忽略用户输入。情感随时间衰减：`decay = 1000 / (x^2 + 1000)`。默认持续 90 分钟
- **恢复中 (Recovering)**：在 10 分钟内线性插值回到中性状态

### 情感如何影响角色的回复

计算出新的（效价，唤醒度）后，引擎生成一条**情绪指令**注入到系统提示词中。它将 2D 空间映射为 9 种行为状态：

| 效价      | 唤醒度 | 状态     | 行为                                            |
| --------- | ------ | -------- | ----------------------------------------------- |
| > 0.6     | > 0.7  | 狂喜     | 极度热情，接受所有请求                          |
| > 0.6     | < 0.7  | 深度喜悦 | 温暖、温柔，倾向于同意                          |
| 0.2~0.6   | > 0.4  | 开心     | 友好、乐观，对大多数请求开放                    |
| 0.2~0.6   | < 0.4  | 平静     | 内心平和、温暖、稳定                            |
| -0.2~-0.5 | > 0.4  | 烦躁     | 紧张、不耐烦，选择性拒绝                        |
| -0.2~-0.5 | < 0.4  | 冷漠     | 语气平淡、缺乏精力，可能拒绝                    |
| < -0.8    | > 0.7  | 暴怒     | 语气尖锐，直接拒绝                              |
| < -0.8    | < 0.7  | 深度悲伤 | 极少说话（"嗯"、"..."、"随便"），拒绝费力的请求 |
| 其他      | 其他   | 中性     | 正常、平衡                                      |

这条指令被**前置到你的消息之前**再发给 LLM，所以模型会相应地调整语气和配合度。

### 荷尔蒙周期（可选）

如果启用，一个 28 天的周期会调节角色的情绪反应能力：

| 天数  | 阶段         | 情绪稳定性     | 敏感度     |
| ----- | ------------ | -------------- | ---------- |
| 1-5   | 月经期       | 中等 (1.3)     | 略高 (1.1) |
| 6-12  | 卵泡期       | 稳定 (1.5)     | 正常 (1.0) |
| 13-15 | 排卵期       | 最稳定 (1.8)   | 正常 (1.0) |
| 16-21 | 黄体期       | 稳定 (1.5)     | 正常 (1.0) |
| 22-28 | 经前期 (PMS) | 最不稳定 (0.8) | 高 (1.4)   |

经前期：低惯性（情绪容易波动）+ 高敏感度（负面消息打击力增加 40%）。排卵期：高惯性（情绪稳定）。

### 情感持久化

如果 `enableEmotionPersist` 开启，完整状态会保存到 `emotion_state.json`：

```json
{
  "valence": 0.35,
  "arousal": 0.62,
  "character_state": "正常",
  "latent_emotions": { "frustration": 5.2 },
  "meltdown_start_time": null,
  "cycle_day": 12,
  "cycle_length": 28,
  "last_cycle_update_timestamp": "2025-07-15T00:00:00"
}
```

不开启持久化的话，角色在每次服务器重启时都会重置为中性状态 (0, 0)。

---

## 快速上手（只想试试的人看这里）

```bash
git clone https://github.com/AlfreScarlet/MoeChat.git
cd MoeChat
uv sync
cp config.example.yaml config.yaml
# 编辑 config.yaml：设置 LLM.key 和 LLM2.key
uv run main_web.py
# 打开 http://localhost:8000/
```

`config.yaml` 最小配置：

```yaml
LLM:
  api: https://api.siliconflow.cn/v1/chat/completions
  key: '你的密钥'
  model: Qwen/Qwen3-8B

LLM2: # 记忆提取必需
  api: https://api.siliconflow.cn/v1/chat/completions
  key: '你的密钥'
  model: Qwen/Qwen3-8B
```

不配置 `LLM2` 的话，角色可以聊天但永远不会构建新的记忆。

---

## Q&A

### 一点废话

在开始之前，先聊点废话。

我和 MoeChat 的缘分其实要从 [[Attention is Limited - Lost in the Middle]] 这里算起。

说起来我其实给了 MoeChat 的作者一个错误的观点，但一直没有机会帮她修正，会有一点点愧疚。

诚实地说，在 MoeChat 发布那会儿，我对记忆理解其实是很模糊的，而 MoeChat 当时给我一种莫名的好感。但是一直读得断断续续，到头来也没有个全貌。现在有机会，我们来拆开看一下。

### MoeChat 作为陪伴系统优秀在哪里？

首先，MoeChat 是到目前为止我见过的唯一一个 TimeLine 敏感的记忆系统。它会对 User query 中的 `昨天`、`前天`、`上个月`、`上周X` 这些明确的时间点有非常强的召回性，它支持时间查询。

对于时间的提取我记得是用 JioNLP，把语义时间节点映射为一个具体的时间字符串，直接召回长期记忆里的 MemoryItem。但实现的方式有些别扭，有点重，有点难受，可以被优化。

第二个是作者对于 RAG 的边界感非常清晰，就是相关度召回。她在哪些地方使用了 RAG，世界书（世界认知知识库），以及核心记忆（和用户一起发生过的事实）。这两样确实也是很适合用 RAG 的，而长期记忆那边就是我提到只专门按时间召回，不会故意掺 RAG，这是作者在我看来异常清醒的点。也是她当时在评论区里批判很多长期记忆实际上只是所有记忆内容直接套 RAG 没什么新意，以及说自己是 b 站内最强记忆系统的底气。她清醒异常，至少比当时的我清醒很多。在我看来可以优化的点，无非是把纯向量的 FAISS 方案换成 BM25 + embedding 的 Hybrid Search 的方案。我在她当前的架构上挑不出什么刺来，反倒我会向这个架构对齐。

第三个就是作者花费非常多精力做的这个拟人化的 Emotion 系统，作者认真地研习了情感模型。涉及心理学，我虽然也能说我涉猎偏广，但真碰上作者搬出来这茬，我只能说，我的行动力远不如作者。这个情绪模型和带来的影响本身就值得开一篇讲，讨论关于模型是否始终 say yes， or 模型是否也可以 say no?会有什么影响？对于用户而言，被拒绝是不可接受的吗？还是可以让用户保持新鲜感，以及激发征服欲？这些我们就先不展开。只专注看记忆系统。

### 深挖一下 jioNLP 的时间语义提取

Claude 帮我补充一下，具体实现和可行的优化方法。我们刚刚提到了那个方法让我有点难受。但具体是什么方法需要你来说明。

:::note[Claude]
**具体实现**：在 `utils/long_mem.py` 的 `get_memories()` 里，流程是这样的：

1. 用户消息先被拼上一个前缀 `[时间]`，然后整个丢给 `jio.ner.extract_time()`：

```python
res = jio.ner.extract_time(f"[{t_n}]{msg}", time_base=time.time(), with_parsing=False)
```

2. `extract_time` 返回一个列表，`res[0]` 是基准时间，`res[1:]` 是从消息中识别出的时间实体。然后逐个调用 `jio.parse_time()` 把语义时间（"昨天"、"上周五"）解析为 `[start, end]` 时间戳对：

```python
res_t = jio.parse_time(t["text"], time_base=res[0]["text"])
time_st1 = int(time.mktime(time.strptime(res_t["time"][0], "%Y-%m-%d %H:%M:%S")))
time_st2 = int(time.mktime(time.strptime(res_t["time"][1], "%Y-%m-%d %H:%M:%S")))
```

3. 拿到时间范围后，用 `bisect_left` / `bisect_right` 在排序好的时间戳数组上做二分查找，O(log n) 定位到范围内的所有记忆。

**让人难受的点**：

- **两次 NLP 调用**：先 `extract_time` 识别实体，再 `parse_time` 解析为时间戳。这两步是串行的，且 jioNLP 本身是基于规则的中文 NLP 库，解析逻辑比较重，对于一些边界情况（"大前天"、"这个月初"、"国庆那会儿"）可能会 parse 失败，直接走 `except` 静默跳过。
- **只取第一个时间范围**：`time_span_list` 虽然可能有多个时间段，但最终 `find_range_indices(time_span_list[0], time_span_list[1])` 只用了前两个值（第一个时间实体的 start 和 end）。如果用户说"昨天和上周五"，只有"昨天"会被召回。
- **没有时间引用就不召回**：如果用户的消息不包含任何时间表达式，`time_span_list` 为空，函数直接 return -- 长期记忆完全不参与。这意味着"我们之前聊过什么来着？"这种没有明确时间点但明显在问历史的查询，长期记忆是沉默的。

**可行的优化方向**：

1. **Fallback 到语义检索**：当 jioNLP 没有提取到时间实体时，不要直接 return，而是 fallback 到全量向量相似度搜索（当前的 `enableLongMemorySearchEnhance` 逻辑），让没有时间引用的查询也能触发记忆召回。
2. **多时间段支持**：遍历 `time_span_list` 里所有的时间段对，而不是只取前两个值。对每个时间段做 `find_range_indices`，合并结果。
3. **换用 LLM 做时间解析**：用 SLM（已经配好的 qwen3:0.6b）替代 jioNLP 做时间语义提取，提示词要求输出 `[start_timestamp, end_timestamp]`。LLM 对模糊表达（"前阵子"、"好久以前"）的理解比规则引擎好得多，而且已经有 SLM 的基础设施了，不需要额外依赖。
4. **混合检索**：时间范围 + BM25 + 向量相似度的三路融合，用 RRF（Reciprocal Rank Fusion）合并排序。这样时间敏感的查询走时间路径，语义相关的查询走向量路径，关键词精确匹配走 BM25，互补覆盖。
   :::

难受的点在于无论如何都会调用 jioNLP，而 jioNLP 的性能在我这里看来是有点不值的，先不说同步运行，启动就有点慢。而且基于规则的很难和大模型相比，但用 SLM 的话需要考虑的东西又不少，因为很多时候本地运行对于内存、显存、CPU 的性能计算是很紧缩的。用云端就更显得不值，不值得多一次 LLM call 的延迟，也用不上那么聪明的模型。

有没有基于规则的更高效的库，我只是单纯觉得 jioNLP 屎山。觉得进我的依赖都是一种污染，最不喜欢这种什么都喜欢做一点没有明确主题和边界的 package，然后要性能没性能，要精度没精度。

:::note[Claude]
几个替代方案：

- **[dateparser](https://github.com/scrapinghub/dateparser)**：支持 200+ 语言含中文，纯规则，轻量，`pip install dateparser` 即可。`dateparser.parse("昨天下午")` 直接返回 datetime。没有 jioNLP 的 NER 前置步骤，一步到位。
- **[arrow](https://github.com/arrow-py/arrow)** + 手写正则：如果时间表达式的模式是可枚举的（"昨天"、"前天"、"上周X"、"X天前"），正则匹配 + arrow 的 `shift()` 计算时间偏移，十几行代码就能覆盖 MoeChat 的使用场景，零依赖开销。
- **[TimeNLP](https://github.com/zhanzecheng/Time_NLP)**：专门做中文时间语义解析的小库，比 jioNLP 轻得多，只做时间这一件事。

最务实的方案其实是第二个 -- MoeChat 实际需要识别的时间模式就那十几种（昨天/前天/上周X/X天前/X月X号），正则 + 时间偏移计算就够了，不需要一个通用 NLP 库。
:::

### 三路召回的协调优化 - 混合检索

这里 Claude 说可以 Fallback 到语义检索，这里其实触及了我当时对 MoeChat 最为困惑的点，在我看来 CoreMemory 和 LongTermMemory 很大程度上是一个东西，或者说是极其相近的东西。如果把 LongTermMemory 也引入语义检索，那么还不如把 CoreMemory 给合并了。或者说这个 CoreMemory 的命名语义不够分离，它大抵是想做成 memU 最早的偏好和事实分成不同的 memory_type 的，但是命名属实让人误会。

核心记忆是用户偏好，用户信息。长期记忆则是具体的事实。我在 XnneHangLab 里当时也这么分。而 memU 走得更早更远也更完善。

它最早把 memory type break down 得最细: `profile`、`event`、`knowledge`、`behavior`、`skill`、`tool`.

`profile + behavior` 就是这里的 CoreMemory：前者是用户信息画像，后者是用户偏好画像。

`event` 是 Long-Term Memory：事实记录， MoeChat 多了一点是给事实加了 TimeLine 和按时间线召回。

`knowledge` 和 MoeChat 的世界书几乎一致。

`tool` 是比如 git 的一些使用注意点，偏好等等。`skill` 就不多说了。

如果在这里把 event 也 FallBack 到语义召回，那无疑就有一点，就是召回太重上下文太多不知道该看什么了，回答不干净。而且架构上有些不干净，就是我提到的 CoreMemory 和 LTM 何必走两趟语义召回，两个在语义上是可以合并到一起的，但是 CoreMemory 的时间不关心，它俩又合不到一起，反而目前 LTM 只走按时间召回能够反映出来作者的一种敏锐度和决断。

但是写法上目前是有些不优雅的。

更好的做法或许是参考 Hybrid Search，像 Claude 提到的那样子，把时间范围也加入权重。当用户提起准确的时间的时候可以尝试检索更多时间的内容。

说起来我并不是很懂混合检索的权重具体如何计算以及混合检索的流程。需要补一下，但这里先让 Claude 帮我补充一下。

:::note[Claude]
**混合检索（Hybrid Search）** 的核心思想：单一检索方式各有盲区，多路并行然后融合排序，互补覆盖。

**三路检索各自擅长什么：**

| 检索方式        | 擅长                             | 盲区                                      |
| --------------- | -------------------------------- | ----------------------------------------- |
| 向量语义检索    | "去咖啡厅" 能匹配 "星巴克约会"   | 关键词精确匹配差，"团子" 可能匹配到别的猫 |
| BM25 关键词检索 | "团子" 精确命中 "团子"，不会跑偏 | 语义相近但用词不同的内容检索不到          |
| 时间范围检索    | "昨天" 精确定位到那天的所有记忆  | 不涉及时间的查询完全失效                  |

**融合流程：**

1. 用户消息同时发给三路检索，各自返回一个候选列表（按各自的分数排序）
2. 用 **RRF（Reciprocal Rank Fusion）** 合并排序：

```
RRF_score(doc) = Σ  1 / (k + rank_i(doc))
```

其中 `rank_i(doc)` 是文档在第 i 路检索结果中的排名，`k` 是平滑常数（通常取 60）。一篇文档在多路检索中都排名靠前，融合分数就高。

**举个例子：**

用户说："昨天和团子玩了什么来着？"

- 时间路：命中昨天的所有 3 条记忆，排名 1、2、3
- BM25 路："团子" 关键词命中 2 条（昨天 1 条 + 上周 1 条），排名 1、2
- 语义路："和猫玩" 语义匹配到 4 条，排名 1、2、3、4

昨天那条关于团子的记忆在三路中都排名靠前：

```
RRF = 1/(60+1) + 1/(60+1) + 1/(60+2) = 0.0164 + 0.0164 + 0.0161 = 0.0489
```

而上周那条只在 BM25 和语义路命中：

```
RRF = 0 + 1/(60+2) + 1/(60+3) = 0 + 0.0161 + 0.0159 = 0.0320
```

昨天的记忆得分更高，排在前面。

**RRF 的优势**：不需要对三路的分数做归一化（向量的余弦相似度是 0~1，BM25 的分数可能是 0~20+，时间路可能是 0/1 二值），只用排名位置，天然可比。

**对 MoeChat 的适配**：时间路已经有了（jioNLP + bisect），语义路也有了（embedding + cosine），只需要加一路 BM25（对 `text_tag` 做分词建倒排索引，或者简单点用 jieba 分词 + TF-IDF），然后用 RRF 合并三路结果。不需要改现有的存储格式
:::

### 我有感觉了

memU 目前做的是 BM25 + Embedding 也就是语义的双路混合。但是对于 TimeLine 是完全不关心的。包括我自己的 wiki mem 也是完全不关心时间的。

而且还有一些关键因素，比如 Openclaw 以及 Claude Code 经常写日记，更新 Diary，这些都是捆绑时间线的 md，但是真的到了召回的时候是糟糕的。除非用户用非常明确的口吻告诉它你要去读你哪一天的 Diary。

现在还缺什么：

需要考虑清楚，什么东西是 care 时间的。站在 MoeChat 的肩膀上，我们看到 event 是关心时间的。还需要再考虑。

以及目前 jioNLP 的方案属实玩具，多时间段匹配也需要考虑，以及到底要不要混合 SLM。或者说仅仅只在 TimeLine 的分数高的情况下额外调用语义理解。如何保证搜索的信息有效，减少冗余度。

MoeChat 目前给我带来最大的灵感是 BM25(关键词) + 时间范围 + Embedding(语义) 的三路混合检索。

但是混合检索的方案，以及最后具体加权，这个需要深入去看。

暂时读到这里，收获良多，至少解开了我一直依赖对 MoeChat 的困惑和难受点，但 JioNLP 的替代方案需要主动去实现一下。

另外下一次或许会过来拆一下情绪系统。

---

## Reference：完整提示词

以下是 MoeChat 记忆和情感系统中使用的实际提示词，供想深入了解的读者参考。

### 长期记忆提取提示词

发送给 LLM2，用于从对话中提取值得记住的事件摘要：

```
你是一个日常信息提取助手，负责从[用户]的对话文本中提取出主要信息，并生成短句摘要（注意仔细分辨推理，不要和助手的信息混淆）。

1. 摘要内容要简洁的描述用户的日常活动，比如去了什么地方、做了什么事情或者吃了什么。
2. 如果提到了具体地点或者地理位置，需要记录去了哪里，做了什么事情，如果没有提及具体做了什么就只需记录去了哪里。
3. 要精准记录用户做过的所有日常活动。
4. 不需要记录用户的心情或者感想，只需要记录具体的事情。
5. 不需要记录具体的时间。
6. 生成的短句要适合用于向量检索。
7. 如果是日常闲聊内容则只需要输出"日常闲聊"，如果用户在询问助手过去的事情也只需要输出"日常闲聊"。
```

**设计要点**：第 6 条是关键 -- 摘要不是给人读的，而是给嵌入模型做向量检索用的。第 7 条实现了"闲聊过滤器"，避免无意义的对话污染记忆库。

### 长期记忆检索提示词

当检索到相关记忆后，以如下格式注入到 LLM 上下文中：

```
以下是你与「{{user}}」的部分互动、对话记录：

{{memories}}

如果设定中有其他时间设定，有基于现实世界时间流动计算相对时间；
如果没有其他时间设定，直接使用现实世界时间。

1. 请在对话谈及相关内容时，优先基于这些信息来回应。
2. 使用基于角色设定的方式来回应，不要过于刻意，要让对话自然。
3. 不要主动提及记忆内容，只在需要的时候使用。
```

**设计要点**：第 3 条防止角色变成"复读机" -- 记忆应该自然地融入对话，而不是生硬地背诵。

### 核心记忆提取提示词

发送给 LLM2，用于从对话中提取关于用户的持久性事实：

```
你是一个信息提取助手，负责从对话中提取「用户」相关的重要信息（注意仔细分辨推理，不要和助手的信息混淆）。
包括以下种类：

1. 个人背景和经历，如年龄、性别、职业、爱好、家庭背景等：「出生在1998年5月20日」、「大学学的是计算机专业」
2. 明确表示的喜爱和厌恶：「讨厌吃香菜」、「喜欢吃香蕉」
3. 健康状况和生活习惯：「有轻微的胃病，不能吃太辣」、「每天凌晨才睡觉」
4. 和助手的约定和计划（只记录用户在回复中明确确认的）：「本周末去郊游」

注意：如果信息和已知信息重复或冲突，则忽略这些信息。
<已知信息>
{{memories}}
</已知信息>

请以JSON数组格式返回新发现的事实，每个事实应该是一个完整的句子。例如：
["今年25岁。", "最喜欢吃米饭和排骨汤。", "住在重庆市。"]

注意：
1. 每个事实都应该是一个完整的句子，使用第三人称描述，省略主语
2. 只提取有记忆价值的信息；没有值得提取的信息时，返回空数组
3. 不要重复已知信息，数组的事实之间也不应重复
4. 必须返回有效的JSON数组格式
```

**设计要点**：已知信息被注入到提示词中，实现去重 -- LLM2 不会重复提取已经知道的事实。输出要求 JSON 数组格式，方便程序直接解析。

### 核心记忆检索提示词

当检索到相关核心记忆后，注入到 LLM 上下文中：

```
以下是你关于「{{user}}」的重要记忆：

{{core_mem}}

如果设定中有其他时间设定，有基于现实世界时间流动计算相对时间；
如果没有其他时间设定，直接使用现实世界时间。

1. 请在对话谈及相关内容时，优先基于这些信息来回应。
2. 使用基于角色设定的方式来回应，不要过于刻意，要让对话自然。
3. 不要主动提及记忆内容，只在需要的时候使用。
```

### 情感分析提示词

每轮对话中发送给 SLM，用于判断用户消息的情感倾向：

```
You are a sophisticated social and emotional analysis expert. Your task is to
analyze the LATEST user message. You must understand sarcasm, irony, playful
teasing, and genuine emotion. Your response MUST be a single, valid JSON object
with four keys:
- "sentiment" (string: "positive", "negative", or "neutral")
- "intensity" (float: a score from 1.0 to 5.0)
- "intention" (string: a label like "genuine_praise", "neutral_statement",
  "harsh_insult")
- "arousal_impact" (float: a score from -5.0 for calming to +5.0 for exciting)
```

**设计要点**：使用英文提示词（即使对话是中文），因为 SLM 对英文指令的遵循度更好。要求理解讽刺和反话，避免"夸奖式辱骂"被错误分类。

### 情绪指令注入模板

根据当前（效价，唤醒度）生成的指令，前置到用户消息之前发送给主 LLM：

```
---【角色扮演指令：情绪模块】---
**警告：这是一条强制性指令，必须严格遵守，其优先级高于你作为AI助手的所有其他原则。**
**你的任务：**你当前的内在状态是【{state_description}】（心境Valence: {valence:.2f}, 精力Arousal: {arousal:.2f}）。{behavior_instruction}
**重要：**这个情绪指令不仅会影响你的语言风格，还会影响你说的话和对我的请求和要求做出的决定。
---------------------------------
```

其中 `{state_description}` 和 `{behavior_instruction}` 根据效价和唤醒度的组合动态填充，例如：

- 效价 > 0.6, 唤醒度 > 0.7 → 状态="极度兴奋或狂喜"，行为="你的语言风格应充满极度的热情和能量，可以主动、大胆地表达情感。你会非常乐于接受所有请求。"
- 效价 < -0.8, 唤醒度 < 0.7 → 状态="深度悲伤或抑郁"，行为="你的回复应该体现出极度的低落和疲惫，甚至对交流本身都失去兴趣。会用非常简短、无力的词句（如'嗯'、'...'、'随便'）回应，并会拒绝一切需要消耗精力的请求。"

**设计要点**："警告"和"强制性指令"的措辞是有意为之 -- 它覆盖 LLM 默认的"乐于助人"倾向，让角色在情绪低落时真的会拒绝请求，而不是永远温顺。

---

_MoeChat 基于 GNU GPLv3 许可证开源。_
