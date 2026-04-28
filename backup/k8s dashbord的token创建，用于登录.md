```
kubectl create serviceaccount cluster-admin-dashboard-sa
kubectl create clusterrolebinding cluster-admin-dashboard-sa --clusterrole=cluster-admin --serviceaccount=default:cluster-admin-dashboard-sa
kubectl describe secrets $(kubectl get secret | grep cluster-admin-dashboard-sa |cut -d ' ' -f1)|grep 'token:'
```