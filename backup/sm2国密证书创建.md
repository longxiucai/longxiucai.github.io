参考：http://gmssl.org/docs/quickstart.html
# GmSSL的编译、安装

### 下载源代码([zip](https://github.com/guanzhi/GmSSL/archive/master.zip))，解压缩至当前工作目录
```
$ unzip GmSSL-master.zip
```
### 编译与安装

#### Linux平台
```
$ mkdir build
$ cd build
$ cmake ..
$ make
$ make test
$ sudo make install
```
安装之后可以执行gmssl命令行工具检查是否成功
```
$ gmssl version
GmSSL 3.1.0 Dev
```
# 证书创建
```
COMMOMARG="-C CN -ST Beijing -O KylinSoft -OU kylincloud -pass 1234"
# 1.1 生成 SM2 根 CA 私钥（密码 1234，存储为 rootcakey.pem）
gmssl sm2keygen -pass 1234 -out rootca.key

# 1.2 生成根 CA 自签名证书（有效期 10 年，支持签发证书和 CRL）
gmssl certgen $COMMOMARG\
  -days 3650 \
  -CN "KylinSoft SM2 Root CA" \
  -key rootca.key \
  -out rootca.cert \
  -key_usage keyCertSign \
  -key_usage cRLSign

# 1.3 解析根 CA 证书，验证信息（可选，确认生成正确）
gmssl certparse -in rootca.cert


# 2.1 生成二级 CA 私钥（密码 1234，存储为 cakey.pem）
gmssl sm2keygen -pass 1234 -out ca.key

# 2.2 生成二级 CA 的证书请求（CSR，向根 CA 申请签名）
gmssl reqgen $COMMOMARG\
  -CN "KylinSoft SM2 Root CA" \
  -key ca.key \
  -out ca.csr       # 输出 CSR 文件

# 2.3 用根 CA 签名二级 CA 请求，生成二级 CA 证书
gmssl reqsign \
  -in ca.csr  \
  -days 3650    \
  -key_usage keyCertSign \
  -path_len_constraint 0  \
  -cacert rootca.cert  \
  -key rootca.key   \
  -pass 1234          \
  -out ca.cert          # 输出二级 CA 证书

# 2.4 解析二级 CA 证书，验证信息（可选）
gmssl certparse -in ca.cert


# 3.1 生成服务端 SM2 私钥（密码 1234，存储为 nginx-sm2-key.pem）
gmssl sm2keygen -pass 1234 -out nginx-sm2.key

# 3.2 生成服务端证书请求（CSR，关键：CN 填主域名，支持多 DNS 名称）
#                        # 主域名（必须正确，匹配服务端域名）  关联服务端私钥           输出服务端 CSR
gmssl reqgen $COMMOMARG -CN "nginx.example1.kylinos.cn"      -key nginx-sm2.key   -out nginx-sm2.csr

# 3.3 用二级 CA 签名服务端请求，生成服务端证书
gmssl reqsign \
  -in nginx-sm2.csr \
  -subject_dns_name "nginx.example1.kylinos.cn" \
  -subject_dns_name "server1.nginx.local" \
  -days 365 \
  -key_usage digitalSignature \
  -key_usage keyEncipherment \
  -cacert ca.cert   \
  -key ca.key   \
  -pass 1234      \
  -out nginx-sm2.cert

# 3.4 解析服务端证书，验证域名和用途（关键！确认配置正确）
gmssl certparse -in nginx-sm2.cert

# 3.5 验证证书
gmssl certverify -in nginx-sm2.cert -cacert ca.cert
```