## 解压
mkdir tmpdir
cd tmpdir
xzcat -d ../initrd.img | cpio -idum   #解压img输出到当前所在目录

## 修改
....

## 重新打包
find . | cpio -oH newc | xz --check=crc32 -9 > ../initrd.img

cpio -H参数说明：
* bin 过时的二进制格式。(2147483647字节)
* odc 旧的（POSIX.1）可移植格式。(8589934591 bytes)
* newc 新的（SVR4）可移植格式，它支持具有超过65536个i节点的文件系统。(4294967295 bytes)