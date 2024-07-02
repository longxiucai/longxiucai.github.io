# 一主一从redis脑裂现象模拟
主节点A:10.42.186.32  从节点B:10.42.186.33

1. 网络隔离
```bash
# 10.42.186.32 执行下面命令
iptables -A INPUT -s 10.42.186.33 -j DROP
iptables -A OUTPUT -d 10.42.186.33 -j DROP

# 10.42.186.33 执行下面命令
iptables -A INPUT -s 10.42.186.32 -j DROP
iptables -A OUTPUT -d 10.42.186.32 -j DROP
```

2. 从节点升级为主节点
```bash
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! cluster failover takeover
```
3. 查看集群状态(此时2个节点都是主节点)
```bash
# redis-cli -h 10.42.186.32 -p 6379 -a Kylin.2023! cluster nodes
4226cce5d7735c488a74e3aff86ad641d5c5e54b 10.42.186.33:6379@16379 master,fail? - 1719909668692 1719909667688 1 connected
b4519db09c96d8ad12efae818210e6521525e2bf 10.42.186.32:6379@16379 myself,master - 0 0 2 connected 0-16383

# redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! cluster nodes
b4519db09c96d8ad12efae818210e6521525e2bf 10.42.186.32:6379@16379 slave,fail? 4226cce5d7735c488a74e3aff86ad641d5c5e54b 1719909668604 1719909667601 1 connected
4226cce5d7735c488a74e3aff86ad641d5c5e54b 10.42.186.33:6379@16379 myself,master - 0 0 1 connected 0-16383

```
4. 节点A(旧主节点)写入数据
```bash
redis-cli -h 10.42.186.32 -p 6379 -a Kylin.2023! set key32 data32
redis-cli -h 10.42.186.32 -p 6379 -a Kylin.2023! set AAA from32
redis-cli -h 10.42.186.32 -p 6379 -a Kylin.2023! set BBB from32
```
5. 节点B(新主节点)写入数据
```bash
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! set key33 data33
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! set AAA from33
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! set BBB from33
```
6. 恢复网络
```bash
# 10.42.186.32 执行下面命令
iptables -D INPUT -s 10.42.186.33 -j DROP
iptables -D OUTPUT -d 10.42.186.33 -j DROP

# 10.42.186.33 执行下面命令
iptables -D INPUT -s 10.42.186.32 -j DROP
iptables -D OUTPUT -d 10.42.186.32 -j DROP
```
7. 查看数据，此时节点A(旧主节点)变成从节点，并且在网络隔离之后写的数据已经丢失，节点B(新主节点)变成主节点，redis集群的数据以新主节点中的数据为准
```bash
# 10.42.186.33 执行下面命令
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! get key32
返回值为 (nil)
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! get key33
返回值为 data33
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! get AAA
返回值为 from33
redis-cli -h 10.42.186.33 -p 6379 -a Kylin.2023! get BBB
返回值为 from33
# 10.42.186.32变成从节点，已经无法get key