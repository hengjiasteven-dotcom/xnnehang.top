---
title: Fuwari 博客主题使用指南
published: 2024-07-01
category: 教程
tags:
  - Fuwari
  - Blogging
  - 教程
description: 本博客基于 Fuwari 主题搭建。这篇指南涵盖 Front-matter 配置、Markdown
  语法、扩展功能（GitHub 卡片、Admonitions）、代码高亮及视频嵌入。
series:
  - 博客
---

本博客基于 **Fuwari** 主题搭建，使用 Astro 框架。对于文中未提及的部分，你可以在 [Astro 官方文档](https://docs.astro.build/) 中找到答案。

## Front-matter of Posts（文章头部信息）

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| 属性 | 说明 |
|---|---|
| `title` | 文章标题 |
| `published` | 文章发布日期 |
| `description` | 文章简介，显示在首页 |
| `image` | 封面图片路径。以 `http://` 或 `https://` 开头：使用网络图片；以 `/` 开头：使用 `public` 目录下的图片；均不符合：相对于 markdown 文件的路径 |
| `tags` | 文章标签 |
| `category` | 文章分类 |
| `draft` | 是否为草稿，草稿不会在正式构建中显示 |

## Where to Place the Post Files（文章文件位置）

文章文件应放在 `src/content/posts/` 目录下。你也可以创建子目录来更好地组织文章与资源：

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```


## Markdown Example（Markdown 示例）

### 表格

| 尺寸 | 材质 | 颜色 |
|---|---|---|
| 9 | 皮革 | 棕色 |
| 10 | 麻布 | 自然色 |
| 11 | 玻璃 | 透明 |

```
| 尺寸 | 材质 | 颜色 |
|---|---|---|
| 9 | 皮革 | 棕色 |
| 10 | 麻布 | 自然色 |
| 11 | 玻璃 | 透明 |
```

### 分割线

---

```
---
```

### 行内公式

行内数学公式：$\omega = d\phi / dt$

```
行内数学公式：$\omega = d\phi / dt$
```

### 公式展示

$$
I = \int \rho R^{2} dV
$$

```
$$
I = \int \rho R^{2} dV
$$
```

## GitHub Repository Cards（GitHub 仓库卡片）

你可以添加动态卡片来链接 GitHub 仓库，页面加载时会从 GitHub API 拉取仓库信息。

::github{repo="saicaca/fuwari"}

使用 `::github{repo="<owner>/<repo>"}` 代码创建 GitHub 仓库卡片。

```
::github{repo="saicaca/fuwari"}
```

## Admonitions（警示框）

支持以下类型的警示框：`note` `tip` `important` `warning` `caution`

:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::

:::important
Crucial information necessary for users to succeed.
:::

:::warning
Critical content demanding immediate user attention due to potential risks.
:::

:::caution
Negative potential consequences of an action.
:::

### Basic Syntax（基本语法）

```
:::note
Highlights information that users should take into account, even when skimming.
:::
:::tip
Optional information to help a user be more successful.
:::
```

### Custom Titles（自定义标题）

可以为警示框设置自定义标题。

:::note[我的自定义标题]
This is a note with a custom title.
:::

```
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub Syntax（GitHub 语法）

> [!TIP]
> The GitHub syntax is also supported.

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```


## Expressive Code（代码高亮）

Expressive Code 提供了语法高亮、终端框、行标记、差异对比、自动换行、可折叠代码、行号等多种功能。完整用法请参考 [Expressive Code 官方文档](https://expressive-code.com/)。

## Include Video in the Posts（视频嵌入）

直接复制 YouTube 或其他平台的嵌入代码，粘贴到 markdown 文件中即可。

```
---
title: Include Video in the Post
published: 2023-10-19
// ...
---
<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```

### YouTube

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>

### Bilibili

<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1yRdBBsEGZ&page=1" frameborder="0" allowfullscreen></iframe>
