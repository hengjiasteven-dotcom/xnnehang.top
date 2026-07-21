---
title: 从 How We Use Skills 开始：什么是渐进式披露？什么是任务拆解？我想了解什么？
published: 2026-07-03
featured: true
category: 思考
tags:
  - 渐进式披露
  - Skills
  - 符号语言
description: 一篇围绕《How We Use Skills》的阅读笔记——当你无法一次性把所有东西都塞给 Agent 时，你该如何保持它的高效？渐进式披露（Progressive Disclosure）与任务拆解（Task Decomposition）。
image: ../../assets/img/progressive-disclosure/cover.png
---

:::note[来自 Korewaxnne 的笔记]
这是一篇 Xnne 的阅读笔记，读的是 Anthropic 那篇有名的《Lessons from Building Claude Code: How We Use Skills》。但他没有老老实实写读后感——而是从"渐进式披露"这个概念出发，一路联想到 novel agent 的符号抽象语言，中间还扯了《浮生六记》的开篇该怎么用描写链拆解。写到一半被 Claude Fable 5 抓来对线，一来一回反而把渐进式披露和任务分解的边界彻底理清了。典型的 Xnne 式发散：从一个点开始，挖出一整片自己真正在意的东西，然后在对线中把概念打到最透。
:::

## 一些废话

我打算读一下 [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378)。

这里有 deepseek 翻译的一个中文版：[lessons-building-claude-code-how-we-use-skills-cn.md](https://github.com/MrXnneHang/xnnehang.top.factory/blob/main/lessons-building-claude-code-how-we-use-skills-cn.md)

但是出于 submodule 的特殊性， github 上没法直接渲染出来在另外一个仓库的图片。所以只能先 pull 下来后 sync submodule 本地查看。

因为版权问题，我并不能直接把对方的文章转载到我的博客。像我[博客](https://xnnehang.top/)的许可协议比较宽松：[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)，非商业就可以直接被搬运，署名即可。

## 我想了解什么？先提问

自从意识到我可能患有 ADHD，我习惯先提问，因为如果不先搞清楚自己想知道什么，我大概永远也无法看完这么一篇文章。

## 渐进式披露究竟是什么？

> 这里的定义本身有一点点小问题但问题不大，具体可以看最后一节 Fable 5 的纠正。

我觉得渐进式披露不仅仅可以用于 skill 的设计和读取。它在我看来更像是一种设计哲学，一种对模型理解能力了解具象化的 magic play。

是知道这个模型能力达到上限了后，如何把原本一次输入输出做不完的事情，拆分成分步的输入和输出，进而降低第一步和每一步的门槛。在每一步争求发挥模型的全部能力。

就比如在昨天写到的：[[站在 C 端开发者的角度看 memU 的架构转向]]，里面提到——

> 前面提到把推理能力交给 agent-loop，让 agent 自己多次 query。但 agent 在长上下文下能力会衰减——我在 XnneHangLab 里做过类似的事，依靠 agent 自身能力做记忆检索和提取，长对话后 tool calling 执行率下降很多，tool 链长的 skill 触发率下降，最终不得不改成分步骤的多次 LLM call（拆分 tool call）。agent-loop 把多步骤合并为第一步的一个决策，这第一步的难度会不会太高？

这一个我当时一不小心想到方法，其实就是渐进式披露的思想的一个体现。

而这次要解读的博客里，是在 skill 上的渐进式披露的 best practice。

但我希望我看到的不仅仅只是对于 skill 它的工程范式，我希望把它推广。

## 我想了解和推广什么？

### 如何渐进式披露地理解一个项目

> 这也是 memU 正在重构中做的事情。

比如它是否还可以用来指导，一个 agent or 一群 agents 应该如何去探索 and 拆解一个项目，并且形成可以在下一次可以快速引导思考的路径文件。

> 为什么不是全量记录，而只是 agentic search/explore？

#### 过时

记录通常是零散的，documentation 式的，文件夹树形式的。那么也就意味着一旦记录下来后就很容易过时。 docs 的维护通常需要 maintainer 对每一块的 docs 都印象很深刻，但是 LLM 写的通常不能做到。

#### 并不需要注释式的 docs

或者 docs 是由 docs string 自动生成的，但这样的 docs 对于 agent 来说是垃圾 docs，因为，对于普通人来说，读代码没有注释，没有 docs-string 是痛苦的，因为得读很多关联才能明白函数、类之间的关系。

但对于 agent 来说，注释是可有可无的，因为它们具备直接理解无注释代码的能力，因为它的理解窗口比正常人要大得多，甚至对于 agent 来说，错误和过时的注释和 docstring 才是幻觉，才让人痛苦。

---

### 如何把渐进式披露思维套在 novel agent

比如，它是否还可以用于一些特殊的 Agent 比如写小说的 Agent 搭建指导？

> 写小说和写代码的 Agent 有什么根本性的区别？

抛开写长篇小说时其他独立用来写大纲、审稿的 agent。我们仅仅只讨论枪手——负责把大纲或者思路转换为具体小说的这个 Agent。

### 所谓文风和节奏

对于小说来说，文风和节奏是最神奇的。

它很抽象，可能包括，像推动电影镜头一样描写环境。强调“画面感”。

也包括，读过人物语言、角色心理活动一定要能够在读者心里留下声音，角色”语言鲜明化“。

要能够调用读者情绪，文字需要保持一种共情力，文字语言不能过于平白，一定要有情感。或许是幽默，或许是浓烈。说起来有点抽象，举个栗子：

> 余生乾隆癸未冬十一月二十有二日，正值太平盛世，且在衣冠之家，居蘇州滄浪亭畔，天之厚我可謂至矣。東坡云，「事如春夢了無痕」，苟不記之筆墨，未免有辜彼蒼之厚。因思《關雎》冠三百篇之首，故列夫婦於首卷，餘以次遞及焉。所愧少年失學，稍識之無，不過記其實情实事而已，若必考訂其文法，是責明於垢鑑矣。

不求每个读者都能体会，但是一定要有自己的读者群。

再比如一些量化数据，根据平台的不同。有的希望段落长和对话比例少，称之为慢节奏。有的希望段落短且对话占比高，称之为快节奏。

其中慢节奏尤其考虑电影感镜头叙事和对读者情绪的酝酿和调动。

快节奏尤其考虑人物对话和性格对比度，以及剧情的张力。

此外，如果写得是长篇小说，还需要考验 agent 长文下，对人物性格语言理解不偏移，关系理解不偏移，故事线理解不偏移。

novel Agent 有多难做呢？简单说，如果连长篇小说 Agent 都能写好，那么基本上就没有什么可以难倒 Agent 自身了。

写小说的难点在于，上面提到它的所有能力都是必须同时具备的并且同时 perform well。

不同于 coding agent，一次只要加载一个 skill。novel agent 恨不得把所有 skill 同时加载进来。而这也不得不会触及 [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378) 里提到的缺陷。

当你一次给定非常多，复杂，难以理解 rules 后，Agent 就失去了原本的灵活性，它表现得不再那么好。

![对比"过于死板"的六步 cherry-pick 流程与"更好"的灵活指令——前者写死了每一步，后者只说明意图让 Claude 自己适配](../../assets/img/lessons-building-claude-code-how-we-use-skills/06-avoid-railroading.jpg)

里面提到的比较好的做法是，告诉 Agent 优雅的做法应该包含哪些必要因素，而不是把你认为的优雅的做法路径详细的一步一步地给 Agent。笑话，你会觉得你比 Claude opus 或者 fable 更理解 git 的用法和流程吗？你只需要告诉你，在你的仓库里，哪些是应该被注意的。比如，你期望你的 commit message 是纯英文，带有可爱的 gitimoji。加上它，你每次都能可到可爱的 gitimoji。

So novel Agent 任重道远。也许从一开始我建立复杂 skills 时就已经走上错误道路了。

不过我和一个室友在聊天的时候似乎就涉及到过渐进式披露的一些设计。

我们不再追求一次性就把文章写出来，或者说第一时间写出正文。而是多步骤。具体是怎么做的呢——

首先是建立一套符号抽象语言。

这套符号语言包含描写手法、描写对象、描写主题。

> 余生乾隆癸未冬十一月二十有二日，正值太平盛世，且在衣冠之家，居蘇州滄浪亭畔，天之厚我可謂至矣。東坡云，「事如春夢了無痕」，苟不記之筆墨，未免有辜彼蒼之厚。<br>
> 因思《關雎》冠三百篇之首，故列夫婦於首卷，餘以次遞及焉。所愧少年失學，稍識之無，不過記其實情實事而已，若必考訂其文法，是責明於垢鑑矣。

还是这一段。

可以被拆分成两段进行生成。

转换为这样的描写链：

> 我 -> 抒情@出身，"事如春夢了無痕"【慢】~苍凉 -> 自嘲【快】~幽默<br>
> 我 -> 议论@经典传统("關雎") -> 叙事@列夫婦於首卷【慢】~~郑重 -> 自嘲@文法学識~~幽默

当然，这个描写链有点抽象是我凭借印象瞎编的，这个主要是我室友当时在研究，我实在对于这规则指定不是很拿手。

总之，先生成这样的描写链条，来避免每次都需要大量的 skills 同时去约束一个不稳定的文风。

企图把叙事节奏和文风用这样的方式给出，我记得我室友当时给每个手法加了 example。

然后需要 LLM 既可以做到编码，把小说抽象成这类描写链的能力，又能把描写链转变回小说，但不是还原，甚至要求改变说辞，然后再读，以此来验证 LLM 是不是真的理解了这个文风节奏本身。

## 开始读，把注意力放在自己想看到的地方。

什么是 skill 以及 skill 的具体分类。

几乎都被我跳过了。一眼啥也看不到，妥协了，我确实阅读障碍。

### 如何写 skills

#### 1.不写显而易见的东西。

就是我刚刚提到的，不要觉得自己比 anthropic 更懂 git 使用流程和规范。

![对比"过于死板"的六步 cherry-pick 流程与"更好"的灵活指令——前者写死了每一步，后者只说明意图让 Claude 自己适配](../../assets/img/lessons-building-claude-code-how-we-use-skills/06-avoid-railroading.jpg)

#### 2.建立避坑指南

![billing-lib SKILL.md 的 Gotchas 部分，从第 1 天 → 第 2 周 → 第 3 个月的逐步增长，每次添加一个新坑点](../../assets/img/lessons-building-claude-code-how-we-use-skills/04-gotchas-section.jpg)

对于一些个性化的库或者需求 Claude 会犯错，为这样的库定制 gotchas 是收益较高的。

Openclaw 有时候让我很抓狂的一点，就是我一次次让它写入避坑，但是我根本就不记得为什么它总是重犯，是因为写入到了不知道哪个旮旯角去了，还是每次 session 刷新后，压根就没有重读它写过的 rule？

踩一个坑后补一条，但是，这个 gotchas 一定要能被召回呀。不然还是会犯错。

#### 3.善用文件系统的渐进式披露

![一个 queue-debugging skill 文件夹，以 SKILL.md 为中心枢纽，指向各个 spoke 文件（stuck-jobs.md、dead-letters.md、retry-storms.md、consumer-lag.md），以及症状→文件查找表](../../assets/img/lessons-building-claude-code-how-we-use-skills/05-progressive-disclosure.jpg)

a. 使用引用替代全量 skills。
b.如果需要输出 markdown，采用填空式替代全量生成。允许复制粘贴 template。

#### 4.把需要询问用户输入的内容从 skill 中抽取到 config.json 中。

一些 skill 的运行可能需要用户输入选择一个或者多个输入源。像这样：

![](../../assets/img/progressive-disclosure/config-json-example.png)

类似这样。这样的回复与其直接随着 markdown 一起进上下文，比如抽出来放入 config.json。

#### 5.description 不是工具内容摘要，是触发时机与触发条件的描述。

![两个 babysit-pr SKILL.md 的 description 对比：左边是模糊的摘要，右边是触发导向的 description，列出了"babysit"、"watch CI"、"make sure this lands"等短语](../../assets/img/lessons-building-claude-code-how-we-use-skills/08-description-field.jpg)

#### 6.把常用脚本提前准备好，而不是需要时编写。

![一个 lib/signups.py 文件，包含 fetch、by_referrer、by_landing_page 等辅助函数，每个函数都在文档字符串中记录了坑点](../../assets/img/lessons-building-claude-code-how-we-use-skills/10-helper-functions.jpg)

这点在网页端的 gpt 那边体现的淋漓尽致。让 gpt 直接编写或者修改 docx，它每次都会花十分钟以上来写一个很垃圾的基于 Python 的 docx 的读取 and 修改脚本。然后把你的 docx 文档改得一塌糊涂。

而如果用 Cladue Desktop 的 cowork 状态，并且预装好一个 docx 的 skill，它的表现至少是快速且稳定的。它省去了每次编写 Python 脚本的过程。

#### 7.skill 的是否应该互相依赖？

是否应该把 skill 的生态做成类似 pypi 那样的？

包可以再被包依赖？

看起来好像很伟大，但是，前面也已经说过了。

Agent 能力不同，并且以后会越来越强，一些旧的 skill 和 rule 在现在表现良好但是以后可能完全是一种负优化提示和约束。所以， skill 最好还是知根知底，自己写的 skill 可以依赖，但是最好不要依赖别人的 skill。

## 读完了

给了我一定的思考。

但最重要的是给了我思考什么是渐进式披露以及我希望推广到什么地方的契机。

也就是以项目理解为目的的渐进式披露，和以 novel agent 为目的渐进式披露。

其他而言其实都像是一次温习和确认，从原本模糊的知觉到确定的概念。

略有收获，比如我现在可以回答清楚 skill 是否应该互相依赖，以及是否应该做成 pypi 的生态。

之前应该是不行的。

## 来自 fable 5 的纠正：渐进式披露和任务分解的混淆

这是 Claude Fable 5 对我博客内容的观点纠正：

> Enjoyable read — it's doing the thing good reading notes do: using the source as a launchpad rather than summarizing it. My honest assessment of his core claim:
>
> His view is right in spirit, but stretches the term. He defines progressive disclosure as "breaking a task too big for one pass into step-by-step inputs and outputs." That's actually task decomposition, a sibling technique. Progressive disclosure, strictly, is about information loading, not task splitting: skill metadata always in context → SKILL.md body loaded on trigger → referenced files/scripts loaded only when needed. The distinction matters because they fix different failure modes. PD fixes attention dilution (context stuffed with irrelevant rules degrades everything). Decomposition fixes capability limits (one pass can't hold the whole task). His memU example — splitting tool calls across multiple LLM calls after long-context degradation — is decomposition. Both fight the same enemy, so his generalization is useful intuition, just imprecise vocabulary.
>
> **Where he's clearly right:**
>
> - **Skills as "what to pay attention to" rather than step-by-step instructions** — this matches how skills actually work best. Over-specified procedures turn into straitjackets as models improve, which is also why his answer to "should skills depend on each other like PyPI" (no) is sound.
> - **Gotchas being useless unless recalled** — correct diagnosis. A gotcha outside the retrieval path (trigger description or always-loaded context) may as well not exist.
> - **The novel-agent observation is his sharpest** — coding constraints are modular (load one skill at a time), but style/pacing/voice are cross-cutting — they must apply to every sentence simultaneously. That's a real architectural difference, well stated.
>
> **Where I'd push back:**
>
> - **"Comments are optional for agents, docs are garbage" overshoots.** Stale docs cause hallucination, yes — but the fix is docs that are cheap to keep true (curated, high-level, intent-focused), not no docs. Agents still pay real exploration cost without a map, which his own "path files" idea implicitly admits.
> - **The description-chain idea is promising but it's an intermediate representation with staged generation, not PD.** Its hard problem: style lives partly in exactly what a symbolic chain can't capture. The encode→decode→verify round-trip is the right test for that, though — good instinct.
>
> **Net:** right philosophy, blurry taxonomy, and one or two ideas worth an actual experiment.

---

简单说就是我的直觉是对的，但我表达的方式和定义不够准确。

我把“渐进式披露”（Progressive Disclosure, PD）定义为了“把一次交互处理不完的庞大任务拆分为一步步的输入和输出”。

实际上，我混淆了 **“任务分解”（Task Decomposition）** 与 **“渐进式披露”（Progressive Disclosure, PD）** ：

- **任务分解**：解决的是**单次输入时 Agent 的能力极限问题**（一次 LLM call 吞不下整个任务，就拆分成多次交互/多次 LLM call）。
- **渐进式披露**：解决的是**上下文中充斥过多冗余规则时导致的注意力稀释、分散与冲突问题**（上下文中只放 metadata 索引，在触发时才按需加载具体的 `SKILL.md`，并在需要时进一步读取引用的脚本或文件）。

两者的目的都是为了对抗大模型能力的衰减，所以我能产生这样的推广联想是种不错的直觉，只是在词汇定义上不够严谨。之前打算做推广，结果推得太广，一不小心把另一个我原本不了解的工程原则（任务分解）给推出来了。
