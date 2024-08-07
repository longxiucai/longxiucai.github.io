## 命令格式
```
logrotate [OPTION...] <configfile>
-d, --debug ：debug模式，测试配置文件是否有错误。
-f, --force ：强制转储文件，无论是否达到大小要求都会转储。
-m, --mail=command ：压缩日志后，发送日志到指定邮箱。
-s, --state=statefile ：使用指定的状态文件。
-v, --verbose ：显示转储过程。
```
## 运行方式
Logrotate是基于CRON来运行的，其脚本是/etc/cron.daily/logrotate，日志轮转是系统自动完成的。实际运行时，Logrotate会调用配置文件/etc/logrotate.conf。可以在/etc/logrotate.d目录里放置自定义好的配置文件，用来覆盖Logrotate的缺省值。
```
[root@master1 ~]# cat /etc/cron.daily/logrotate 
#!/bin/sh

/usr/sbin/logrotate /etc/logrotate.conf
EXITVALUE=$?
if [ $EXITVALUE != 0 ]; then
    /usr/bin/logger -t logrotate "ALERT exited abnormally with [$EXITVALUE]"
fi
exit $EXITVALUE
```
## 配置
```
# cat /etc/logrotate.conf
# 底下的设定是 "logrotate 的默认值" ，如果別的文件设定了其他的值，
# 就会以其它文件的设定为主
weekly          //默认每一周执行一次rotate轮转工作
rotate 4       //保留多少个日志文件(轮转几次).默认保留四个.就是指定日志文件删除之前轮转的次数，0 指没有备份
create         //自动创建新的日志文件，新的日志文件具有和原来的文件相同的权限；因为日志被改名,因此要创建一个新的来继续存储之前的日志
dateext       //这个参数很重要！就是切割后的日志文件以当前日期为格式结尾，如xxx.log-20131216这样,如果注释掉,切割出来是按数字递增,即前面说的 xxx.log-1这种格式
compress      //是否通过gzip压缩转储以后的日志文件，如xxx.log-20131216.gz ；如果不需要压缩，注释掉就行

include /etc/logrotate.d
# 将 /etc/logrotate.d/ 目录中的所有文件都加载进来
```
## 配置参数说明
```
compress                                   通过gzip 压缩转储以后的日志
nocompress                                不做gzip压缩处理
copytruncate                              用于还在打开中的日志文件，把当前日志备份并截断；是先拷贝再清空的方式，拷贝和清空之间有一个时间差，可能会丢失部分日志数据。
nocopytruncate                           备份日志文件不过不截断
create mode owner group             轮转时指定创建新文件的属性，如create 0777 nobody nobody
nocreate                                    不建立新的日志文件
delaycompress                           和compress 一起使用时，转储的日志文件到下一次转储时才压缩
nodelaycompress                        覆盖 delaycompress 选项，转储同时压缩。
missingok                                 如果日志丢失，不报错继续滚动下一个日志
errors address                           专储时的错误信息发送到指定的Email 地址
ifempty                                    即使日志文件为空文件也做轮转，这个是logrotate的缺省选项。
notifempty                               当日志文件为空时，不进行轮转
mail address                             把转储的日志文件发送到指定的E-mail 地址
nomail                                     转储时不发送日志文件
olddir directory                         转储后的日志文件放入指定的目录，必须和当前日志文件在同一个文件系统
noolddir                                   转储后的日志文件和当前日志文件放在同一个目录下
sharedscripts                           运行postrotate脚本，作用是在所有日志都轮转后统一执行一次脚本。如果没有配置这个，那么每个日志轮转后都会执行一次脚本
prerotate                                 在logrotate转储之前需要执行的指令，例如修改文件的属性等动作；必须独立成行
postrotate                               在logrotate转储之后需要执行的指令，例如重新启动 (kill -HUP) 某个服务！必须独立成行
daily                                       指定转储周期为每天
weekly                                    指定转储周期为每周
monthly                                  指定转储周期为每月
rotate                               指定日志文件删除之前转储的次数，0 指没有备份，5 指保留5 个备份
dateext                                  使用当期日期作为命名格式
dateformat .%s                       配合dateext使用，紧跟在下一行出现，定义文件切割后的文件名，必须配合dateext使用，只支持 %Y %m %d %s 这四个参数
size(或minsize) log-size            当日志文件到达指定的大小时才转储，log-size能指定bytes(缺省)及KB (sizek)或MB(sizem).
当日志文件 >= log-size 的时候就转储。 以下为合法格式
size = 5 或 size 5 （>= 5 个字节就转储）
size = 100k 或 size 100k
size = 100M 或 size 100M
size = 1G 或 size 1G
```
## 示例
对/var/log/messages转储设置规则，当1G大小的时候才转储，最多存在4个备份
```
[root@master1 ~]# cat  /etc/logrotate.d/messages 
/var/log/messages
{
    maxage 365
    rotate 4
    notifempty
    copytruncate
    missingok
    size 1G
    sharedscripts
    postrotate
        /usr/bin/systemctl kill -s HUP rsyslog.service >/dev/null 2>&1 || true
    endscript
}
```
使用`logrotate /etc/logrotate.d/messages -v`命令执行转储，如果/var/log/messages大小没超过1G不会转储，使用命令将其大小变为大于1G：`dd if=/dev/zero of=/var/log/messages bs=1M count=1025`，再次执行命令才会转储。