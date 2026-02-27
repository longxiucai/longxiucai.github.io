1、检查apiservice
```
[root@master1 ~]# kubectl get apiservice v1beta1.metrics.k8s.io
NAME                     SERVICE                         AVAILABLE   AGE
v1beta1.metrics.k8s.io   monitoring/prometheus-adapter   True        173d
```
旧的版本可能为`kube-system/metrics-server`
2、检查prometheus-adapter运行参数是否正确从prometheus中获取指标数据
```
kubectl get deployment.apps/prometheus-adapter -n monitoring  -oyaml
```
3、检查prometheus-adapter配置
```
[root@master1 ~]# kubectl get cm -n monitoring  adapter-config -oyaml
apiVersion: v1
data:
  config.yaml: |-
    "resourceRules":
      "cpu":
        "containerLabel": "container"
        "containerQuery": |
          sum by (<<.GroupBy>>) (
            irate (
                container_cpu_usage_seconds_total{<<.LabelMatchers>>,container!="",pod!=""}[120s]
            )
          )
        "nodeQuery": |
          sum by (<<.GroupBy>>) (
            1 - irate(
              node_cpu_seconds_total{mode="idle"}[60s]
            )
            * on(namespace, pod) group_left(node) (
              node_namespace_pod:kube_pod_info:{<<.LabelMatchers>>}
            )
          )
          or sum by (<<.GroupBy>>) (
            1 - irate(
              windows_cpu_time_total{mode="idle", job="windows-exporter",<<.LabelMatchers>>}[4m]
            )
          )
        "resources":
          "overrides":
            "namespace":
              "resource": "namespace"
            "node":
              "resource": "node"
            "pod":
              "resource": "pod"
      "memory":
        "containerLabel": "container"
        "containerQuery": |
          sum by (<<.GroupBy>>) (
            container_memory_working_set_bytes{<<.LabelMatchers>>,container!="",pod!=""}
          )
        "nodeQuery": |
          sum by (<<.GroupBy>>) (
            node_memory_MemTotal_bytes{job="node-exporter",<<.LabelMatchers>>}
            -
            node_memory_MemAvailable_bytes{job="node-exporter",<<.LabelMatchers>>}
          )
          or sum by (<<.GroupBy>>) (
            windows_cs_physical_memory_bytes{job="windows-exporter",<<.LabelMatchers>>}
            -
            windows_memory_available_bytes{job="windows-exporter",<<.LabelMatchers>>}
          )
        "resources":
          "overrides":
            "instance":
              "resource": "node"
            "namespace":
              "resource": "namespace"
            "pod":
              "resource": "pod"
      "window": "5m"
kind: ConfigMap
metadata:
  annotations:
...
```
可知kube top命令所显示的数据应当是由上述配置文件中的promQL提供，kube top命令无法显示数据是因为上述查询语句没有数据返回。
4、查看具体执行的promQL命令
* promethues-operator开启方式如下：
修改promethues资源`kubectl edit prometheus -n monitoring k8s`增加`spec.queryLogFile`值为`/dev/stdout`
```
spec:
  queryLogFile: /dev/stdout
```
* 不是operator参考prometheus的query_log_file（https://prometheus.io/docs/guides/query-log/）功能

5、执行`kubectl top node --v 8`可以查看具体哪里报错，之后马上查看日志`kubectl logs prometheus-k8s-0 -n monitoring |grep windows-exporter`
```
{"httpRequest":{"clientIP":"10.42.39.185","method":"GET","path":"/api/v1/query"},"params":{"end":"2025-11-19T07:49:47.921Z","query":"sum by (instance) (\n  node_memory_MemTotal_bytes{job=\"node-exporter\",instance=~\"node2|node3|master1|master2|master3|node1\"}\n  -\n  node_memory_MemAvailable_bytes{job=\"node-exporter\",instance=~\"node2|node3|master1|master2|master3|node1\"}\n)\nor sum by (instance) (\n  windows_cs_physical_memory_bytes{job=\"windows-exporter\",instance=~\"node2|node3|master1|master2|master3|node1\"}\n  -\n  windows_memory_available_bytes{job=\"windows-exporter\",instance=~\"node2|node3|master1|master2|master3|node1\"}\n)\n","start":"2025-11-19T07:49:47.921Z","step":0},"spanID":"0000000000000000","stats":{"timings":{"evalTotalTime":0.001010732,"resultSortTime":0,"queryPreparationTime":0.000504346,"innerEvalTime":0.000476046,"execQueueTime":0.000034521,"execTotalTime":0.001062394},"samples":{"totalQueryableSamples":12,"peakSamples":30}},"ts":"2025-11-19T07:49:47.924Z"}
{"httpRequest":{"clientIP":"10.42.39.185","method":"GET","path":"/api/v1/query"},"params":{"end":"2025-11-19T07:49:47.921Z","query":"sum by (node) (\n  1 - irate(\n    node_cpu_seconds_total{mode=\"idle\"}[60s]\n  )\n  * on(namespace, pod) group_left(node) (\n    node_namespace_pod:kube_pod_info:{node=~\"node2|node3|master1|master2|master3|node1\"}\n  )\n)\nor sum by (node) (\n  1 - irate(\n    windows_cpu_time_total{mode=\"idle\", job=\"windows-exporter\",node=~\"node2|node3|master1|master2|master3|node1\"}[4m]\n  )\n)\n","start":"2025-11-19T07:49:47.921Z","step":0},"spanID":"0000000000000000","stats":{"timings":{"evalTotalTime":0.015800841,"resultSortTime":0,"queryPreparationTime":0.002610773,"innerEvalTime":0.013110486,"execQueueTime":0.00005132,"execTotalTime":0.015879981},"samples":{"totalQueryableSamples":743,"peakSamples":921}},"ts":"2025-11-19T07:49:47.939Z"}
```
具体的执行语句如上，可以去promethues界面手动执行
6、kubectl logs -n monitoring  prometheus-adapter-xxxx-xxxx查看日志是否有skip类似字样
7、检查kubectl logs -n monitoring kube-state-metrics-xxxx-xxxx日志是否有权限或者其他报错
8、检查promethues界面中Status->Targets搜索kube-state查看是否正常
上述检查如果出现异常则解决异常即可。