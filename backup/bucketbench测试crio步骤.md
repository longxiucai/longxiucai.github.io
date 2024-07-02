1. 安装crio

2. 修改crio配置文件的[crio.image]字段，添加一行pause_image      字段位于第444行
vim /etc/crio/crio.conf
[crio.image]
pause_image = "harbor.kylincloudnative.com/registry.k8s.io/pause:3.6"

3. 配置cgroup
mkdir -p /etc/crio/crio.conf.d
cat >/etc/crio/crio.conf.d/02-cgroup-manager.conf<<-EOF
[crio.runtime]
conmon_cgroup = "pod"
cgroup_manager = "cgroupfs"
EOF


4. 重启并观察状态是否running
systemctl daemon-reload
systemctl restart crio
systemctl status crio

5. 拉镜像，修改tag
```
podman pull harbor.kylincloudnative.com/library/alpine:latest
podman pull harbor.kylincloudnative.com/registry.k8s.io/pause:3.6
podman pull harbor.kylincloudnative.com/registry.k8s.io/pause:3.1
podman tag harbor.kylincloudnative.com/registry.k8s.io/pause:3.6 registry.aliyuncs.com/google_containes/pause:3.6
podman tag harbor.kylincloudnative.com/registry.k8s.io/pause:3.1 registry.aliyuncs.com/google_containers/pause:3.1
```
6. 修改测试工具配置文件
* 修改 contrib/container_config.json      位于第7行
image.image修改为harbor.kylincloudnative.com/library/alpine:latest
* 修改 examples/crio.yaml   位于第2行
image: harbor.kylincloudnative.com/library/alpine:latest
* 修改 examples/crio.yaml中的线程数相关配置：
   threads: xxxxxxxx
   iterations: xxxxxxxx.

7. 测试 arm
./bucketbench-aarch64 --log-level=debug run -b   examples/crio.yaml --skip-limit


> [!TIP]
> 如报错`xxxxxx : name is reserved`，则需删除pod：
```
for i in $(crictl pods | awk -F ' ' '{print$1}' | xargs) ;do crictl stopp $i; done
for i in $(crictl pods | awk -F ' ' '{print$1}' | xargs) ;do crictl rmp $i; done
```
