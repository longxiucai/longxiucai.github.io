1. apply下面的资源文件
```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: test
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: test
    namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: test
  namespace: kube-system
---
# sa-token-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: test-sa-token
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: test
type: kubernetes.io/service-account-token
```
2. 执行下面命令(替换`KUBE_API`为实际)
```
JWT_TOKEN_KUBESYSTEM_DEFAULT=`kubectl get secret test-sa-token -n kube-system -o jsonpath='{.data.token}' | base64 -d`
KUBE_API=https://172.20.187.11:6443
```
3. 请求
```
curl  $KUBE_API/apis/apps/v1/deployments  --header "Authorization: Bearer $JWT_TOKEN_KUBESYSTEM_DEFAULT" -k
```