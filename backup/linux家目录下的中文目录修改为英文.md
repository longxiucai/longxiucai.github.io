1. 将这些目录修改为英文名，如：  mv 桌面 Desktop 

2. 修改配置文件`~/.config/user-dirs.dirs`，将对应的路径改为英文名（要和1中修改的英文名对应）

配置文件修改后的内容如下：
```
XDG_DESKTOP_DIR="$HOME/Desktop"
XDG_DOWNLOAD_DIR="$HOME/Download"
XDG_TEMPLATES_DIR="$HOME/Template"
XDG_PUBLICSHARE_DIR="$HOME/Public"
XDG_DOCUMENTS_DIR="$HOME/Document"
XDG_MUSIC_DIR="$HOME/Music"
XDG_PICTURES_DIR="$HOME/Picture"
XDG_VIDEOS_DIR="$HOME/Video"
```