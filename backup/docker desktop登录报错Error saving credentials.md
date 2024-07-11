报错内容具体为：
```
$ docker login harbor.xxx.com/docker.io/timberio/vector:0.39.0-alpine-arm64
Username: admin
Password: 
Error saving credentials: error storing credentials - err: exit status 1, out: `error getting credentials - err: exit status 1, out: `no usernames for harbor.xxx.com``
```
解决方案：修改~/.docker/config.json删除`"credsStore": "desktop",`，然后重新启动