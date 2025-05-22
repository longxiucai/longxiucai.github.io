前提条件：A环境中能够解析B提供服务的域名

1.在A环境增加一条内部“svc-B”的service资源，“svc-B”的spec.type为ExternalName、spec.externalName为集群B中服务的域名地址。
```
apiVersion: v1
kind: Service
metadata:
  name: service-clusterb
  namespace: default
spec:
  type: ExternalName
  externalName: example.clusterb.com
```
2.在A环境创建一条ingress资源，并配置nginx.ingress.kubernetes.io/upstream-vhost: "B集群服务的域名地址"的annotations，实现对“svc-B”进行代理。
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-for-cluster-a
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/upstream-vhost: "example.clusterb.com"
spec:
  rules:
  - host: test.lyx.clustera.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: service-clusterb
            port:
              number: 80
```
3. 通过配置`test.lyx.clustera.com`解析到集群A，就能访问`test.lyx.clustera.com`来访问集群B的服务

> [!TIP]
> 环境A中如果没有dns解析域名，则需要手动配置coredns来让集群内ingress的pod解析出正确的ip地址
```
    example.clusterb.com:53 {
        hosts {
            xx.xx.xx.xx example.clusterb.com
            fallthrough
        }
    }
```

![Image](https://github.com/user-attachments/assets/04941b96-c03c-44cf-9305-e9fa27da0eef)