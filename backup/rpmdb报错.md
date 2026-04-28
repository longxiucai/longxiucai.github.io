执行yum、rpm命令失败:error: rpmdb: BDB0113 Thread/process 16978/139878363277376 failed: BDB1507 Thread died in Berkeley DB library

可以通过以下命令解决
```
cd /var/lib/rpm
rm -rf __db*
rpm --rebuilddb
```