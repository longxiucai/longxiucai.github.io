# 资源文件
```
apiVersion: v1
kind: Pod
metadata:
  name: busybox-pod1
  labels:
    app: busybox-pod1
spec:
  containers:
  - name: busybox
    image: busybox:1.28
    command: ["sleep", "360000"]
    tty: true
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox-pod2
  labels:
    app: busybox-pod2
spec:
  containers:
  - name: busybox
    image: busybox:1.28
    command: ["sleep", "360000"]
    tty: true
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-tcp-block-icmp
  namespace: default  # 根据您的实际 namespace 修改
spec:
  podSelector:
    matchLabels:
      app: busybox-pod1  # 选择 busybox-pod1，您可以根据需要调整
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: busybox-pod2  # 允许 busybox-pod2 发送的流量
    ports:
    - protocol: TCP
      port: 8080  # 指定要允许的 TCP 端口号，您可以根据需要修改
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: busybox-pod2  # 允许 busybox-pod1 访问 busybox-pod2
    ports:
    - protocol: TCP
      port: 8080  # 同样指定要允许的 TCP 端口号
```
# 验证
* pod1执行kubectl exec -it busybox-pod1 -- nc -l -p 8080
* pod2执行kubectl exec -it busybox-pod1 -- nc <pod1的ip地址> 8080，然后输入任意字符回车，pod1端会有打印，tcp连接成功。
* pod2执行kubectl exec -it busybox-pod1 -- ping <pod1的ip地址> ，ping不通，网络策略配置中没有显式配置icmp表示拒绝ICMP流量。
![allow-tcp-block-icmp-test](https://github.com/user-attachments/assets/7b8fd391-5489-4922-95dd-1af2e6a86234)
