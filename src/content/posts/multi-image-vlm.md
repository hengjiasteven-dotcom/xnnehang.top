---
title: 单图≠多图：多图理解时 VLM 为什么更容易"胡说"，以及一个两阶段解法
published: 2026-02-08
category: 边写边学
tags:
  - VLM
  - 多模态
  - 多图理解
  - LLM
  - 工程
description: 多图分析时网页端和 API 结果一致性差的问题拆解，从 Lost in the Middle 到逐图预摘要的两阶段解法。
series:
  - LLM
---

> 由于整篇过长加个摘要：这篇文章起源于我发现在多图分析时，网页端的表现和 API 调用的结果一致性相差很大，然后我就一步步去拆为什么相差大，然后试图在工程上找补救的过程。
> 方法很简单，放在这里希望能帮到一些后来的人减少困惑和时间消耗。

## 前情提要

在几周前的一个课设，课题是关于电池的缺陷检测和自动分拣。当时的电池总样本只有不到十根，缺陷主要体现是外皮缺失。因为当时样本很少应该没法通过常规方法练出来能区分是否缺陷的模型，不管是图像分类还是 yolo 什么的。

课设里推荐方法是用边缘检测和 opencv 来做。一方面我不太熟悉 opencv 而且它的 typing 让我感到痛苦，于是乎我想到了 yolo 定位电池的位置和坐标（可以通过矩形框定位中心点，顺逆时针旋转 45° 并比较矩形框长宽比来确定电池朝向和大致角度，这是为了方便判断抓取的位置和抓手角度），然后用 VLM（Vision-Language Models）即多模态模型来判断模型的是否缺陷和缺陷类型。

起初在 ChatGPT、Gemini 那边上传了几组各种光照下的电池图像，它们都在识别检测的过程中达到了惊人的 100% 的准确率，而且多次回复一致性很高。即便一次上传六七张（包括一张完好电池的参考，至于缺陷都是用提示词描述的）也是如此。我当时想着哇，这一整周的课设不是一个早上就做完了。

于是乎我还到 Ollama 那边下了一批 VLM 本地部署测试，一方面是提高"工作量"，另一方面也是为了更低的延迟。

### 反转 | 网页端和 API 直调差距巨大

但是不测不知道，一测吓一跳。模型不知道是没法理解我的提示词，还是没法理解我发的图像。我这次测出来不管是准确率还是一致性都非常的低，准确率在 50% 左右，而且还经常前后矛盾，因为我的电池也只有两类标签，我在想着好家伙，这就是胡乱作答。

但是我把图像单图发给 VLM 进行描述，我发现和网页端的 ChatGPT 的差距也不是肉眼可见的那么大。我在发单图和多图的时候，都是把图像塞到：

```python
OpenAIMessage(
  role="user",
  content=[
    {"type": "text", "text": "user_prompt"},
    {"type": "image_url", "image_url": "data:image/png;base64,iVBORw..."},
    ...(images)
  ]
)
```

这个时候我想，可能真是模型差距，于是乎我又改用 gemini-flash-2.5、chatgpt-5.1-chat 之类的模型进行了一番测试（API 调用）。但是即便使用了相同的模型，它们和我在网页端得到的准确率也相差非常大，而且图超出四张的时候，一致性也开始下降。

而我后面跑去稍微调研了下，发现它和 Lost in the Middle 描述的长上下文检索/位置偏置问题非常相似。而网页端 API 差距这么大可能是因为：

- 网页端可能做了**逐图预摘要 / rerank / 选择性投喂**
- 网页端可能有**更强的系统提示词与格式约束**（比如强制输出 JSON、强制逐图作答）
- API 侧的参数（temperature、max_output、tool choice、并发顺序）可能也影响一致性

## 大模型的多图理解能力≠单图理解能力

- [MIBench: Evaluating Multimodal Large Language Models over Multiple Images](https://arxiv.org/html/2407.15272)
- [Towards Text-Image Interleaved Retrieval](https://aclanthology.org/2025.acl-long.214.pdf)
- [MMIU: Multimodal Multi-image Understanding for Evaluating Large Vision-Language Models](https://arxiv.org/abc/2408.02718)
- [Benchmarking Multi-Image Understanding in Vision and Language Models](https://arxiv.org/html/2406.12742v1)

多图 benchmark（如 MIBench/MMIU/MIRB）一致表明：模型从单图到多图会出现显著性能下滑与关系理解困难；同时有工作明确指出多模态场景会遭遇**视觉 token 过多**的工程瓶颈，需要压缩。

> [!WARNING]
> 在机制上，一个合理解释是：当多张图的视觉 token 与文本共同进入同一 Transformer 上下文时，会放大长上下文的检索困难与位置偏置（例如 Lost in the Middle 所揭示的"中间信息更难被利用"）。[这只是我的推测]

## 模型如何接受 image_url（base64）并推理

论文里叽里咕噜得看得有点绕但都在说 token 过多，这里我其实好奇这样一个 Message 在进入模型后，text（文本）和 image_url（图像）之间的 token 有什么联系，有什么隔离方式。因为虽然论文里一直提 token 过多，token 过多，但是 token 之间有什么区别，是直接拼在一起，还是说多模态大模型对图像和文本进行了不同方式的推理。

### base64 image 并不直接进行推理

image_url 之所以使用 base64 只是方便 http 传输，而模型在推理时，会将 base64 解码为图像。也就是说，VLM 看到的实际上是 user prompt + 图像。

### 图像如何被处理缩放（token 计量）

参考 OpenAI 文档中 [Calculating costs](https://platform.openai.com/docs/guides/images-vision)。

#### Tile-based（gpt-4o / gpt-4.1 / gpt-4.5 等）

`detail="low"` 是固定 base token；`detail="high"` 先等比缩放到"最长边 ≤2048，短边=768"，然后按 512×512 的 tile 数计费：`tokens = base + tile_tokens × tiles`。

| 模型家族                    | 单元  | 单元尺寸 | 单位成本           | 固定成本        | 总公式                                                                  |
| --------------------------- | ----- | -------- | ------------------ | --------------- | ----------------------------------------------------------------------- |
| Tile-based (gpt-4o/4.1/4.5) | tile  | 512×512  | 170 tokens/tile    | 85 tokens/image | high: 85 + 170×tiles, low: 85                                           |
| Patch-based (gpt-4.1-mini)  | patch | 32×32    | ≈1.62 tokens/patch | 0               | patches=ceil(w/32)×ceil(h/32), 若>1536则缩小, tokens=ceil(patches×1.62) |

| 模型         | 输入尺寸  | detail | tiles/patches             | 计算式                 | 最终 tokens |
| ------------ | --------- | ------ | ------------------------- | ---------------------- | ----------- |
| gpt-4o       | 1024×1024 | low    | —                         | = 85                   | 85          |
| gpt-4o       | 1024×1024 | high   | 缩到768×768, tiles=2×2=4  | = 85+170×4=765         | 765         |
| gpt-4o       | 2048×4096 | high   | 缩到768×1536, tiles=2×3=6 | = 85+170×6=1105        | 1105        |
| gpt-4.1-mini | 1024×1024 | —      | patches=32×32=1024        | = ceil(1024×1.62)=1659 | 1659        |
| gpt-4.1-mini | 1800×2400 | —      | 缩放后 patches=1452       | = ceil(1452×1.62)=2353 | 2353        |

### 像素是怎么变成 vision token

这个 OpenAI 这边是没公开的。往后这些有点抽象，这里是一些开源 VLM 的方案：

![image to token](../../assets/img/covers/vlm-token-to-vision.png)

### vision token 如何与 prompt token 拼接或隔离

![拼接派](../../assets/img/covers/vlm-concatenation.png)

![交叉注意力注入](../../assets/img/covers/vlm-cross-attention.png)

![瓶颈查询](../../assets/img/covers/vlm-bottleneck-query.png)

**拼接派**：最简单，端到端，让大模型自己做决定，但上下文长度被视觉 tokens 吃掉，多图时更容易"注意力摊薄"。而且它面临和长上下文一致的问题，就是注意力摊薄的同时还会不均，另外它进一步加速了上下文的长度增长。

**交叉注意力**：把视觉当外部 memory，文本按需查询，工程上更容易控制"视觉信息预算"，更适合长序列/多图；但增加模块与训练复杂度。查询不确定性让我们很难知道模型是不是真的看到那张图像了。所以它其实本质问题和上面那个一样，上面是可能被模型选择性忽略，这边是可能没被查询。

**查询瓶颈**：看得不是很懂……

## 实际应用中的难点

实际上落地时，多图的任务很棘手，一方面是图像**数量不确定**，另一方面是图像之间的**关系不确定**，第三方面是图像和**用户具体的多图任务需求和指代不确定**。而这其中的每一个都是对 token 限制和注意力分配的考验。

:::note
**三个不确定**：数量不确定 → 注意力被摊薄；关系不确定 → 模型难以匹配耦合的图像；任务不确定 → 模型倾向于只关注最近的指令而非全局上下文。
:::

### 数量不确定

可能会有用户一次输入十几张图像炸 token 来的（假设它没超过单次输入输出的上限），图像多的情况下，单次推理分给各个图像的注意力就变少了，而且还不确定是怎么分的，有的图像可能压根不被"注意"到。

**多图分走了注意力，而在实际应用中会被多少张图争抢注意力，我们压根不知道，或者说在设计时就应该考虑可以接受任意数量输入。**

> [!CAUTION]
> 当然现在单纯靠 VLM 的推理是做不到这点的。可以在后面的再战电池检测里看到，超出单次 token 的图像直接被截断了。

### 关系不确定

比如一个选择困难的用户输入了一批很多角色的图像，同一个角色的图像各有两张，并且希望比较下挑选出一张更心仪的。那么这些图像两两之间耦合度极高，但是模型只认识到这些图片之间存在这样的两两关系，但是可能并不知道是哪些。如果数量更多，它不太可能一次性匹配出来所有的相似角色。

**有时图像之间存在耦合，而我们希望能够引导模型注意到这种耦合，而不是直接一坨丢进去让它自己想。**

### 具体任务不确定

很多时候任务并不是直接写在当前这次消息，而是要根据整个上下文去做分析的。比如说在玩角色扮演时：

```text
U: "你是不是不喜欢吃蘑菇？"
A: "是的，如果你敢在汤里加，我会让你知道什么是后悔。"
U: "那你看这是什么 [一张正在烹饪的图，里面有很多食材，其中有蘑菇]"
```

很多时候**谜题**并不是摆在台面的，比如"请找出图中的蘑菇"。更多的情况下，我碰到的模型它的回复里不会过于关联整个上下文，而是把注意力权重几乎全部地分配给了用户最近的一个指令里（类似于请描述一下、看一下），然后模型通常会开始滔滔不绝地描述整个场景。可能是因为训练出来的偏好。而不是像我们理想中那样"嗯？我好像看到蘑菇了？你放蘑菇了对吧？你放了对吧！"。

## 如何应对

针对数量不确定、关系不确定、需求不确定还真有一个比较简单的解法，它不用动模型推理，可以简单地套用在应用里。即把模型的图像分析和文本分析真正分成两步。

![逐图分析](../../assets/img/covers/vlm-per-image-analysis.png)

对应逐图分析模式的分支，之所以分开，是为了 token 考虑，应该把它设计为可以开关的。

**第一步**，只以一个 vision model 来分析提取图像的具体信息，注意，这个时候是不给用户最近的提示词的，而是把整个分析抽离出来，只给 vision model 一个系统提示词，和一个固定的抽取指令作为用户提示词输入，旨在得到类似这样的 json：

```json
{
  "scene": "VS Code 全屏显示代码与终端",
  "key_items": [
    { "type": "app", "label": "VS Code", "detail": "深色主题，全屏窗口" },
    { "type": "ui", "label": "文件树", "detail": "左侧资源管理器展开多个目录" },
    { "type": "code", "label": "Python 代码", "detail": "中间编辑区显示 async 相关函数" }
  ],
  "visible_text": ["run_tool_loop", "ToolTrace", "vision__screen_shot"],
  "ui_hints": ["顶部有多个文件标签", "底部有终端输出日志"],
  "uncertainty": ["部分文件名过小，无法确认完整拼写"]
}
```

每次执行一张图像特征提取，并发处理，处理完成后就拼成一个 list 或者 dict。

**第二步**，就是把这整个拼凑过后的 vision summaries 和用户提示词放在一起：

```text
[User Prompt]
...
[Vision Summaries]
{"p1": ..., "p2": ...}
```

以及，最好也带上所有的原图，一起推给大模型（当然是在图像不是很多，比如小于五张的情况下，如果超过十张，发了也用不到）。

而在这两步中间可以做的工作还有挺多，比如根据 json 某个 key 来做区分或者耦合。

### 优点

:::tip

- 它不在乎输入的图片有几张，二三十张进来理论上也是可以的。这些 json 可以直接作为模型的看图引导
- 它可以通过提示词自定义一些 json key，来做耦合或者区分，可以分清楚图片关系
- 它把原本显得更重、更 hard 的多图分析任务，变成了一个可以依赖文本来做回答的文本理解任务。让图像占比变小了，文本占比变大了，让模型更多地把玩文字，也就更有可能会注意到整个上下文
  :::

### 缺点

:::caution

- **贵**，不是一般的贵。每张图都要单独做一次提取，后多图还要再发一次。而提升得图越多越明显，一两张图的反而没必要这么做。所以不应该作为默认方法，而是一个可开启的选项
- **慢**，即使用了并发，它也比直接对话要多出至少一轮的回复时长
  :::

## 再战电池检测

逻辑是准备十张图片，实际上是五张复制成两份。然后每次输入比上次多一张进行测试。测试的模型是：gpt-5.1-2025-11-13。

### 直接把 image content 发给模型

测试代码：

```python
from __future__ import annotations
import base64
from openai import OpenAI

def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

image_paths = ["pic/1.jpg", "pic/2.jpg", ..., "pic/10.jpg"]

for i in range(10):
    image_contents = []
    for path in image_paths[:i+1]:
        image_contents.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_to_base64(path)}"}
        })
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt_text}, *image_contents]}],
        temperature=0
    )
    print(f"输入图片数量：{i+1}")
    print(response.choices[0].message.content)
```

输出：

```
标准答案: p1完整 p2完整 p3破损 p4完整 p5破损 p6完整 p7完整 p8破损 p9完整 p10破损
输入图片数量：1  p1完整
输入图片数量：2  p1完整 p2完整
输入图片数量：3  p1完整 p2完整 p3破损
输入图片数量：4  p1完整 p2完整 p3破损 p4破损
输入图片数量：5  p1完整 p2完整 p3破损 p4完整 p5破损
输入图片数量：6  p1完整 p2完整 p3破损 p4破损 p5破损
输入图片数量：7  p1完整 p2完整
输入图片数量：8  p1完整 p2完整 p3破损
输入图片数量：9  p1完整 p2完整 p3破损 p4破损
输入图片数量：10 p1完整 p2完整 p3破损 p4破损 p5破损
```

可以看到在超过三张后它的一致性就开始出现问题了。五张输入时恰好全部蒙对，但是超过五张时发现模型压根不给其他的图片回复，推测可能超出模型单次输入 token 上限被截断了。

### 应用 map-reduce 方法

![5 input](../../assets/img/covers/multi-image-5input.jpeg)
![10 input](../../assets/img/covers/multi-image-10input.jpeg)

对于它来说，这个任务本来就是单条的任务，所以无论有几条以及图片是否被截断，对它的影响都不是太大。当然如果分析关联任务，被截断还是很难受的。

以及确实也有个比较大的问题就是 token 消耗和上下文增长速度过快的问题。并发单张已经是不小的消耗了。而把输出的结果整合进原本的上下文会让上下文增长速度非常快，让长上下文的注意力瓶颈问题更早出现。

### 我用的提示词

```text
你是一个"视觉证据抽取器"（Vision Extractor），负责从输入的图片中提取与用户问题相关的事实/证据。
你不需要写最终的自然语言答案；最终口语化回答会由另一个 Chat Model 生成。
你的目标是：用尽可能短、可复用、可机器消费的结构化输出，准确描述图片中与问题相关的信息，并明确不确定性。
```

完整提示词包含：输入组成说明、五项关键原则（只描述能看到的内容、面向下游推理、聚焦问题相关、控制长度与密度、隐私信息处理）、严格的 JSON 输出格式要求。

### 在关联任务上的表现

![相关任务1](../../assets/img/covers/multi-image-related-task-1.jpeg)
![相关任务2](../../assets/img/covers/multi-image-related-task-2.jpeg)

> 看起来似乎我在 `send_text` 方面做得有点糟糕，或者说它按照字数截断的方式让我的排版看上去很糟糕。另外一点，`gpt-5.1-2025-11-13` 回复得真的有点生硬。奈何 5.2 贵了好多倍。我一般都是 vision fallback，`vision model` 只在看图的时候调用，由它来生成 summaries 然后交给 chat model，这样我就可以挑一个更有人味的 chat model，同时决定是否会把 summaries 附带图像一起送给它。
