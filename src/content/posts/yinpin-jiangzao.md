---
title: 音频降噪
published: 2024-06-24
category: 技术
tags:
  - 音频
  - 降噪
  - NVIDIA
  - 教程
description: 音频降噪的两种方案：UVR处理音乐噪音，NVIDIA BroadCast处理日常噪音
---

# 音频降噪

分为两种:

## 1.纯音乐的背景音，或者各种和乐器有关的背景音。

可用: UVR，MDX

出更新的版本了:

[【MDX23一键包】2.4版本更新，BS-Roformer加入！](https://www.bilibili.com/video/BV1oJ4m1V7xV/)

我暂时本地没有，等有了我再进行一个补充。

## 2.日常生活中的噪音，键盘敲击，倒水,雨声,等等非乐器。

NVIDIA BroadCast(麦克风降噪),同系的SDK，可调用。

先贴一下原址:[【教程】如何优雅的批量消除素材中常见疑难噪音，就比方说那万恶的键盘音是吧](https://www.bilibili.com/video/BV15N4y1z7qZ/)

### 需要的文件:

**SDK插件:**

[你可以理解为支持音频批处理的BroadCast，模型和BroadCast应该是一样的](https://www.nvidia.com/en-us/geforce/broadcasting/broadcast-sdk/resources/)

**载体:**

链接：https://pan.baidu.com/s/1Vk2MYcDfSwV-tMRpD1zbAw?pwd=myo4 
提取码：myo4 
你当然可以在原址中获取也是百度网盘，我只是转存，方便自己重新下。如果你有碰到解压密码，可能也是原址的，领航员未鸟或者linghangyuanweiniao。

**使用方法:**

Foobar2000直接解压后即可。建议将exe设置成管理员身份运行。

VST3的插件放在这里:

C:\Program Files\Common Files\VST3\

如果是第一次添加插件，则需要手动创建VST3文件夹。

![Snipaste_2024-06-24_20-49-20](../../assets/img/yinpin-jiangzao/202406242058972.jpeg)

添加完后重启Foobar即可。

![Snipaste_2024-06-24_20-38-24](../../assets/img/yinpin-jiangzao/202406242058356.jpeg)

插件配置

![Snipaste_2024-06-24_20-42-59](../../assets/img/yinpin-jiangzao/202406242045894.jpeg)

下拉DSP插件，点击配置。

双击NVIDIA的VST插件:

![Snipaste_2024-06-24_20-43-37](../../assets/img/yinpin-jiangzao/202406242059778.jpeg)

等待一下，如果load成功的话，应该会有:

![Snipaste_2024-06-24_20-44-31](../../assets/img/yinpin-jiangzao/202406242059994.jpeg)

你可以调整开关和降噪强度，越强，损音质越大，根据需求调整。
