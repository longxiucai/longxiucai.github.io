### 问题现象
maxcale的pod中查看如下图所示
![微信图片_20240730141907](https://github.com/user-attachments/assets/40abae26-c65a-48fa-b714-fd4a0cf5023a)

### 排查
1.查看日志，可以知道没有找到master，有只读错误
![微信图片_20240730142747](https://github.com/user-attachments/assets/ae1d81e5-9f0b-44f9-8ab0-152ac1da6f72)

2.查看monitor，发现3个节点都是只读
```
maxctrl list monitors
maxctrl show monitor MariaDB-Monitor
```
![微信图片_20240730143048](https://github.com/user-attachments/assets/2fc22344-bd6a-4bda-922a-642614f8bcbc)

### 解决问题
* 手动修改主节点，关闭只读
```
SET GLOBAL read_only = OFF;
```
此时删除maxcale的pod，重新拉起之后，发现依然没有找到主节点。

* 在maxcale配置文件中配置项目`[MariaDB-Monitor]`，有配置参数`master_reconnection=true`，已经被弃用
参考文档 https://mariadb.com/kb/en/mariadb-maxscale-25-mariadb-monitor/#detect_stale_master
删除使用`master_conditions=connected_slave,running_slave`代替。再次删除maxcale的pod重新拉起之后恢复正常。
![微信图片_20240730144528](https://github.com/user-attachments/assets/16a292c5-4e39-4ebe-94ac-abd3bb248be5)

* 将maxcale配置文件恢复为`master_reconnection=true`之后，？？？？？？依然正常？？？？？？。
