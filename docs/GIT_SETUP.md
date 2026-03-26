# GitHub 保存项目

## 第一次上传

在项目目录执行：

```bash
cd D:\codex\web
git init
git add .
git commit -m "Save working subtitle study site"
```

去 GitHub 新建一个空仓库，例如 `english-study-site`。

然后继续执行：

```bash
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

## 以后更新

```bash
cd D:\codex\web
git add .
git commit -m "update"
git push
```

## 另一台电脑下载

```bash
git clone <你的仓库地址>
cd english-study-site
npm start
```

浏览器打开：

```text
http://localhost:3000
```
