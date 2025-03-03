准备
--

您也可以在您的云服务器中通过执行以下命令进行授权。
XXXXXX为密码，根据情况自己更改
```
CREATE USER 'exporter'@'%' IDENTIFIED BY 'XXXXXX' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
```
  
**说明**  
建议为该用户设置最大连接数限制，以避免因监控数据抓取对数据库带来影响。但并非所有的数据库版本中都可以生效，例如 MariaDB 10.1 版本不支持最大连接数设置，则无法生效。详情请参见 [MariaDB 说明](https://mariadb.com/kb/en/create-user/#resource-limit-options)。

部署mysql-exporter
--

1、创建my.conf配置文件。user以及password需要与准备工作中创建的用户密码相同
```
[client]
user = exporter
password = XXXXXX
```
2、kubectl create secret generic mysql-exporter-myconf --from-file=my.conf --dry-run=client -oyaml > mysql-exporter-myconf.yaml
3、kubectl apply -f mysql-exporter-myconf.yaml -n monitoring
4、kubectl apply -f mysql-exporter.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: mysql-exporter
  name: mysql-exporter
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql-exporter
  template:
    metadata:
      labels:
        app: mysql-exporter
    spec:
      containers:
        - name: mysql-exporter
          image: mysqld-exporter:v0.16.0
          imagePullPolicy: IfNotPresent
          args:
          - --config.my-cnf=/etc/mysql-exporter/my.cnf
          ports:
            - containerPort: 9104
              name: metric-port
          volumeMounts:
            - name: myconf-volume
              mountPath: /etc/mysql-exporter/my.cnf
              subPath: my.conf
      volumes:
        - name: myconf-volume
          secret:
            secretName: mysql-exporter-myconf
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: mysql-exporter
  name: mysql-exporter
  namespace: monitoring
spec:
  type: ClusterIP
  ports:
  - name: metrics
    port: 9104
    protocol: TCP
    targetPort: 9104
  selector:
    app: mysql-exporter
```

![Image](https://github.com/user-attachments/assets/fbc2b537-8b61-4b65-9586-bb67efe9abb1)

promethues配置
------------

无法通过servicemonitor来配置，multi-target只能通过static_configs。

promethues operator通过additionalScrapeConfigs来配置static_configs [参考](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/additional-scrape-config.md)

具体步骤：

1. 编辑prometheus-additional.yaml文件
检查是否创建过其他的additional配置，如果有则继续添加，如果没有则直接添加当前mysql-exporter的配置：
`kubectl get secret additional-scrape-configs -n monitoring -o jsonpath="{.data.prometheus-additional\.yaml}"|base64 -d > prometheus-additional.yaml`
编辑prometheus-additional.yaml文件添加如下内容，**如果文件本身存在数据，则不修改原始数据，直接在末尾添加即可。
注意修改mysql的地址，以及最末未行replacement的值应该与mysql-exporter的svc对应。**
```
- job_name: mysql # To get metrics about the mysql exporter’s targets
  metrics_path: /probe
  static_configs:
    - targets:
      # All mysql hostnames or unix sockets to monitor.
      - 10.x.x.x:3306
      - 10.x.x.x:3306
#      - unix:///run/mysqld/mysqld.sock
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      # The mysqld_exporter host:port
      replacement: mysql-exporter.monitoring.svc:9104
```
2. `kubectl create secret generic additional-scrape-configs  --from-file prometheus-additional.yaml --dry-run=client -oyaml > additional-scrape-configs-add-mysql-exporter.yaml`
3. kubectl apply -f additional-scrape-configs-mysql-exporter.yaml -n monitoring
4. kubectl edit prometheus -n monitoring  k8s编辑spec增加/修改additionalScrapeConfigs字段，**如果存在如下配置，则跳过修改此资源的步骤，这个字段只能支持一个配置项，如果名字不同则根据名字去基于原来的secret修改/增加：**
```
spec:
  additionalScrapeConfigs:           #新增
    key: prometheus-additional.yaml  #新增
    name: additional-scrape-configs  #新增
```

redis-exporter
--
#### exporter
容器运行命令需要接redis的密码。
```
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-exporter
  namespace: monitoring
  labels:
    app: redis-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-exporter
  template:
    metadata:
      labels:
        app: redis-exporter
    spec:
      containers:
      - name: redis-exporter
        image: redis_exporter:v1.67.0
        imagePullPolicy: IfNotPresent
        args:
        - -redis.password=XXXX
        ports:
        - containerPort: 9121
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: redis-exporter
  name: redis-exporter
  namespace: monitoring
spec:
  type: ClusterIP
  ports:
  - name: metrics
    port: 9121
    protocol: TCP
    targetPort: 9121
  selector:
    app: redis-exporter
```
#### promethues配置。具体方法参考mysql中的步骤
```
#  注意保留mysql的配置！！！
- job_name: redis_exporter_targets
  static_configs:
    - targets:
      - redis://10.42.XX.XX:6379
      - redis://10.42.XX.XX:6379
      - redis://10.42.XX.XX:6379
      - redis://10.42.XX.XX:6379
      - redis://10.42.XX.XX:6379
      - redis://10.42.XX.XX:6379
  metrics_path: /scrape
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: redis-exporter.monitoring.svc:9121
```
