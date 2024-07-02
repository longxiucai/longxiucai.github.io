1. master1节点操作删除master3节点
```
kubectl delete node master3
```
2. master3节点操作
``` 
kubeadm reset
rm -rf  /var/lib/etcd/
rm -rf /etc/kubernetes/manifests/*
hostnamectl set-hostname xxxxx
``` 

3. master1节点
```
kubectl exec -n kube-system -it etcd-master1 -- sh
alias etcdctl='etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key'
etcdctl member list
etcdctl member remove <master3的id，上一步输出的第一列>
exit
```
4. master1节点操作
```
kubeadm token create --print-join-command
kubeadm init phase upload-certs --upload-certs输出的最后一行字符串与上一步组合（--control-plane --certificate-key xxxxx）
```
组合完成后示例：
```
kubeadm join apiserver.cluster.local:6443 --token a6e1fm.b5lnpm64r7t707lw --discovery-token-ca-cert-hash sha256:06bc401679c6964d712790e0464d701030b27919c84807a30acb9c772e1a884f --control-plane --certificate-key b8e05ef60b5cecc78318cfe8148520ae2d46d0ac7871932cfeec7b36a0bd698e
```
5. master3执行上面组合之后的命令
