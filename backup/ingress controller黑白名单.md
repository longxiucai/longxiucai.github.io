参考: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/

黑名单
根据实际情况，修改需要配置黑白名单的ingress资源，示例：
kubectl  edit  ingresses.networking.k8s.io -n xx xxxxx

增加annotations：
nginx.ingress.kubernetes.io/denylist-source-range: ip1/mask,ip2/mask

白名单
使用上述方法，增加annotations：
nginx.ingress.kubernetes.io/whitelist-source-range: ip1/mask,ip2/mask

