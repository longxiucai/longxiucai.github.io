## 问题现象
容器内执行程序报错，程序需要连接指定的svc
![现象](https://github.com/user-attachments/assets/6eaf7525-06c1-4b75-b0b3-e042572224e2)

## 网络排查
1、pod内nslookup能够解析出正确的ip地址，coredns没问题
![](https://github.com/user-attachments/assets/4d683d92-ee8e-4e56-954c-09b8e807cd74)

2、pod内ping有报错
![微信图片_20240723091634](https://github.com/user-attachments/assets/e3e91ad8-ad37-41ec-b5bf-ef7b13e0a264)

3、手动修改容器内/etc/hosts，程序执行没问题
![](https://github.com/user-attachments/assets/439151cb-dcbd-4a75-8976-6ded8d055c3c)

4、查看容器内/etc/resolv.conf,发现末尾有min字段
![](https://github.com/user-attachments/assets/3fd3e5bd-37fc-4ec4-86ec-0fec5b70bb4d)

5、修改去除min字段，删除/etc/hosts解析，程序没问题
![](https://github.com/user-attachments/assets/13379954-03ee-4f54-aa60-0e19d26c24b2)

## 配置排查
1、查看pod的dns解析策略，没问题
![](https://github.com/user-attachments/assets/d6b1ae96-715d-433f-a215-e5daad117c5a)

2、查看coredns配置，没问题
![](https://github.com/user-attachments/assets/12d44482-6545-4974-b86d-3ac9eacefac9)

3、查看宿主机/etc/resolv.conf，有min字段
![](https://github.com/user-attachments/assets/537a3892-5fcc-440d-9852-a815212bdfa4)

## 解决方法
宿主机/etc/resolv.conf删除min字段之后，pod删除重新拉起，容器恢复正常。

## 原因分析
...