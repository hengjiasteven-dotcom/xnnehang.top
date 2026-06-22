# nyakku.moe 博客工作指南

## 项目结构

```
nyakku.moe/
├── src/content/posts/   ← 博客文章（.md 文件）
├── src/assets/img/      ← 图片（git submodule → image-hosting 仓库）
│   └── covers/          ← 封面图存放位置
├── src/pages/           ← 页面路由
├── src/config.ts        ← 博客配置
```

## 源文件位置

| 内容 | 路径 |
|------|------|
| 博客源文件（Obsidian 写作） | `D:\lab\XnneHangBlog\obsidan\xnnehang.top.factory\` |
| 封面图源文件 | `D:\lab\XnneHangBlog\cover\` |
| 博客项目文章 | `nyakku.moe/src/content/posts/` |
| 博客图片 (submodule) | `nyakku.moe/src/assets/img/covers/` |

## 图片处理规则

- 图片存放于 `src/assets/img/`，这是一个 **git submodule**（指向 `image-hosting` 仓库）
- 封面图统一放在 `src/assets/img/covers/` 下
- 文章中引用图片使用相对路径：`../../assets/img/covers/filename.jpg`
- 新增图片或修改 submodule 内文件时：
  1. 操作 submodule 内的文件
  2. 先进入 submodule 目录，`git status` 确认有实际改动再 commit + push
  3. 在主仓库 stage submodule 变更，commit + push
- 注意：`nyakku.moe` 和 `obsidan/xnnehang.top.factory` 挂载的是同一个 image-hosting 仓库，submodule 的改动只需在一方提交推送即可，另一方下次 `git submodule update` 后自动同步

## 博客发布工作流

### 我（Claude）负责的工作

1. **整理博客**：将 Obsidian 源文件整理后放入 `src/content/posts/`
2. **格式优化**：根据需要添加次级标题、admonition、加粗点缀、GitHub 仓库卡片、video 外链等
3. **封面图**：从 `cover/` 目录选取图片放入 submodule，并在文章 frontmatter 中添加 `image:` 字段
4. **Commit & Push**：
   - 不涉及代码改动 → 直接 push 到 `master`
   - 涉及代码改动 → 创建新分支，等待用户提 PR

### 红线

- **不允许改动 Obsidian 源文件**（`obsidan/xnnehang.top.factory/` 下的 .md 文件）
- 需要生成样本对比时，在旁边另外生成一个样本文件
- 所有修改只针对 `nyakku.moe/` 项目内的文件

## Frontmatter 格式

```yaml
---
title: 文章标题
published: 2026-06-12
description: 文章简介，显示在首页
image: ../../assets/img/covers/filename.jpg
tags: [LLM, 博客]
category: 胡思乱想
draft: false
series:
  - LLM
---
```

| 属性 | 说明 |
|------|------|
| `title` | 文章标题 |
| `published` | 发布日期 |
| `description` | 文章简介，显示在首页 |
| `image` | 封面图。`http://` = 网络图片；`/` 开头 = `public/` 目录；其余 = 相对 markdown 路径 |
| `tags` | 标签，数组或 `[Tag1, Tag2]` 格式 |
| `category` | 分类 |
| `draft` | `true` 时不会构建到正式站点 |
| `series` | 系列，数组 |

## 支持的 Markdown 特性

### WikiLink（双向链接）

```
[[文章标题]]
```

插件自动按 frontmatter 的 `title` 匹配 slug。标题不存在则在构建时输出警告。

### Admonitions（警示框）

支持两种语法，效果相同。

**Directive 语法（推荐，支持自定义标题）：**

```
:::note
这是默认标题的 note
:::

:::tip
提示内容
:::

:::important
重要内容
:::

:::warning
警告内容
:::

:::caution
危险内容
:::
```

自定义标题：

```
:::note[我的自定义标题]
内容
:::
```

**GitHub 语法：**

```
> [!NOTE]
> 内容

> [!TIP]
> 内容

> [!IMPORTANT]
> 内容

> [!WARNING]
> 内容

> [!CAUTION]
> 内容
```

### GitHub 仓库卡片

```html
::github{repo="owner/repo"}
```

示例：
```
::github{repo="MrXnneHang/xnnehang.top"}
```

页面加载时从 GitHub API 拉取仓库信息，生成动态卡片。

### 视频嵌入

直接粘贴 `<iframe>` 到 markdown 中：

**YouTube：**
```html
<iframe width="100%" height="468" src="https://www.youtube.com/embed/VIDEO_ID" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```

**Bilibili：**
```html
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV_VIDEO_ID&page=1" frameborder="0" allowfullscreen></iframe>
```

### 代码高亮（Expressive Code）

支持语法高亮、终端框、行标记、差异对比、自动换行、可折叠代码、行号等。详见 [Expressive Code 官方文档](https://expressive-code.com/)。

### 数学公式

```
行内公式：$\omega = d\phi / dt$
展示公式：
$$
I = \int \rho R^{2} dV
$$
```

### 表格 / 分割线 / 加粗 / 引用

均为标准 Markdown 语法。

## Claude Code 读取说明

Claude Code **默认读取 `CLAUDE.md`**（项目根目录或 `.claude/CLAUDE.md`），**不会自动读取** `agent.md` 或 `AGENTS.md`。

> 如要让 Claude 自动遵循本指南，请将本文件重命名为 `CLAUDE.md`，或者在 `.claude/CLAUDE.md` 中 `include` 引用本文件。

---

## 碎碎念（Memos）操作说明

### 添加碎碎念

当用户说"加一条碎碎念"或"加到碎碎念里"时：

1. **只改 `src/content/memos/memos.json`**，不要碰其他任何文件
2. **原封不动**把用户说的话复制进 `content` 字段，不要加工、不要解释、不要改格式、不要包装
3. `id` 用当天日期 `YYYY-MM-DD-NN` 格式（如 `2026-06-22-01`），`date` 用当天日期
4. 新增一条记录即可，不要理解内容含义

### 碎碎念内容的性质

碎碎念包含两类内容：

- **日常随想**：用户的零碎想法、吐槽，直接添加即可
- **RoadMap / 构想**：用户描述的未来功能设想、设计思路、规划方案（如 tool call 链展示方式、window mode / pet mode 等）。这些是**记录想法**，不是开发任务。**不要**去实现这些功能，**不要**写代码，**不要**做任何超出添加 memo 字段的事情

### 红线

- 用户说"把这段话加到碎碎念" = 只改 memos.json，不做其他任何事
- 用户谈论未来功能构想 = 只是记录，不是要我写代码
- 如果用户要开发功能，他会明确说"实现""写""改代码"等字眼
