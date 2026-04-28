# rpm装的docker，且服务器没有外网
1. 修改/usr/lib/systemd/system/docker.service文件(有的可能不是这个文件。具体根据systemctl cat docker查看) `[Service]`中增加
```
Environment="HTTPS_PROXY=http://<user>:<password>@<domain>:<port>"
Environment="HTTP_PROXY=http://<user>:<password>@<domain>:<port>"
```
2. 配置镜像加速，修改/etc/docker/daemon.json增加
```
"registry-mirrors": ["https://xxxxxx.mirror.aliyuncs.com"]
```
3. 重启服务
```
systemctl daemon-reload
systemctl restart docker
```

# deb装的docker desktop
1. 修改~/.docker/daemon.json增加
```
  "registry-mirrors": [
    "https://tjxyaidd.mirror.aliyuncs.com"
  ],
  "proxies": {
  	"http-proxy": "http://127.0.0.1:7890",
  	"https-proxy": "http://127.0.0.1:7890"
  }

```
2. restart