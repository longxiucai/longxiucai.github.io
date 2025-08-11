参考 ： https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary
## 创建2个nginx版本分别为v1与v2
```
# Nginx v1 配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config-v1
data:
  index.html: |
    <p class="version">This is Nginx Version 1.0</p>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
      version: v1
  template:
    metadata:
      labels:
        app: nginx
        version: v1
    spec:
      containers:
      - name: nginx
        image: registry.kylincloud.org:4001/kcc/images/nginx:1.23.1
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-html-v1
          mountPath: /usr/share/nginx/html
      volumes:
      - name: nginx-html-v1
        configMap:
          name: nginx-config-v1
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service-v1
spec:
  selector:
    app: nginx
    version: v1
  ports:
  - port: 80
    targetPort: 80
  type: NodePort
---

# Nginx v2 配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config-v2
data:
  index.html: |
    <p class="version">This is Nginx Version 2.0</p>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
      version: v2
  template:
    metadata:
      labels:
        app: nginx
        version: v2
    spec:
      containers:
      - name: nginx
        image: registry.kylincloud.org:4001/kcc/images/nginx:1.23.1
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-html-v2
          mountPath: /usr/share/nginx/html
      volumes:
      - name: nginx-html-v2
        configMap:
          name: nginx-config-v2
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service-v2
spec:
  selector:
    app: nginx
    version: v2
  ports:
  - port: 80
    targetPort: 80
  type: NodePort
```

## 创建ingress
```
# 第一个Ingress定义，用于常规服务
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: canary-v1  # 定义Ingress的名称
spec:
  ingressClassName: ingress-nginx
  rules:
  - host: nginx.lyx.com  # 设置主机名，所有的请求都会被转发到这个域名下的服务
    http:
      paths:
      - backend:
          service:
            name: nginx-service-v1
            port:
              number: 80  # 指定后端服务监听的端口
        path: /  # 所有访问根路径的请求都会被转发到此服务
        pathType: Prefix  # 路径类型为前缀，表示所有以"/"开头的请求都将被转发到此服务
```
## 流量切分
### 流量切分---基于权重的灰度发布
```
## 第二个Ingress定义，用于灰度发布服务
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:  # 添加注解来控制灰度发布
    nginx.ingress.kubernetes.io/canary: "true"  # 开启灰度发布模式
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 设置灰度发布的权重为10%，即10%的流量会被路由至此服务
  name: canary-v2  # 定义Ingress的名称
spec:
  ingressClassName: ingress-nginx
  rules:
  - host: nginx.lyx.com  # 设置主机名，所有的请求都会被转发到这个域名下的服务
    http:
      paths:
      - backend:
          service:
            name: nginx-service-v2
            port:
              number: 80  # 指定后端服务监听的端口
        path: /  # 所有访问根路径的请求都会被转发到此服务
        pathType: Prefix  # 路径类型为前缀，表示所有以"/"开头的请求都将被转发到此服务
```
#### 访问测试
```
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
```
#### ingress日志
```
10.42.42.215 - - [11/Aug/2025:15:45:17 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.017 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.1.240:80 49 0.017 200 d95ea8fd385cdd9ff2cbbf6864fd20f6
10.42.42.215 - - [11/Aug/2025:15:45:18 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.011 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.011 200 4000402fa79014b4a67c0666216d33dc
10.42.42.215 - - [11/Aug/2025:15:45:19 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.004 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.004 200 6a255fdd7a772194202abde616d9cdc8
10.42.42.215 - - [11/Aug/2025:15:45:19 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.033 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.033 200 1b194da2053c441a1d0bf8d5a5a97324
10.42.42.215 - - [11/Aug/2025:15:45:20 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.003 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.003 200 0f26b64c4ab606a0ddd3f10075833110
10.42.42.215 - - [11/Aug/2025:15:45:20 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.016 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.016 200 eb3ce85c093a344008d5455fe42c77ee
10.42.42.215 - - [11/Aug/2025:15:45:21 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.019 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.1.240:80 49 0.019 200 40b91965d1a470fcb06f250a0054103a
10.42.42.215 - - [11/Aug/2025:15:45:21 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.013 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.013 200 a6f91c529d693629930605ad20026756
10.42.42.215 - - [11/Aug/2025:15:45:22 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.006 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.006 200 f0d2115b945cdb5f1cefb3fa77786c6d
10.42.42.215 - - [11/Aug/2025:15:45:23 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.013 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.014 200 32e1a4370112292029c7698c3969f6a9
10.42.42.215 - - [11/Aug/2025:15:45:23 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.013 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.013 200 82837580f752bdf27dd1dc7cb3d94de9
10.42.42.215 - - [11/Aug/2025:15:45:24 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.047 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.047 200 ebbc9337bf107e092b5108305ba17b26
10.42.42.215 - - [11/Aug/2025:15:45:24 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.017 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.017 200 c387cc0bb9ca2f16a92a85adbc2d6066
10.42.42.215 - - [11/Aug/2025:15:45:25 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.003 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.003 200 86aa9bca9724a2a3253d3547f5e3d5fb
10.42.42.215 - - [11/Aug/2025:15:45:26 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.024 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.0.168:80 49 0.025 200 29678f4334c59b6105d03a553ea4d2d1
```
### 流量切分---基于请求头的灰度发布
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: canary-cookie-new  # 定义第二个Ingress资源的名称
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"  # 开启灰度发布模式
    nginx.ingress.kubernetes.io/canary-by-header: "canary"  # 指定使用HTTP头部来区分流量
    nginx.ingress.kubernetes.io/canary-by-header-value: "new"  # 指定HTTP头部的值为"new"时，请求会被路由到新版本服务
spec:
  ingressClassName: ingress-nginx
  rules:
  - host: nginx.lyx.com  # 设置主机名，所有请求都会被转发到这个域名下的服务
    http:
      paths:
      - backend:
          service:
            name: nginx-service-v2
            port:
              number: 80  # 指定后端服务监听的端口
        path: /  # 所有访问根路径的请求都会被转发到此服务
        pathType: Prefix  # 路径类型为前缀，表示所有以"/"开头的请求都将被转发到此服务
```
#### 访问测试
```
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl -H "canary: new" nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
[root@node2 ~]# curl -H "canary: new" nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
[root@node2 ~]# curl -H "canary: new" nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
```
#### ingress日志
```
10.42.42.215 - - [11/Aug/2025:15:54:14 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.012 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.012 200 6a4931aba828dfd9179a3000294ffd6a
10.42.42.215 - - [11/Aug/2025:15:54:15 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.006 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.006 200 f7bf797308eff3880b86799b9cb5a77d
10.42.42.215 - - [11/Aug/2025:15:54:15 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.008 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.008 200 d95b5e889c5b856c358858f334c3ad1a
10.42.42.215 - - [11/Aug/2025:15:54:19 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.005 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.005 200 3360a1161ae52f80de976f6db0df679e
10.42.42.215 - - [11/Aug/2025:15:54:20 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.016 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.016 200 1a983a1a2a2e2139000d3cb8aee91680
10.42.42.215 - - [11/Aug/2025:15:54:20 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.004 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.004 200 686fe639c8c094ee4ecf425ed1ee8dde
10.42.42.215 - - [11/Aug/2025:15:54:37 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.031 [default-nginx-service-v1-80] [] 10.119.0.167:80 49 0.030 200 e80775fb331c4bdd5ebb39a38ce75266
10.42.42.215 - - [11/Aug/2025:15:54:46 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 90 0.004 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.1.240:80 49 0.004 200 02c764ac9dfb23cef1f498493e50dc0e
10.42.42.215 - - [11/Aug/2025:15:54:47 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 90 0.004 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.0.168:80 49 0.004 200 ad2bdd119e40147392a6a1233a9205f3
10.42.42.215 - - [11/Aug/2025:15:54:48 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 90 0.009 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.1.240:80 49 0.009 200 21c8ea19289b31f5f8b4cb8763089d77
```
### 流量切分---基于cookie的灰度发布
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: canary-cookie-new  # 定义第二个Ingress资源的名称
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-cookie: "user_from_xx"
spec:
  ingressClassName: ingress-nginx
  rules:
  - host: nginx.lyx.com  # 设置主机名，所有请求都会被转发到这个域名下的服务
    http:
      paths:
      - backend:
          service:
            name: nginx-service-v2
            port:
              number: 80  # 指定后端服务监听的端口
        path: /  # 所有访问根路径的请求都会被转发到此服务
        pathType: Prefix  # 路径类型为前缀，表示所有以"/"开头的请求都将被转发到此服务
```
#### 访问测试
当cookie值被设置为always时，它将被路由到canary。当cookie设置为never时，它将永远不会被路由到canary。对于任何其他值，cookie将被忽略，并按优先级将请求与其他canary规则进行比较。
```
[root@node2 ~]# curl nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl --cookie "user_from_xx" nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl --cookie "user_from_xx=ddd" nginx.lyx.com
<p class="version">This is Nginx Version 1.0</p>
[root@node2 ~]# curl --cookie "user_from_xx=always" nginx.lyx.com
<p class="version">This is Nginx Version 2.0</p>
```
#### ingress日志
```
10.42.42.215 - - [11/Aug/2025:16:08:55 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.007 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.006 200 517f2139a12bf464b0c1ba397404d6f2
10.42.42.215 - - [11/Aug/2025:16:08:59 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 77 0.004 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.004 200 bdfa6fc5814bbd899704054a848736b0
10.42.42.215 - - [11/Aug/2025:16:09:01 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 103 0.002 [default-nginx-service-v1-80] [] 10.119.1.239:80 49 0.002 200 b87f52a700b759ac5c5087e976fb701f
10.42.42.215 - - [11/Aug/2025:16:09:04 +0800] "GET / HTTP/1.1" 200 49 "-" "curl/7.66.0" 106 0.006 [default-nginx-service-v1-80] [default-nginx-service-v2-80] 10.119.1.240:80 49 0.006 200 7936ce0c4cf85d5699dc486cb2a3b87a
```