---
title: Obsidian-YOLO 使用初体验
published: 2026-06-18
category: 教程
tags:
  - Obsidian
  - YOLO
  - AI写作
description: 介绍 Obsidian-YOLO 插件的实际使用体验，以及为什么值得推荐。
series:
  - 博客
---

最近在 Obsidian 里写博客写得有点烦。因为换了 Fuwari 博客主题（[[Fuwari 博客主题使用指南]]）后，我的本地写博客语法 -> Fuwari 主题语法需要不少变动。另外，图片的引用也需要处理。我经常写完后就直接把源文件扔了，但是这两天碰到的 YOLO 恰好解决了我的困境。

项目源地址参见:

::github{repo="Lapis0x0/obsidian-yolo"}

好消息，作者是活人，维护很积极，PR 进行速度非常快。
## 如何安装

插件市场里可以直接安装。

![YOLO 插件安装](../../assets/img/obsidian-yolo/pasted_image_20260618130052.png)


至于为什么叫做 YOLO，这个可以看作者博客:[YOLO 开发日志（一）：为什么要开发 YOLO](https://www.lapis.cafe/posts/ai-and-deep-learning/yolo/yolo-releasenote-01/)

## 配置注意事项

### provider 的兼容性问题

这里讲一下 newapi 自定义 provider 的配置坑点。

我是把 deepseek-v4-flash 接入了 NewAPI 然后接入 YOLO 的。中途碰到了:

- newapi 不加 `/v1`，可以获取模型列表，但是其实没有请求到模型本身，会直接返回 200。在 PR 里解决后，会抛出回复为空的提示，并且提示添加 `/v1`。
- 关闭推理时会传入 `"none"`到 `"thinking"`，而我不清楚是 newapi 还是 deepseek-v4-flash 的问题，它会抛出 `"thinking"` 参数列表不包含 `"none"` 的情况。同时，我还从作者的 bot 猫猫那里学了点东西。

![Provider 配置界面](../../assets/img/obsidian-yolo/pasted_image_20260618134726.png)
![Provider 配置界面 2](../../assets/img/obsidian-yolo/pasted_image_20260618135345.png)

没想到猫猫都比我会审查代码。

它提到：不应该用默认推理强度来替代关闭推理。这会造成语义上的问题，如果某个 provider 不支持 `none` 那么应该复用它并实现支持的方式来关闭推理。因为，模型的默认推理强度通常是低或者中，这和我们的语义"关闭推理"是冲突的，猫猫审查的很在理。

另外，如果碰到空回复，可以 Ctrl+Shift+I 看下 console 的输出。以及检查一下 `/v1` 是否加上去了。

> 如果 Ctrl+Shift+I 没有响应，可以试试：前往`设置 -> 外观 -> 高级 -> 窗口框架样式`。设置为"Obsidian 风格"，然后重新启动。重新启动后，您将在左上角看到黑曜石图标。点击它 -> 查看 -> 切换开发者工具

### 工具调用的配置

默认 Agent 里会显示所有工具均已经启用。

![Agent 工具配置](../../assets/img/obsidian-yolo/pasted_image_20260618160903.png)

但是在和 Agent 对话时会发现其实它并不兼容终端 shell 命令的运行。需要在【 Agent-Agents-Default(或者新增的 Agent)】 的工具里面再次启用。

![Agent 工具启用](../../assets/img/obsidian-yolo/pasted_image_20260618161202.png)

同时还得保证运行的命令不在禁止列表里。【Agent-管理工具-终端命令-配置】

![终端命令配置](../../assets/img/obsidian-yolo/pasted_image_20260618161405.png)

以及更推荐给它写个关于 git 的 skill，放在 `YOLO/skills` 当中。
## 功能体验

### 对话侧边栏

![对话侧边栏](../../assets/img/obsidian-yolo/pasted_image_20260618162058.png)

侧边栏输入的状态里似乎包含当前页面的博客，以及所在的行数与片段内容。用起来并没有独立开来的割裂感，反而融合得相当不错，使用起来很丝滑。有时候可以带来灵感，以及可以把 git 同步这些琐事都交给它，避免了仓库懒得手动同步最后数据丢了的情况。

### 快捷呼出对话框

可以用 `/` + `空格`  呼出快捷对话框讲明需求，双手可以不必离开键盘。

![快捷对话框](../../assets/img/obsidian-yolo/pasted_image_20260618163233.png)

这点的设计哲学非常漂亮，因为右手频繁在鼠标和键盘之间切换容易让人思路断开。

### Tab 补全

可以通过 `，`、`。`、`\n`(换行)等符号触发自动补全，符号可自行增删，触发后等待一定时间（可自行配置）后，就可以触发大模型的补全。 

![Tab 补全配置](../../assets/img/obsidian-yolo/pasted_image_20260618163412.png)

但是可能是因为我的思路比较奇怪，通常模型跟不上我的思路。比如我写到一个观点，脑子里已经跳到三层联想之后了，模型还在第一层猜我接下来要说什么。

而且有时候没有回复，下次该开着 Console track 一下。

### 记忆系统

#### Markdown 源记忆文件

![记忆系统界面](../../assets/img/obsidian-yolo/pasted_image_20260618163928.png)

记录的都是用户偏好，整体而言和 mem0 相似。这类记忆记录有一个优点是更容易懂用户的需求，很多东西有时候不必强调就能丝滑完成。但仅仅记录这样的 Memory，不能影响模型本身的回复风格，或者说刻意保持模型的风格是中正的，公平的，平和的，没有个性的。

这类作为辅助而言相当不错，但是其实我还是更喜欢养有个性的猫猫。不过这个可以通过注入个性化 Skill 来进行模拟，插件本身对 Skill 的支持和构建都做得很好。

#### RAG + 向量数据库

这个需要接入 embedding 模型，我暂时没有合适的长期稳定的 api，而且通常模型一旦构建后续就得一直用这个模型（不然维度不一样新旧数据不兼容）。

暂时还没使用。

## 结语

不错的使用体验，至少以往我在写博客时没有体验过这种沉浸式的 Agent 插件。整体而言新鲜感十足。

虽然 Agent 还是跟不上我的脑回路，但至少比我勤快。

> 关于本博客使用的 Fuwari 主题配置和 Markdown 语法，参见 [[Fuwari 博客主题使用指南]]。
