参考： https://apache-apisix.netlify.app/docs/apisix/3.10/plugins/ip-restriction/
# 部署nginx的pod并配置apisix资源
```
apiVersion: v1
kind: Namespace
metadata:
  name: nginx-example2
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: nginx-example2
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.23.1
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: nginx-example2
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
---
# nginx-upstream.yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixUpstream
metadata:
  name: nginx-service
  namespace: nginx-example2
spec:
  timeout:
    connect: 600s
    read: 600s
    send: 600s
---
# nginx-route.yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixRoute
metadata:
  name: nginx-route
  namespace: nginx-example2
spec:
  http:
    - name: nginx-route
      match:
        hosts:
          - server2.nginx.local
        paths:
          - /*
      backends:
        - serviceName: nginx-service
          servicePort: 80
      plugins:
        - config:
#            blacklist:
#              - "10.42.120.46"
            whitelist:
              - "10.42.189.0/24"
            message: "Access denied" #拒绝访问时返回的消息
          enable: true
          name: ip-restriction #不能改，插件的名字，固定
```
# 说明
blacklist配置黑名单、whitelist配置白名单，值都是列表，支持单个ip地址以及cidr（xx.xx.xx.xx/xx）
## 白名单
上述关键配置如下，**需要给哪个路由配置黑白名单，则直接edit对应的资源添加如下plugins字段即可**：
```
      plugins:
        - config:
#            blacklist:
#              - "10.42.120.46"
            whitelist:
              - "10.42.189.0/24"
            message: "Access denied"  #拒绝访问时返回的消息
          enable: true
          name: ip-restriction  #不能改，插件的名字，固定
```
配置了`10.42.189.0/24`网段白名单，只能这个网段能访问
执行`curl -H "Host: server2.nginx.local" master-ip:apisix网关端口`验证访问
* 在10.42.189.30上执行请求成功
* 在10.42.189.34上执行请求成功
* 在10.42.120.46上执行请求失败，返回：`{"message":"Access denied"}`

## 黑名单
```
      plugins:
        - config:
            blacklist:
              - "10.42.120.46"
            message: "Access denied" #拒绝访问时返回的消息
          enable: true
          name: ip-restriction #不能改，插件的名字，固定
```
验证：
* 在10.42.120.46上执行请求失败，返回：`{"message":"Access denied"}`
* 其他任意ip均能访问