* 首先备份kubelet证书目录，默认为`/var/lib/kubelet/pki`。进入证书目录`cd /var/lib/kubelet/pki`之后进行下面操作：

* 下面命令注意`-subj`中的`master2`需替换为原来证书的值（`openssl x509 -text -noout -in kubelet-client-current.pem|grep 'Subject:'`可以查看）。
```
openssl req -new -key  kubelet.key -out kubelet-client.csr -subj "/CN=system:node:master2/O=system:nodes"
```
* 生成100年的证书：
```
openssl x509 -req -in kubelet-client.csr -CA /etc/kubernetes/pki/ca.crt  -CAkey /etc/kubernetes/pki/ca.key  -CAcreateserial -out kubelet-client.crt -days 36500
rm -f kubelet-client-current.pem.new 
cat kubelet-client.crt kubelet.key >>  kubelet-client-current.pem.new
rm -f kubelet-client-current.pem
ln -s kubelet-client-current.pem.new kubelet-client-current.pem
```