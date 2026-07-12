---
title: 关于毕业后再学 TF-IDF 这档事
published: 2026-07-12
category: 边写边学
tags:
  - TF-IDF
  - NLP
  - 信息检索
description: 用我自己的白话来讲一遍 TF-IDF。从 term 与分词开始，到 TF、IDF、查询打分、BM25，再到博客里推荐相关文章的实践。也算是还了一下没听 NLP 老师课的债，有需要再学果然更容易看进去。
featured: true
---
![](<../../assets/img/about-comeback-learn-tfidf/Pasted image 20260712225849.png>)

> [!NOTE]
> **AI 协作声明：** 本文由 Xnne 撰写，[Korewaxnne](https://github.com/xnne-bot)（AI 助手）协助了结构组织和语法润色。

<iframe src="https://player.bilibili.com/player.html?bvid=BV1XT421Q7fw" width="100%" height="500" frameborder="0" allowfullscreen="true"></iframe>

:::note
NLP 的知识几乎全都还给老师了，除了当时聊 Lost in the Middle 的部分。那是老师让我们自己找一篇论文 or something 然后自己尝试把它讲清楚。并且他还会对我们讲的进行提问，可以说那一次经历对后续我影响很深，把一个东西理解到什么程度可以讲明白并且应对提问？如何在过度求原主义和停留表面之间找到一个合适的度。郭老师恩情还不完 =-=。
:::

一样的，费曼学习法开场。用我自己的白话来讲一遍 TF-IDF。不会涉及更多数学原理。

如果希望看系统详细的讲解可以看那个视频，讲得很不错。

## TF-IDF

### Term 与分词

TF，Term Frequency。

Term 可以简单理解为 word，对英文来说 term = word。而在中文里，term 和 word 似乎有细微的区别，想了解可以自己查，主要是关于停用词归属的。

比如这里我们用 jieba 分词：

```shell
毕业后我搬回了老家。
```

分词后：

```shell
毕业|后|我|搬回|了|老家
```

假设，我们一开始把所有内容都视为 term。

我们可以很简单地 count 出来每个文档块内的所有 term 的频率。

我们会发现，`了`、`的`、`是` 这些停用词的频率会非常高。

但这些词几乎每篇文章都有，对于我们的计算来说会是一种干扰，没有任何的帮助。所以， TF-IDF 通常直接做了一件事情。

它把分词后的 term 变成了这样：

```shell
毕业|我|搬回|老家
```

这样清洗后似乎更简洁了而且还不影响原意，还减少计算量。

但需要先确认的一点是，在 TF-IDF 的视角里，是没有语义这个东西的，在它的视角里，不管是一句话，还是一篇文章，都只是 term 的集合罢了。

它不关心谁毕业，也不关心谁搬回老家。它只在意：毕业、搬回（搬家）、老家。这些词是离散的，顺序无关的。

接下来看为什么它这么狂，反而它的原理其实很容易理解。

留下来的这些 term 可以反馈一些东西。

### TF：词频

一篇文章里，一个 term 出现的次数越多，说明这篇文章和这个 term 越相关，这就是 **Term Frequency**。

TF 反馈了这篇文章与这个 term 的关联度。比如 `深度学习框架` 在某篇文章的 TF 最高，说明这篇文章主要讨论深度学习框架相关的东西。

### IDF：逆文档频率

然后看这样一个案例。

当我们的知识库里都是关于深度学习框架的文章时，几乎每篇文章都提到了不少频率的深度学习框架。

这个时候，如果我们要在这批文章召回某些特定的东西，它是否还具有参考价值？

说直白就是，当一个 term 在所有文章里面都出现了接近的频率，它在这批文章里的参考价值是不是就变得和停用词一样没有参考价值了？

但是我们要如何做清洗？或者说直接清洗会不会太暴力了？有没有更好的做法？

有的，反而很简单，我们可以给每个 term 加一个权重，当这个 term 在这批文章里出现的很频繁，那么就降低它的权重。反之，只在特定的一部分文章里出现，就提高它的权重。这个权重叫做 IDF—— **Inverse Document Frequency**，反映的是 term 的价值。

term 的 IDF 具有相对性，一篇深度学习文章混在情感杂谈的文章里，那么深度学习的相关术语就是它最好的 term，但如果被淹没在深度学习文章里，那么如何发掘并给 term 的价值排序就是 IDF 做的事情。

### 查询打分

TF-IDF 在具体的查询中如何使用。

它通常需要一个 query。

比如:

```shell
我最后一次修改 XnneHangLab 是什么时候？
```

同样会被切割为 term 并清洗停用词——

```shell
最后 | 一次 | 修改 | XnneHangLab | 什么时候
```

之后它会计算 TF-IDF 分数，它其实是一个求和的过程。

它求的是，**每个文档对 query 里的每个 term** 分别算 TF × IDF，然后**求和**：

$$Score = TF_1 \times IDF_1 + TF_2 \times IDF_2 + ... \text{(长度为 len(query))}$$

然后分数最高的说明这个文档和这个 query 最相关，直接返回。这里就不扯那些具体归一化的操作了。

---

如果写得比较专业就是：

$$
\text{Score}(D, Q) = \sum_{t \in Q} \text{TF}(t, D) \times \text{IDF}(t)
$$

- $t$ = query 里的一个 term
- $Q$ = query 的 term 集合
- $D$ = 文档库里的一个文档
- $\sum$ = 对 query 里的所有 term 求和

### 用 TF-IDF 推荐相关文章

https://xnnehang.top/

我的博客里就有用 TF-IDF 来推荐相关文章的。

现在其实原理就很简单了，只要把文章同样转成 term，然后和其他所有文章进行一次计算就行。

复杂度是 $O(N \times |len(BlogTerms|^2)$ ，也就是 $n^2$，复杂度不高。

### BM25 和 TF-IDF 的关系

它是 TF-IDF 的变种，思想上没啥变化，数学上变化挺大的，归一化啊啥的。但是我们并不关心，把它当成更准确一点的 TF-IDF 来看就行了。

### 局限性

我们分析过程中已经说得很清楚了，只能看到词，看不到语义，看不到顺序。

但是别说，它用来推荐相关文章时还挺准的 =-=。

数学的魅力这一块。

## tokenize 的变化

我理解在有 embedding 后， tokenize 就分词->向量化。

但是我好奇， tokenize 本身是否包含分词的过程。 or 特指从 term -> embedding 的过程？

and，embedding 的 tokenize 过程和 embedding 出来以前的 tokenize 的有什么不同？

> [!NOTE] Korewaxnne
> 
> 先把管线顺序理清楚：
> 
> ```
> 原始文本 → **tokenize（分词）** → 转 ID → embedding lookup → 向量
> ```
> 
> tokenize **只负责第一步**：把文本切成 tokens。从 term 到向量是后面的 embedding lookup 干的，不要混在一起。
> 
> ---
> 
> **① tokenize 本身是否包含分词？**
> 
> 包含。对于中文来说，tokenize 的核心工作就是分词。
> 
> 但你说的「从 term → embedding」那不是 tokenize，是 embedding lookup，两个不同的步骤。
> 
> ---
> 
> **② embedding 前后的 tokenize 有什么不同？**
> 
> | | TF-IDF 时代的 tokenize | embedding 时代的 tokenize |
> |---|---|---|
> | 粒度 | 整词（word-level） | 子词（subword），如 BPE / WordPiece |
> | 停用词 | 需要手动去掉（`了`、`的`） | **不需要去**——模型自己学会它们的用处 |
> | OOV（未登录词） | 遇到没见过的词直接死掉 | 切成子词也能表示，如 `Transformer`→`Trans`+`##former` |
> | 输出 | 一个词对应一个离散 ID | 一个词可能对应多个 subword ID |
> | 词典大小 | 几万到几十万个词 | **固定**，如 BERT 约 3 万个子词 |
> 
> 最核心的区别是**粒度**。以前是整词切，现在会把词再切碎。因为「毕业」出现 1000 次，「毕业典礼」只出现 5 次。用子词切分，模型看到「毕业典礼」能复用「毕业」学到的特征。
