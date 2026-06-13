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
- 新增图片时：
  1. 复制图片到 submodule 对应目录
  2. 在 submodule 内 commit + push
  3. 在主仓库 stage submodule 变更，commit + push

## 博客发布工作流

### 我（Claude）负责的工作

1. **整理博客**：将 Obsidian 源文件整理后放入 `src/content/posts/`
2. **格式优化**：根据需要添加次级标题、`> [!NOTE]` 等 admonition、`**加粗**` 点缀、GitHub 仓库卡片引用、video 外链等
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
category: 胡思乱想
tags:
  - LLM
  - 博客
description: 文章描述
series:
  - LLM
image: ../../assets/img/covers/filename.jpg
---
```

## 支持的 Markdown 特性

- `[[WikiLink]]`：Obsidian 风格的双向链接，插件自动按 title 匹配 slug
- `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]` / `> [!CAUTION]` / `> [!IMPORTANT]`：GitHub 风格 admonition
- `::note[自定义标题]`：也支持 directive 语法
- 代码块自动高亮、行号、折叠
- LaTeX（`$...$` / `$$...$$`）
