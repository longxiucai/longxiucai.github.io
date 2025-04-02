kubeadm有参数containerLogMaxSize（默认10M） containerLogMaxFiles(默认5)

containerd本身没有管理容器日志分割与限制大小的功能，kubelet有参数`--container-log-max-files=5 --container-log-max-size=100Mi`与配置`"containerLogMaxSize": "100Mi","containerLogMaxFiles": 5`，验证kubelet对日志控制的功能，默认为400M 4个备份，压缩之后30M，不存在空间爆满的情况。

docker自己有参数配置

![Image](https://github.com/user-attachments/assets/534eecf6-92c8-4cd8-a3bb-de6bff473e13)