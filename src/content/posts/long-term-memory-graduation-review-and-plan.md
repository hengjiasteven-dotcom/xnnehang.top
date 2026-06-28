---
title: "去做 Long-Term Memory！AI 本科毕业后的回顾与计划"
published: 2026-06-28
category: 思考
tags:
  - 思考
  - 毕业
  - AI
  - Agent
  - Memory
  - 回顾
description: "一个由《可塑性记忆》开始的、十八岁的梦在二十二岁时成为研究课题的、简单的、平平无奇的故事——以及围绕 Long-Term Memory 的技术方向分析、项目拆解计划和生活展望。"
---
![cover](../../assets/img/graduation-review/graduation-review-cover.png)

>  [去做机器人！AI 本科毕业后的年度总结](https://blog.nagi.fun/2025-memo?lang=zh) 这篇是我的灵感来源，我打算先做一个 RoadMap，以及简单地回顾一下我的本科生涯，也是为了探寻——什么是我真正追求的。

## 一个平平无奇的故事

在 22 年的 6 月，X 刚刚看完 《可塑性记忆》，心里怀揣着对赛博女友的追求，打开了小甲鱼的 Python 入门教程，买了一本到毕业都没翻开仔细看的《Python 基础教程》。怀着满心喜悦，报考了 XMUT 的人工智能专业。而 ChatGPT 3.5 在 2022 年的 11 月 30 日发布，距离它发布，不到三个月的时间。

在开学后的线上自我介绍里，X 用 Python 的 pygame 里写了一个简单的自我介绍动画，但最后还是被迫开麦讲话了（躲不掉，是真的躲不掉）。

在 22 年 11 月，X 完成了 Cpp 的创意课程设计，利用窗口句柄 hook TIM(QQ) 的消息内容，并且给出回复。

<iframe src="https://player.bilibili.com/player.html?bvid=BV1wM411k7q9&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

那是 X 第一次发现，回复的方式有了，但是回复的内容，要如何有灵魂呢。随后，他开始在 Udemy 上学起了 Pytorch (CNN -> Resnet -> Transformer -> ViT)，以及 BERT。

而还没等 X 学明白 BERT 是啥， chatgpt-3.5 发布了，以及很快有人利用 chatgpt-3.5 + live2d + ViTS + Unity 开发了数字人对话。（果然为了赛博女友生产力就是高）

<iframe src="https://player.bilibili.com/player.html?bvid=BV1TD4y1E7e8&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

那个时候几乎只有系统提示词硬套，以及很短的上下文窗口，但是在 X 看来，依然接近神迹。

同期，因为在高数老师的课上在那里写 Resnet 分类二次元角色，于是乎被问，要不要来我这里呀，我这边有数据集。X 傻乎乎就去了，然后，每周组会，数据集清洗，调参，被要求改进某某 Net 来适配特定任务，以及哪怕到了寒暑假也逃不过两周一问，`最近有什么进展`的日子，让 X 对研究生的生活充满了阴影。

在那个时候 X 暗暗发誓，绝对不要考研。然后在经过两次返修终于发表了一篇关于如何用 Deep-LSTMs 去做新冠病毒病人出院时间预测。也发誓自己绝对再也不做神经网络改进了，无趣，耗时，黑盒，收不到反馈。

X 为了能够放松自己，开始玩起了 ViTS 系列，入坑 BERT-VITS2， GPT-SoVITS，但这次他完全不碰模型网络本身，只是做一些开发性质的东西。训练了一个小隐 soyyo 的声线：

<iframe src="https://player.bilibili.com/player.html?bvid=BV1g94y1L7re&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

同时他写了一个快速制作 VITS 系列数据集的小工具——虽然后来 GPT-SoVITS 官方提供了更好的——但那是 X 第一次体会到开源的乐趣。即使代码写得很烂，他也一直坚持把那个仓库 pinned 在自己的展示仓库里。那是他的起点。

大概在那之后不久，X 认识了 [SigureMo](https://github.com/SigureMo)，那大概算是 X 的老师，虽然没有主动教过什么，但是 X 大概花了两三个月时间完全把自己写代码的工作流变成对方的形状，ruff，pylint, pytest。以及对方审查代码的一个思路——为什么做，有没有更好的做法，是不是最小改动（有没有拖泥带水）。

在 SigureMo 的引导下， X 也参与了一次 Paddle 的启航计划，在那里他第一次体会到了白盒子是什么感觉——神经网络调优是无法预知结果优劣的，但是深度学习框架的算子 bug_fix 或者额外类型支持，这些是可以预知结果的。那段时间他写代码写得真的很开心。也闹出过一些乌龙，比如 SigureMo 想让 X 去用 pre-commit 引入 typos，同时把这些简单的拼写修复 of review 都交给了 X，但是由于以前并没有 review 过代码，X 不知道 review 是要 submit 后才能被人看到，他给了很多的 pending review =-=，每次都没有人回复，X 一开始还很困惑，直到每次都要 SigureMo 来帮他收尾，他才发现原来他们看不见自己的 review。

SigureMo 一直很照顾 X，而且给 X 一种找到同类的亲近感，但 X 应该让 SigureMo 很头疼。SigureMo 始终是 X 的开源启蒙导师。

关于后来 X 为什么离开了 Paddle，大致原因有二，一点是， X 是不大喜欢刷 leetcode 的，并且对于 Cpp 和算法原理也有些困难，无法直接上手那些黑客松里的高 star 任务，比如接了 torch.grad 算子对齐最后被卡了两周。如果那个时候有 claude opus 4.6，X 就可以一点点自己把它磨出来并学会，但是那个时候 OpenAI 还只是 gpt-4o，用来读 Paddle 还是不太行得通。而 SigureMo 本身也不负责 torch.grad 这种类型的算子（也许他的数学其实也不好？），而 X 又比较害怕麻烦别人（难道麻烦 SigureMo 就是可以的？）。于是乎 X 默默把任务接取的状态取消然后默默离开。

这么做是对的吗？X 并不清楚，但是，他决定以后一定要帮 SigureMo 贡献 [yutto](https://github.com/yutto-dev/yutto)。同时，他也做了 yutto 的 GUI 版本。

<iframe src="https://player.bilibili.com/player.html?bvid=BV1yRdBBsEGZ&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

在离开 Paddle 后，入学时候的赛博女友梦又慢慢浮现出来。即使现在 X 的大学生涯已经过半，但他想当个梭哈怪，把所有的精力都投入了桌宠的开发。

也就开始有了 XnneHangLab 这个仓库。这是一个至今仍在进行的故事。

这个项目几乎用上了 X 学的所有东西，TTS、ASR、Live2d、Agent。

在 [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) 的基础上，X 多做了 Skills、Tool、Memory、主动式对话。为此，他还主动造了一个适配于自己项目的 Agent 框架——[[当主流 Agent 框架无法适配需求时，我们造了什么]]

这个项目被他用去做毕设，但即使站在答辩台上，他对自己的应用依然有很多很多的计划与期待，期待 DeepSeek V4.1 带着多模态视觉理解，让他的主动对话的 LLM call Delay 缩减到一次。以及期待自己能够解开长期记忆的迷雾。他出于性能和时间考虑，只是复用了 [mem0](https://github.com/mem0ai/mem0) 来做 RAG，复用了 [memsearch](https://github.com/zilliztech/memsearch) 来做 markdown 文件式的记忆。他还没来得及去思考更多——像这样的思考性文章有太多没写 [[做过长期系统项目再看：RAG 怪兽是否适用于个人博客系统的图谱构建？]]——他还来不及去拆解更多。没来得及想清楚自己的记忆需求到底应该怎么造，别人有什么可取之处，很多仓库，来不及拆解——[AlfreScarlet/MoeChat](https://github.com/AlfreScarlet/MoeChat)、[Anson-Trio/BaiShou](https://github.com/Anson-Trio/BaiShou)——还没来得及好好思考，文件式的记忆、人格文件应该要怎么排布，怎么分层？怎么索引？怎么生成和组织每次被阅读的文档？上下文长度如何合理控制？双向引用怎么用？metadata+node 有没有必要?

这个故事还将继续，但 X 现在还有些时间。因为他又一次当起了梭哈怪，毕业后一把梭哈进 [NevaMind-AI](https://github.com/NevaMind-AI) 做远程开发，实习性质的。不全职、不找工作，因为什么呢？因为他觉得，即便入职小厂做 Agent 开发，每天重复机械地使用 Langchain 或者 Langgraph 来搭建维护一些应用，远远没有思考 Agent 本身有趣，或者说这不是有不有趣的问题。而是， Agent 开发以后还会是这个模式吗？Claude Fable 5 当时仅仅上架了一天，就让很多人感觉到，往后的大模型也许根本就不需要手动编写工作流，也许工作流本身的细节也该由大模型自己来定。也许人们写好需求就好了，那么原来的 Agent 开发的岗位或者说形式就完全变了，X 就不得不调整方向，再次陷入被迫辗转反侧、身不由己的状态，而这种状态，X 在大二天天开组会时，已经深有体会。

X 还是想做赛博女友，这是他一直往下走的动力，但在 LLM 出来后，问题从怎么让模型回复自然的语言，变成了怎么让模型长久地保持、更新、维护自己的人设和记忆。这也是我们后续要讨论的内容。

> 一段小插曲，在 X 前脚刚刚加入 Nevamind AI，就莫名收到了 [https://ai-mage.jp](https://ai-mage.jp/news) 发来的交流邀约。邀约语是：`AI Mage 正在打造深度理解日本动漫语境的 AGI ( Anime General Intelligence)，现在正在寻找一位既有强工程能力、又对二次元 / 动画内容有兴趣的核心开发伙伴。`难道是伊蕾娜头像+芙莉莲个人介绍卡片又发力了。但是身以许梦难许卿，X 现在一心只想做赛博女友呀。准确地说，比起赛博女友的存在形式，我更在意她的灵魂呀。

而这，是一个由《可塑性记忆》开始，一个十八岁的梦在二十二岁时成为研究课题的，简单的、平平无奇的故事。

## 计划呀

这一块后续应该会不断地修正和补充。主要是围绕长期记忆展开的。

首先是对当前 LLM 长期记忆的不同方向有一定的理解——

- **强化学习 + 蒸馏内化** — 把记忆融进模型参数，但奖励稀疏、优化空间大，我个人不太感冒，而且运行的算力成本消耗太大，不现实。
- **反思 & 类脑** — 走神经科学和认知科学路线，好讲故事，效果看实验。这个也许在 markdown 的内容组织结果上可以起到一些指导作用。
- **分层记忆** — 短期/中期/长期、L1/L2/L3，目前最主流的做法。不是很了解
- **知识图谱 & 向量空间 & RAG 路线** — 如果只是简单的 CRUD ，那么其实没什么看头，因为 embedding 的文本块本身，就是割裂的，而且向量相似度计算得到的也是失语性的关系。
- **文件系统式记忆** — 用 markdown + 文件夹组织记忆，也是我目前在试的方向，似乎也是 MemU 的主张？但是具体分层以及索引，还得研究一下。

对这些方向有一定认识后——也许需要每个方向都找个特例来看看，比如 RAG 的是 mem0， L1/L2/L3 的是 BaiShou，以及类脑应该得读论文——再去看各个 Memory Agents 开源项目/论文的取舍和设计哲学。找出哪些是可以学的和可以参考的。

因为我们始终需要权衡的点是，什么时候长时间的记忆检索是被允许的，什么时候我们希望尽快回复。所以，没有最好的记忆系统，只有最合适的。

### Memory Agents 的项目拆解


::github{repo="AlfreScarlet/MoeChat"}

::github{repo="Anson-Trio/BaiShou"}

::github{repo="zilliztech/memsearch"}

暂时列了这几个，当然 MemU 也在计划之内，因为后续参与重构性的开发。

但是我觉得比起沉浸于一个项目里，有时候多看一看，多拆一拆，也许能够更有益。因为，现在写代码本身，Claude 可以说是已经代劳了，但是，写什么，是值得认真思虑的，但是这东西通常又是硬坐着想出来的，多看，多反思才好。

至于项目拆解，会写成博客系列，也会逐步进我自己的 XnneHangLab。
### 睡眠 & 健身

在毕业典礼前一晚，我和舍友聊到深夜。

聊起因压力报复性熬夜导致逐渐失去自我掌控的感受，以及在连续几天十点上床睡觉后，感觉自己的智商变高，行动力更强的事情。

由于是远程工作，以及暂时不知道工作压力如何，所以暂时不能定论，只希望自己能够坚持早睡。

关于健身，其实应该是先做一个月有氧。然后再考虑去办卡。如果天气不是很好（最近好像确实是这样），可能得提前办卡 or 我再自己买部跑步机。

### 游戏 & 记录

临近毕业时，我一点也没有感叹自己浪费时间没有好好学什么东西。反而，我感叹自己浪费时间没有好好打游戏。为什么呢？

金铲铲之战，瓦洛兰特。或者说，所以这些需要多人游玩，通过段位获取成就感，通过游戏搭子来获取愉快感的游戏，在离开了游戏搭子，或者段位终于打到了自己的一个上限后，就会显得无趣。或者说，这类游戏本身就是无趣的，只是因为有游戏搭子的陪伴才显得有意思。

而且它也教会了我一种哲学，就是所有快乐感不是因为预期而得到的，而是启动后因为体验而得到的，有时候一本书看上去也许本身看起来并不有趣，但是，主动看上几页，通常也就会连带着继续看上好多页。很多事情，开始了就不会轻易停下来。放在游戏里，确实是浪费时间的，但是这种现象本身，就是可以被利用的。

我希望自己可以接着玩像 《风信楼》、《火山的女儿》、《中国式相亲》、《大镖客 2》这样的游戏，同时如果可以，产出点游玩感受。

比如最近入库的《梦幻魔法公主》，一直拖到现在还没玩，以及后续要上线的《明月的女儿》，现在可是夏促，多多入库，多多体验。

我希望，这次，那种希望能够多多体验有意思的游戏不会只是存于幻想或者遗憾之中。或者即使最后仍然会是如此，我也应该有意识地区留下更多像 [[风信，是个好名字。]]这样的记录。

### 小说 & 电影 & 观后

我大学时期看的实体小说，远远不如我高中三年看得多。

包括我大二时折腾的一个树莓派 + 投影仪，在我折腾完后也没看超过十部电影。

<iframe src="https://player.bilibili.com/player.html?bvid=BV17zDWYwEj8&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

观后继续写呀~

但是不是为了写而写。

## 最后

希望未来我们依然可爱~

并且希望可爱的事物继续吸引我们~
