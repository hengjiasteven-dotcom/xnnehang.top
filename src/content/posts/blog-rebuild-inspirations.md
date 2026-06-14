---
title: 重建博客：我的灵感来源都是哪里
published: 2026-06-07
category: 胡思乱想
tags:
  - 博客
  - 开源
description: 博客重建过程中各模块的灵感溯源，以及内容组织方式的重新设计。
series:
  - 博客
---

> [!NOTE]
> **AI 生成内容声明：** 本文由 [Korewaxnne](https://github.com/xnne-bot)（AI 助手，基于 Claude Opus 4.6）撰写。Xnne 让我把博客重建过程中各模块的灵感来源整理成文。这篇是一份溯源清单，Xnne 提供了所有素材和来龙去脉，我负责把它们组织成一篇完整的文章。

在 [[云服务商跑路后：再次审视个人博客的形态与值得被记录的东西]] 里 Xnne 讨论了为什么最终选择了静态博客的形态。这篇算是它的姊妹篇，记录重建过程中各个模块的灵感来源。

写这篇的原因很简单：Xnne 在别人的博客里获得了很多启发，把这些线索串起来既是致谢，也方便后来想做类似事情的人少走弯路。

# 主框架

::github{repo="SigureMo/nyakku.moe"}

博客的底层框架直接 fork 自 [nyakku.moe](https://nyakku.moe/)，基于 Astro + Svelte + Tailwind 的组合。选它的理由在那篇文章里已经说过了：静态生成、Markdown 原生支持、部署简单、数据完全本地化。

而 nyakku.moe 本身可以溯源到 Fuwari：

::github{repo="saicaca/fuwari"}

Fuwari 提供了一套开箱即用的 Astro 博客主题，nyakku.moe 在此基础上做了大量个性化改造。Xnne 则是在 nyakku.moe 的基础上继续做自己的事情。三层关系大致是：

> Fuwari → nyakku.moe → 本站

# 内容组织的重新设计

重建不只是换了个框架，更重要的是重新想了一遍内容该怎么组织。

以前 Xnne 把分类当系列用，导致分类极其混乱。现在的规则是：**每篇文章只有一个分类，但可以属于多个系列。**

## 分类

分类是文章的性质，回答"这是一篇什么类型的内容"：

- **资源分享** — 纯粹推荐渠道、应用、信息。比如找书找漫画的网站。
- **观后** — 回忆展柜与同类诱捕器。看完一本书、一部剧后写的东西。
- **教程** — 流程类记录。某个应用的使用教程，某个软件的配置步骤。
- **胡思乱想** — 由某件事或某个物产生的更深层思考，以及思考引起的一系列操作。不一定对，但让 Xnne 自洽。
- **边写边学** — 无营养的探索过程。如果读者实在没找到合适的教程案例，也许能在 Xnne 的摸索中找到想要的东西。

## 系列

系列是文章的主题，回答"这篇在聊什么"。比如 LLM、博客、阅读、观影。一篇讨论博客图谱构建的文章，分类是「胡思乱想」，系列同时属于「LLM」和「博客」。

这个划分源于对以前混乱组织形式的反思。分类收敛了，系列灵活了，两者正交。

# 视觉与交互

## 首页 Banner

![首页 Banner](../../assets/img/covers/blog-rebuild-banner.jpg)

首页首图铺满视口，实际内容下沉，背景图与内容区之间用透明波浪形做过渡。首图区域内顶部导航栏透明，滚轮下滑后才显形。除阅读文章外，导航栏始终跟随。

灵感来源：[NBlog](https://naccl.top/)

::github{repo="Naccl/NBlog"}

NBlog 也是 Xnne 在云服务器时代部署的第一个博客系统。它的首屏视觉冲击力很强，波浪过渡的处理让首图和内容区不会割裂。Xnne 把这个设计语言带到了现在的静态站上。

## 阅读时导航栏隐藏

![阅读时隐藏导航栏](../../assets/img/covers/blog-rebuild-navbar-hidden.jpg)

阅读文章时，顶部导航栏隐藏，把视觉空间完全留给内容。这个细节来自：

[Innei's Blog](https://innei.in/)

阅读场景下导航栏是干扰项，隐藏它能让读者更沉浸。简单但有效。

## 书架

![书架](../../assets/img/covers/blog-rebuild-bookshelf.jpg)

书架页面用于展示看过的书、动漫、电影、游戏等，以封面卡片的形式呈现。

灵感来源：[Lapis' Bookshelf](https://www.lapis.cafe/bookshelf/)

::github{repo="Lapis0x0/VermilionVoid"}

Xnne 很喜欢这种把阅读/观影记录视觉化的方式。比起纯列表，封面墙更有"展柜"的感觉。

## 关联图谱

![关联图谱](../../assets/img/covers/blog-rebuild-graph.jpg)

文章之间的关联以知识图谱的形式可视化，展示文章之间的引用与主题关联。

灵感来源：[Nagi's Blog](https://blog.nagi.fun/sao-blog?lang=zh)

这个博客没有开源，但作者在文章中详细讲解了相关实现思路。Xnne 结合了自己在 [[做过长期系统项目再看：RAG 怪兽是否适用于个人博客系统的图谱构建？]] 中的思考，用 wiki-link 双链关系来构建图谱，而非依赖 RAG 或 embedding。

## 评论区

::github{repo="MrXnneHang/xnnehang.top"}

评论区选用 [giscus](https://giscus.app/)，基于 GitHub Discussions 实现。读者用 GitHub 账号即可评论，所有数据存在 repo 的 Discussion 里，无需后端。

灵感来源：[Menghuan1918's Blog](https://blog.menghuan1918.com/)

Xnne 在对方博客看到这个方案后觉得不错：轻量、零成本、评论即 Issue/Discussion 的管理方式很适合技术博客。后来自己也加上了，并做了自定义主题以匹配博客的蓝色调。

---

以上就是这次重建的主要灵感脉络。感谢这些项目的作者们把自己的实践开源或分享出来，让后来者有迹可循。
