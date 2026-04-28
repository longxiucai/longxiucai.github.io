
# 数据导出
## 方式一、通过快照的方法
### 启动admin api
先判断当前是否启用了admin api，如果没有启用，需要启用，判断方法：
```
kubectl get pod -n monitoring prometheus-k8s-0 -oyaml|grep admin
```
看是否有`    - --web.enable-admin-api`，如果没有则需要启用，启用方法：
```
kubectl -n monitoring patch prometheus k8s --type merge --patch '{"spec":{"enableAdminAPI":true}}'
```
### 通过api创建快照
```
curl -XPOST http://<masterip>:30200/api/v1/admin/tsdb/snapshot
```
返回:{"status":"success","data":{"name":"20250609T091200Z-462edddd226ddbd5"}} 可以在容器中/prometheus/snapshots/中找到这个name 的目录
### 将快照数据拷贝出来（下面方法二选一）
#### kubectl cp
```
kubectl cp -n monitoring prometheus-k8s-0:/prometheus/snapshots  .
```
> [!TIP]
> 通过kubectl cp方式时，当前目录会存在`<snapshots-name>`，这里面直接是元数据，例如`ls 20250610T022906Z-610813546f16aadd`可以看到很多目录。

#### nerdctl数据拷贝（在prometheus-k8s-0这个pod运行的节点中执行）
```
nerdctl -n k8s.io cp $(nerdctl -n k8s.io ps -a --filter "label=io.kubernetes.pod.name=prometheus-k8s-0" --filter "label=io.kubernetes.container.name=prometheus" --format "{{.ID}}"):/prometheus/snapshots .
```
> [!TIP]
> 通过快照的方式cp出来到当前目录时，当前目录会存在`snapshots/<snapshots-name>`，这里面才是元数据，例如`ls snapshots/20250610T022906Z-610813546f16aadd/`可以看到很多目录。

## 方式二、直接cp整个目录
```
mkdir prometheus
kubectl cp -n monitoring prometheus-k8s-0:/prometheus  ./prometheus
```
> [!TIP]
> 通过直接cp整个目录的方式时，当前目录会存在`prometheus`，这里面直接是元数据，例如`ls prometheus/`可以看到很多目录。


# 数据导入
下面命令中的`<元数据目录>`的替换为：
1. 通过快照方式时：
  * kubectl cp: `20250610T022906Z-610813546f16aadd`
  * nerdctl cp:  `snapshots/20250610T022906Z-610813546f16aadd`
2. 直接cp的方式时： `prometheus`
## 通过pod的方式(不推荐，会覆盖原来集群中的数据)：
替换<元数据目录>为实际目录，需要在pod所在节点执行，也可以在任意master节点执行kubectl cp命令。
```
cd <元数据目录> && nerdctl -n k8s.io cp . $(nerdctl -n k8s.io ps -a --filter "label=io.kubernetes.pod.name=prometheus-k8s-0" --filter "label=io.kubernetes.container.name=prometheus" --format "{{.ID}}"):/prometheus/ 
```
## 通过直接run的方式
创建目录和文件：
```
mkdir -p prometheus_data/{certs,config_out,data,rules,web_config}
touch prometheus_data/config_out/prometheus.env.yaml
touch prometheus_data/web_config/web-config.yaml
```
将元数据拷贝到目录中（替换<元数据目录>为实际目录）：
```
cp -r <元数据目录>/*  prometheus_data/data/
```
启动prometheus：
```
nerdctl run -d --name prometheus --restart always --user 1000:2000 -p 9999:9090 --user 0:0 \
-v $(pwd)/prometheus_data/data:/prometheus  \
-v $(pwd)/prometheus_data/config_out:/etc/prometheus/config_out:ro  \
-v $(pwd)/prometheus_data/certs:/etc/prometheus/certs:ro  \
-v $(pwd)/prometheus_data/rules/prometheus-k8s-rulefiles-0:/etc/prometheus/rules/prometheus-k8s-rulefiles-0:ro  \
-v $(pwd)/prometheus_data/web_config:/etc/prometheus/web_config:ro   \
registry.kylincloud.org:4001/kcc/kcc/prometheus:v2.36.1   \
--web.console.templates=/etc/prometheus/consoles \
--web.console.libraries=/etc/prometheus/console_libraries \
--storage.tsdb.retention.time=7d \
--config.file=/etc/prometheus/config_out/prometheus.env.yaml \
--storage.tsdb.path=/prometheus \
--web.enable-lifecycle   \
--web.enable-admin-api \
--web.route-prefix=/ \
--web.config.file=/etc/prometheus/web_config/web-config.yaml
```
可以在浏览器中访问`http://localhost:9999`查看promethues界面。