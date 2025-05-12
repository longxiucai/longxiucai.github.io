# curl -w参数说明
curl 命令提供了 -w 参数，允许按照指定的格式打印与请求相关的信息，其中部分信息可以通过特定的变量表示，如 status_code、size_download、time_namelookup 等等。由于我们关注的是耗时分析，因此只需关注与请求延迟相关的变量（以 time_ 开头的变量）。各个阶段的耗时变量如下所示：
```
$ cat curl-format.txt
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
```
# curl 内部延迟变量
|变量名称	|说明|
|---|---|
time_namelookup	|从请求开始到域名解析完成的时间
time_connect	|从请求开始到 TCP 三次握手完成的时间
time_appconnect	|从请求开始到 TLS 握手完成的时间
time_pretransfer	|从请求开始到发送第一个 GET/POST 请求的时间
time_redirect	|重定向过程的总时间，包括 DNS 解析、TCP 连接和内容传输前的时间
time_starttransfer	|从请求开始到首个字节接收的时间
time_total	|请求总耗时
# 示例
```
$ curl -w "@curl-format.txt" -o /dev/null -s 'https://github.com'
    time_namelookup:  0.000017
       time_connect:  0.000061
    time_appconnect:  1.882753
      time_redirect:  0.000000
   time_pretransfer:  1.882799
 time_starttransfer:  1.948631
                    ----------
         time_total:  2.070605
```
# HTTPS 请求各阶段耗时计算
|耗时|	说明|
|---|---|
域名解析耗时 = time_namelookup	|从发起请求到获取域名对应的 IP 地址（DNS 解析成功）的时间
TCP 握手耗时 = time_connect - time_namelookup	|建立 TCP 连接所需的时间
SSL 耗时 = time_appconnect - time_connect	TLS |握手及加解密处理时间
服务器处理请求耗时 = time_total - time_starttransfer	|服务器处理请求的时间
TTFB = time_starttransfer	|从请求开始到接收服务器首个字节的时间
总耗时 = time_total	|整个 HTTPS 的请求耗时

