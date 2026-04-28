Hugo官方主页：https://gohugo.io/
Hugo二进制下载地址：https://github.com/spf13/hugo/releases

1、下载之后执行下面命令会在当前目录创建test文件夹
```
hugo new site test
```
2、进入生成的文件夹内会有如下文件与文件夹
```
archetypes  assets  content  data  hugo.toml  i18n  layouts  public  static  themes
```
3、创建文章，如下命令会在content目录创建test.md文件并且在文件首部增加一些信息
```
hugo new test.md
```
4、查看test.md，可以自己在里面补充内容
```
+++
title = 'Test'
date = 2024-07-26T14:37:18+08:00
draft = true
+++
```
5、自己手动编创建文章，直接在content目录中编写Markdown文件并且开头增加下面的内容即可
```
+++
title = 'XXXXXX'
date = 2024-07-26T14:37:18+08:00
draft = true
+++
```
6、需要在themes目录中添加皮肤，更多皮肤见https://github.com/gohugoio/hugoThemes
```
cd themes
git clone https://github.com/spf13/hyde.git
```
7、运行站点
```
hugo server --theme=hyde --buildDrafts --watch
```