nmcli connection modify enp1s0 ipv6.method manual ipv6.addresses 2003:db8::37/64
nmcli connection up enp1s0 



虚拟机网卡配置，多台虚拟机使用此配置桥接到ovs-br0，配置ipv6（无网关）之后，ipv6之间不通。
```
<interface type="direct">
  <mac address="52:54:00:07:1e:f4"/>
  <source dev="ovs-br0" mode="bridge"/>
  <target dev="macvtap18"/>
  <model type="virtio"/>
  <alias name="net0"/>
  <address type="pci" domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
</interface>
```
原因：macvtap/direct 模式的通信限制
使用的interface type="direct"结合mode="bridge"本质是基于macvtap技术，这种模式在默认情况下可能存在限制：
* 同一物理网卡上的多个 macvtap 设备之间默认无法直接通信（内核可能过滤同物理接口的 macvtap 流量）；
* 即使通过 ovs-br0 桥接，若 ovs 未正确配置转发规则，流量可能被阻断。


而使用直接连接ovs桥的方式时，虚拟机启动出现 “无法添加桥接 ovs-br0 端口 vnet0: 不支持的操作” 错误。
```
<interface type="bridge">  <!-- 改为bridge类型，直接连接ovs桥 -->
  <mac address="52:54:00:07:1e:f4"/>
  <source bridge="ovs-br0"/>  <!-- 直接关联ovs桥 -->
  <model type="virtio"/>
  <alias name="net0"/>
  <address type="pci" domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
</interface>
```
原因：libvirt 对 Open vSwitch（ovs）桥的处理方式与普通 Linux 桥不同，直接使用type="bridge"会导致适配问题。

为解决这个问题
1. 确认 ovs 桥和依赖组件正常
首先确保 ovs 桥存在且状态正常，同时安装 libvirt 与 ovs 交互的必要组件：
```
# 检查ovs桥状态（确保ovs-br0存在且状态为UP）
sudo ovs-vsctl show

# 安装libvirt-ovs支持组件
yum install -y openvswitch-switch libvirt-daemon-driver-network

# 重启libvirt服务使配置生效
sudo systemctl restart libvirtd
```
2. 创建 libvirt 网络定义（关联 ovs 桥）
需要为 ovs-br0 创建一个 libvirt 网络配置文件（而非直接在虚拟机 XML 中引用 ovs 桥），示例文件ovs-net.xml：
```
<network>
  <name>ovs-network</name>  <!-- 网络名称，后续虚拟机引用 -->
  <forward mode="bridge"/>  <!-- 桥接模式 -->
  <bridge name="ovs-br0"/>  <!-- 关联到ovs桥 -->
  <virtualport type="openvswitch"/>  <!-- 关键：指定为ovs类型 -->
</network>
```
创建并激活该网络：
```
# 定义网络
sudo virsh net-define ovs-net.xml

# 启动网络并设置开机自启
sudo virsh net-start ovs-network
sudo virsh net-autostart ovs-network

# 验证网络状态（确保状态为active）
sudo virsh net-list --all
```
3. 修改虚拟机 XML 配置（引用 ovs 网络）
将虚拟机接口配置改为引用上面创建的ovs-network，而非直接绑定 ovs-br0：
```
<interface type="network">  <!-- 类型改为network，引用libvirt网络 -->
  <mac address="52:54:00:07:1e:f4"/>  <!-- 保持原有MAC -->
  <source network="ovs-network"/>  <!-- 引用上面创建的ovs-network -->
  <model type="virtio"/>  <!-- 保持原有模型 -->
  <alias name="net0"/>
  <address type="pci" domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
</interface>
```