---
title: responses vs chat_completion（草稿）
published: 2026-07-21
draft: true
---

今天我们来稍微讨论一下关于传输协议。

常见的有：

- `Chat Completion`: /v1/chat/completions
- `Responses`: /v1/responses
- `Claude Response`: /v1/messages

一直以来我的 `XnneHangLab` 消费的都是 `chat_completion`。

原因比较简单，我以及正常用户接触的都是 `chat_completion`。因为早期版本的 newapi 是不支持 Responses 的，直到今年五月份以后的新版本似乎才支持。而且甚至 DeepSeek 这样的 API 平台也都只提供了 Completion 的接口，这就很不该了。导致我当时想找个纯正的 Responses 接口来测试一下新版本的 codex-cli 都找不到。

> PS，最近的 ds-v4-flash 在我日常使用中已经出现了类似豆包的低智和左右脑互博。哪怕一些简单的指令也需要跑几次，已经打算全面用 grok-4.5 接替它在 Obsidain-YOLO 里的辅助工作。<br>
> 不知道是不是降智了，在我这里，判断一个模型智力最容易就是让它审查代码，而 deepseek-v4-flash 审查代码和 gpt-5.6-sol 以及 grok-4.5 比真的是会流口水的那批。多步推理和深度思考一团糟，考虑事情非常片面。<br>
> 唯一可圈可点的就是 deepseek 的后训练了，它让 deepseek 的话看起来更有人格。也就只能用来角色扮演对话了。但是 tnnd 那个图像理解到底什么时候进 api。明明网页端都上线了一个多月了。

之所以想来做这个，是因为在测试 memu-cli 接入 codex-cli 的时候，发现新版本 (>0.95) 的版本直接阉割掉了 `Chat Completion` 转向 `Response`。

我们这里探讨一下为什么 codex-cli 这么做。可能从 codex 官方仓库的 issue 入手。

以及分辨一下这两个主要区别，以及迁移价值，会给我们的 XnneHangLab 带来哪些好处？

以及召回一下以前在碎碎念里留下的疑问：

```shell
可以探究一下为啥 anthropic 协议支持 tool token 和 chat token 交替，而 openai 只能先 tool 后 chat ，但是似乎用提示词注入又可以让它预告自己要执行的 tool。

它预告时是否得到了完整的 tool schema? 以及它是在哪一次 LLM call 进行预告?
```

这里或许不够准确。这个疑问是这样的场景：

我们给桌宠陪伴场景加了 ToolCall 后，不仅 ToolCall 会带来一次额外的 LLM，而且等待 Tool 执行的时间通常还不短，并且还得把 Tool 执行的结果再发给 LLM 进行回复，这个过程中，体感上增加了五六秒的回复延迟。而且这个过程模型显得异常 `沉默`。

当时我设计给它加入了一个 policy 级别的提示词注入插件: [pre_tool_preview](https://github.com/XnneHangLab/XnneHangLab/blob/dev/src/lab/plugins/pre_tool_preview/plugin.toml)

大致就是告诉模型说，嘿，如果你要执行 tool 了，请在执行前口头预告一下你要执行的内容。

之后模型也确实会在做各种事情来一句简短的预告 `让我截图看看你在做什么？`、`让我翻找一下最近的日记内容`。

整体效果不错，缓和了原本那段如果死亡一般的寂静沉默。

我有点忘了当时的具体实现细节了，需要再次确认。另外，我需要 token 级别的 `streaming token` 演示，token 是如何交替的，这个预告发生在 tool token 前还是 tool token 后。为什么可以先预告再执行再回答。它中间经过了几次 LLM Tool Call。

以及它可以预告几次？是否支持长 tool call 链条的分段预告？

如果我迁移到 Responses，这个特性会被继承吗？ Responses 会改变 Token 流的返回过程吗？

另外我室友说 Responses 支持长连接是真的吗？是否可以省掉我桌宠对话过程中握手带来的那部分首字延迟？

以及当时为什么我会说 Anthropic 支持边说边做，而 OpenAI 不行？它们在 Streaming Token 流上有什么区别吗？

大致就是这些疑问。接下来我们来请教 Fable 老师，或者 Opus 老师，请老师不要仅仅只依赖自己的学识回答，这里很多涉及到的东西要有依据。最好是 codex 或者 newapi 官方仓库的 issue ， Athropic 和 OpenAI 的文档来背书。
