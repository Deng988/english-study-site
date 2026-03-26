# 当前项目结构

当前正在使用的文件：

- `server.js`
- `package.json`
- `.gitignore`
- `README.md`
- `GIT_SETUP.md`
- `index.html`
- `styles.css`
- `app.js`
- `article.html`
- `article.css`
- `article.js`

当前服务端静态目录设置为项目根目录，因此以上页面文件需要保留在根目录。

## 历史实验目录

下面这些目录属于开发过程中的历史版本，当前运行版本不会使用它们：

- `app_public/`
- `app_public_v2/`
- `app_public_v3/`
- `app_public_v4/`
- `app_public_v5/`
- `app_public_v6/`

这些目录已经在 `.gitignore` 中排除，上传 GitHub 时可以不纳入版本控制。

## 推荐提交内容

建议只提交当前生效的根目录版本，这样另一台电脑拉取后最稳定。

## 后续可做的整理

等功能稳定后，再统一迁移到：

```text
web/
  public/
    index.html
    styles.css
    app.js
    article.html
    article.css
    article.js
  server.js
  package.json
  README.md
```

这样结构会更标准，但当前版本先以“稳定可运行”为优先。
