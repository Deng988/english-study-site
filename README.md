# English Study Lab

一个本地可运行的英语学习网站 MVP。

## 功能

- 粘贴 YouTube/SRT 字幕文本
- 自动清洗时间戳、序号、重复行
- 右侧输出：
  - 全文翻译
  - 复杂单词
  - 语法重点
  - 难句拆解
  - 学习总结

## 本地启动

要求：Node.js 18+

```bash
npm start
```

浏览器打开：

```bash
http://localhost:3000
```

## 可选：接入真实 AI 分析

设置环境变量后，服务端会优先调用模型接口：

```bash
set OPENAI_API_KEY=你的key
npm start
```

可选模型：

```bash
set OPENAI_MODEL=gpt-4.1-mini
```

没有配置 key 时，会自动使用本地兜底分析逻辑，便于先把页面和流程跑通。
