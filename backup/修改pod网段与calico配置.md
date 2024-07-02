1. vim /etc/kubernetes/manifests/kube-controller-manager.yaml 【3个master一个一个的执行，最好是kube-controller-manager-节点名字的pod Running之后再修改下一个节点】
		19行：--cluster-cidr=10.128.0.0/18

2. kubectl edit cm kubeadm-config -n kube-system
		podSubnet: 10.128.0.0/18

3. kubectl edit cm kube-proxy -n kube-system
		clusterCIDR: 10.128.0.0/18

4. kubectl edit ippool default-ipv4-ippool
		cidr: 10.128.0.0/18

5. kubectl edit cm calico-config -n kube-system ：
          "ipam": {
              "type": "calico-ipam",					              #逗号
              "ipv4_pools": ["default-ipv4-ippool"]   #添加此行，前面必须是空格不能是tab
          },

6. kubectl rollout restart -n kube-system daemonset.apps/calico-node
等待calico的pod全部running，全部节点查看配置文件是否有"ipv4_pools": ["default-ipv4-ippool"]：
cat /etc/cni/net.d/00-multus.conf
cat /etc/cni/net.d/10-calico.conflist

7. kubectl  edit ippool kubevirt-vm-ippool
  cidr: 10.128.128.0/18

8. kubectl delete ippool other-ippool

9. kubectl cluster-info dump | grep cluster-cidr


默认使用default pool，开启noipam功能
calico-config configMap:
cni.projectcalico.org/ipAddrsNoIpam
```
apiVersion: v1
data:
  calico_backend: bird
  cni_network_config: |-
    {
      "name": "k8s-pod-network",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "calico",
          "log_level": "info",
          "log_file_path": "/var/log/calico/cni/cni.log",
          "datastore_type": "kubernetes",
          "nodename": "__KUBERNETES_NODE_NAME__",
          "mtu": __CNI_MTU__,
          "ipam": {
              "type": "calico-ipam",
              "ipv4_pools": ["default-ipv4-ippool"]
          },
          "policy": {
              "type": "k8s"
          },
          "kubernetes": {
              "kubeconfig": "__KUBECONFIG_FILEPATH__"
          },
         "feature_control": {
             "ip_addrs_no_ipam": true
         }
        },
        {
          "type": "portmap",
          "snat": true,
          "capabilities": {"portMappings": true}
        },
        {
          "type": "bandwidth",
          "capabilities": {"bandwidth": true}
        }
      ]
    }
  typha_service_name: none
  veth_mtu: "0"
kind: ConfigMap
metadata:
  name: calico-config
  namespace: kube-system
```

