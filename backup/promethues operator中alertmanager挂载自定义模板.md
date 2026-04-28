1. 创建模板为configmap，内容如下，根据实际需求修改，kubectl apply即可
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-templates
  namespace: monitoring  # 根据你的 Alertmanager 命名空间调整
data:
  kubediag.tmpl: |
    {{ define "kubediag.payload" }}
    {{ .Alerts }}
    {{ end }}
```  
2. 修改alertmanager资源添加configMaps配置项（配置会挂载到`/etc/alertmanager/configmaps`中），patch.yaml文件内容如下
```
spec:
  configMaps:
  - alertmanager-templates
```
执行命令`kubectl patch alertmanager main -n monitoring --type=merge --patch-file patch.yaml`
3. 修改alertmanager的配置，根据实际情况，我的环境为kubectl get secrets -n monitoring  alertmanager-main这个secret。配置中增加：
```
    templates:
    - '/etc/alertmanager/configmaps/alertmanager-templates/kubediag.tmpl'
```