calico参考：https://docs.tigera.io/calico/latest/networking/ipam/ipv6#enable-dual-stack
k8s参考：https://kubernetes.io/docs/concepts/services-networking/dual-stack/#configure-ipv4-ipv6-dual-stack

# 先决条件
1. 内核参数`net.ipv6.conf.all.forwarding`需要设置为1
2. 集群节点之间ipv6需要连通
3. Kubernetes 1.20 版本或更高版本
4. 支持双协议栈的[网络插件](https://kubernetes.io/zh-cn/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)。

# 节点配置
一台物理机上3虚机，3虚机桥接到同一个bridge，不需要配置网关
| 节点 | ipv4  | ipv6 |
| :------------: |:---------------:| :-----:|
| master1  | 172.20.41.42/21 | 2001:db8::1/64 |
| master2  | 172.20.41.43/21 | 2001:db8::2/64 |
| master3  | 172.20.41.44/21 | 2001:db8::3/64 |

节点之间`ping6 [ipv6]`互通

# k8s配置
格式为`--service-cluster-ip-range=<IPv4 CIDR>,<IPv6 CIDR>`，后面接`,`再接ipv6的cidr即可
service-cluster-ip-range的ipv6配置为fd00::/108
cluster-cidr的ipv6配置为fc00::/48
## kube-apiserver
全部master节点修改配置文件/etc/kubernetes/manifests/kube-apiserver.yaml
```
--service-cluster-ip-range=10.77.0.0/22,fd00::/108
```
## kube-controller-manager
全部master节点修改配置文件/etc/kubernetes/manifests/kube-controller-manager.yaml
```
--cluster-cidr=10.119.0.0/22,fc00::/48
--service-cluster-ip-range=10.77.0.0/22,fd00::/108
```
## kube-proxy
任意master执行命令`kubectl edit cm -n kube-system kube-proxy`
```
clusterCIDR: 10.119.0.0/22,fc00::/48
```
## kubelet
1. 修改kubelet的启动命令，不同环境可能不同，根据kubelet.service配置来实际修改。本文测试环境修改/var/lib/kubelet/kubeadm-flags.env后面增加`--node-ip=<IPv4 IP>,<IPv6 IP>`
2. 重启kubelet服务，`systemctl restart kubelet`
## Kubernetes 平台的 Pod 网络 CIDR 范围
`kubectl edit configmap/kubeadm-config -n kube-system`修改`ClusterConfiguration`中`podSubnet`，增加<IPv6 IP>
```
    networking:
      dnsDomain: cluster.local
      podSubnet: 10.119.0.0/22,fc00::/48
      serviceSubnet: 10.77.0.0/22
```

# calico配置(通过tigera-operator部署)
`kubectl edit installation default`修改增加ipPools
```
    - blockSize: 122
      cidr: fc00::/48
      disableBGPExport: false
      encapsulation: None
      natOutgoing: Enabled
      nodeSelector: all()
```

# 验证
创建nginx应用与svc，svc的`ipFamilyPolicy: PreferDualStack`表示双栈
nginx-pod-svc.yaml文件如下：
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
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
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
  ipFamilyPolicy: PreferDualStack
```
1. 创建资源：`kubectl apply -f nginx-pod-svc.yaml`
2. 查看pod：`kubectl get pod nginx-deployment-76f94c5f98-r7x5n -oyaml`，status中会有ipv6的地址
```
  podIPs:
  - ip: 10.119.0.110
  - ip: fc00::5e7a:c5ac:1eac:64c:efc0
```
3. 查看svc：`kubectl get svc nginx-service -oyaml`，spec中会有ipv6地址
```
spec:
  clusterIP: 10.77.2.235
  clusterIPs:
  - 10.77.2.235
  - fd00::68f1
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  - IPv6
  ipFamilyPolicy: PreferDualStack
  ports:
  - nodePort: 47560
    port: 80
    protocol: TCP
    targetPort: 80
```
4. 通过ipv6访问
* pod ip
![pod_ip](https://github.com/user-attachments/assets/2c638620-16ca-44e6-93e8-305d47f90f29)
* svc ip
![svc_ip](https://github.com/user-attachments/assets/ee276143-2245-4107-8348-e2ddaee169f3)
* node port
![node_port](https://github.com/user-attachments/assets/abcd64b7-d740-4c3a-b7c0-d9909bbbc647)
