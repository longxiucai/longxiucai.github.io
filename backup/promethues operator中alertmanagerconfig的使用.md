1. `kubectl patch alertmanager main -n monitoring --type=merge --patch-file patch.yaml`配置选择哪些alertmanagerConfig

patch.yaml文件内容如下
```
spec:
  alertmanagerConfigSelector:
    matchLabels:
      alertmanagerConfig: main
```
2. 创建alertmanagerConfig资源，资源需要有上述label：`alertmanagerConfig: main`
```
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: kubediag-config
  namespace: monitoring
  labels:
    alertmanagerConfig: main
spec:
  route:
    receiver: 'kubediag'
    routes:
      - receiver: 'kubediag'
        matchers: 
        - name: "strategy_type"
          value: "user_strategy"
        - name: "namespace"
          value: default
  receivers:
    - name: 'kubediag'
      webhookConfigs:
       - url: 'http://kubediag-master.kubediag.svc.cluster.local:8089/api/v1/alerts'
          sendResolved: true
          httpConfig:
            tlsConfig:
              insecureSkipVerify: true
          maxAlerts: 0
```