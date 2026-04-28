1. 配置ifcfg-xxx1接口 路径为 /etc/sysconfig/network-scripts/
TYPE=Ethernet
NAME=xxx1
BOOTPROTO=none
DEVICE=xxx1
ONBOOT=yes
MASTER=bond0
SLAVE=yes
2. 同1，配置ifcfg-xxx2接口
3. 新建ifcfg-bond0文件，内容如下
TYPE=Ethernet
NAME=bond0
BOOTPROTO=static
DEVICE=bond0
ONBOOT=yes
IPADDR=xxxx
NATMASK=XXXX
GATEWAY=172.20.43.253
DNS1=172.20.191.2
DNS2=114.114.114.114
BONDING_OPTS="mode=6 miimon=100"
4. 加载模块，让系统支持bonding    ？？？？？？
cat/etc/modprobe.conf？？？/etc/modprobe.d/bonding.conf？？？  //不存在的话，手动创建（也可以放在modprobe.d下面）
alias bond0 bonding
options bond0 miimon=100 mode=0
5. 加载bond module：modprobe bonding
6. systemctl restart network
7. 查看绑定结果
`cat  /proc/net/bonding/bond0`

参考：
https://www.cnblogs.com/huangweimin/articles/6527058.html
https://blog.csdn.net/qq_34870631/article/details/80625217
