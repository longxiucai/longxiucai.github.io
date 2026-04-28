```
[root@master1 ~]# pvcreate /dev/sdb 
  Physical volume "/dev/sdb" successfully created.
[root@master1 ~]# vgextend klas /dev/sdb
  Volume group "klas" successfully extended
[root@master1 ~]# lvextend /dev/klas/root /dev/sdb 
  Size of logical volume klas/root changed from <61.34 GiB (15703 extents) to <141.34 GiB (36182 extents).
  Logical volume klas/root successfully resized.
[root@master1 ~]# xfs_growfs /
```