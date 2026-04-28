# dnsPolicy的4种用法
策略名称 | 说明 | 特点 | 适用场景
-- | -- | -- | --
ClusterFirst | 默认策略，优先通过集群的 DNS 解析 Kubernetes 服务域名，无法解析时退回到宿主机的 DNS 设置。 | 优先解析 *.svc.cluster.local 等 Kubernetes 服务域名。 | 普通工作负载，需访问 Kubernetes 服务域名的 Pod。
ClusterFirstWithHostNet | 专为启用 hostNetwork: true 的 Pod 设计，优先解析 Kubernetes 服务域名。 | 与 ClusterFirst 类似，但适用于主机网络场景。 | 使用主机网络但仍需解析 Kubernetes 服务域名的 Pod。
Default | 完全继承宿主机的 DNS 配置，不解析 Kubernetes 服务域名。 | /etc/resolv.conf 与宿主机一致。 | 不需要解析 Kubernetes 服务域名，需与宿主机共享 DNS 配置的场景。
None | 不继承任何 DNS 配置，完全自定义。 | 必须通过 dnsConfig 自定义 nameservers、搜索域等。 | 需要完全隔离或定制 DNS 配置的 Pod，例如使用外部 DNS 服务。

> [!TIP]
> * 如果未指定 dnsPolicy 且未启用 hostNetwork，默认使用 ClusterFirst。
> * 如果启用了 hostNetwork 且未指定 dnsPolicy，默认使用 ClusterFirstWithHostNet。
> * None 策略需要配置 dnsConfig，否则 Pod 将无法解析任何域名。

# 实验
## 环境信息
宿主机/etc/resolv.conf配置
```
search openstack
nameserver 8.8.9.9
```
coredns Corefile配置
```
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . 8.8.8.8 {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
```
### dnsPolicy配置为Default
#### 当`dnsPolicy: Default`时并且配置了`dnsConfig`则会将宿主机与dnsConfig配置2者合起来
* `dnsPolicy: Default`：表示 Pod 会继承宿主机的 DNS 配置。
* `dnsConfig`：允许自定义 DNS 服务器、搜索域和其他选项。
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
      dnsPolicy: Default
      dnsConfig:
        nameservers:
        - 8.8.4.4
        searches:
        - my-custom-domain.local
        options:
        - name: ndots
          value: "2"
```
结果
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-648d746649-wrdp7 cat /etc/resolv.conf
search openstack my-custom-domain.local
nameserver 8.8.9.9
nameserver 8.8.4.4
options ndots:2
```
#### `dnsPolicy: Default`时并且没有`dnsConfig`则值会继承宿主机配置，与宿主机完全一样

### 当配置dnsPolicy为ClusterFirst
* 没有配置dnsConfig
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-68f55d7957-bwgd2 cat /etc/resolv.conf
search test.svc.cluster.local svc.cluster.local cluster.local openstack
nameserver 10.77.0.10
options ndots:5
```
* 配置dnsConfig
```
      dnsConfig:
        nameservers:
        - 8.8.4.4
        searches:
        - my-custom-domain.local
        options:
        - name: ndots
          value: "2"
```
结果
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-5557db4546-lq284  cat /etc/resolv.conf
search test.svc.cluster.local svc.cluster.local cluster.local openstack my-custom-domain.local
nameserver 10.77.0.10
nameserver 8.8.4.4
options ndots:2
```
### 当配置dnsPolicy为ClusterFirstWithHostNet
* 没有配置dnsConfig
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-6b6b56c99b-cvpvd cat /etc/resolv.conf
search test.svc.cluster.local svc.cluster.local cluster.local openstack
nameserver 10.77.0.10
options ndots:5
```
* 配置dnsConfig
```
      dnsConfig:
        nameservers:
        - 8.8.4.4
        searches:
        - my-custom-domain.local
        options:
        - name: ndots
          value: "2"
```
结果
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-ccf8dfdd5-5ddl4 cat /etc/resolv.conf
search test.svc.cluster.local svc.cluster.local cluster.local openstack my-custom-domain.local
nameserver 10.77.0.10
nameserver 8.8.4.4
options ndots:2
```
### dnsPolicy配置为None
当`dnsPolicy: None`时必须配置`dnsConfig`
* `dnsPolicy: None`：表示 Pod 不会继承宿主机的 DNS 配置。
* `dnsConfig`：允许自定义 DNS 服务器、搜索域和其他选项。
```
      dnsPolicy: None
      dnsConfig:
        nameservers:
        - 8.8.4.4
        searches:
        - my-custom-domain.local
        options:
        - name: ndots
          value: "2"
```
结果：
```
[root@master1 ~]# kubectl exec -it -n test nginx-deployment-5cffdcc7b4-wbr2k cat /etc/resolv.conf
search my-custom-domain.local
nameserver 8.8.4.4
options ndots:2
```
