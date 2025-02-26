1. `kubectl get ns <对应命名空间名称> -o json   >   abc.json`
执行完这条命令后，当前文件夹会出现abc.json这个文件，打开这个文件，删除字段spec和finalizers这两个字段包含的内容。
找到finalizers字段删除这5行保存退出
```
"spec": {
"finalizers": [
     "kubernets:
]
},
```
2. 新起一个终端执行
`kubectl proxy --port=8081`
在原来的终端测试一下`curl http://localhost:8081/api`
显示如下则为正常
```
[root@master1 ~]# curl  http://localhost:8081/api
{
  "kind": "APIVersions",
  "versions": [
    "v1"
  ],
  "serverAddressByClientCIDRs": [
    {
      "clientCIDR": "0.0.0.0/0",
      "serverAddress": "10.42.42.131:6443"
    }
  ]
}[root@master1 ~]#
```
3. 使用http接口进行删除
`curl -k -H "Content-Type: application/json" -X PUT --data-binary @abc.json http://127.0.0.1:8081/api/v1/namespaces/<命名空间的名字>/finalize`
显示一整页的输出为正常，否则为异常。

注意着里面的两个地方：一个是 **.json文件一定要是刚才生成的文件;一个就是刚才操作的那个命名空间名字**。









