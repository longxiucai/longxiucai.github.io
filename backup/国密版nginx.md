# 编译部署（nginx-1.24为例）
1. 下载gmssl_openssl_1.1_bxx.tar.gz到/root/下

打开地址 https://www.gmssl.cn/gmssl/index.jsp 
选择架构下载
<img width="1558" height="613" alt="Image" src="https://github.com/user-attachments/assets/3e9a0e6b-59ca-4d79-a11d-fed3ffe9e979" />

2. 解压 tar xzfm gmssl_openssl_1.1_bxx.tar.gz -C /usr/local
3. 下载[nginx-1.24.0.tar.gz](http://nginx.org/download/nginx-1.24.0.tar.gz)到/root/下
4. 解压 tar xzfm nginx-1.24.0.tar.gz
5. 进入目录 cd /root/nginx-1.24.0
6. 编辑auto/lib/openssl/conf，将全部$OPENSSL/.openssl/修改为$OPENSSL/并保存(sed -i 's|$OPENSSL/.openssl/|$OPENSSL/|g'  auto/lib/openssl/conf)
7. 编译配置
```
./configure \
--without-http_gzip_module \
--with-http_ssl_module \
--with-http_stub_status_module \
--with-http_v2_module \
--with-stream \
--with-file-aio \
--with-openssl="/usr/local/gmssl"
```
8. 编译安装
```
make install
```
9. /usr/local/nginx即为生成的nginx目录
> [ !TIP ]
> 可能需要使用`yum install -y zlib zlib-devel pcre pcre-devel`或者`apt-get install libpcre3 libpcre3-dev zlib1g zlib1g-dev`

# 直接下载
打开地址 https://www.gmssl.cn/gmssl/index.jsp 
<img width="1443" height="611" alt="Image" src="https://github.com/user-attachments/assets/a1574f62-f243-4fd8-9b99-edac252708ae" />

# 测试：
自己使用gmssl生成证书，即根据[sm2国密证书创建](https://longxiucai.github.io/post/84.html)文中提供的方法
需要到下面地址中解密nginx-sm2.key之后nginx才能使用
https://www.gmcrt.cn/gmcrt/index.jsp
<img width="1595" height="519" alt="Image" src="https://github.com/user-attachments/assets/6a4120c0-2608-4271-9994-cf27f790da3c" />

将nginx-sm2.cert与nginx-sm2.decrypted.pem放到/usr/local/nginx/conf/cert/下

/usr/local/nginx/conf/nginx.conf配置如下
```
worker_processes  auto;
error_log  /var/log/nginx/error.log;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;
    server {
        listen 80;
        return 301 https://$host$request_uri;
    }
    server {
        listen 443 ssl;
        # 自己的证书
        ssl_certificate /usr/local/nginx/conf/cert/nginx-sm2.cert;
        ssl_certificate_key /usr/local/nginx/conf/cert/nginx-sm2.decrypted.pem; ##解密之后的key
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
	#配置ssl证书所需的加密套件
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:AES128-SHA:DES-CBC3-SHA:ECC-SM4-CBC-SM3:ECC-SM4-GCM-SM3;
        ssl_verify_client off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        root /usr/local/nginx/html;
        index index.html;
        location / {
            try_files $uri $uri/ =404;
        }
    }
}

```

# nginx配置
## 配置示例(国密单向)
```
server
{
  listen 0.0.0.0:1443 ssl;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:AES128-SHA:DES-CBC3-SHA:ECC-SM4-CBC-SM3:ECC-SM4-GCM-SM3;
  ssl_verify_client off;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.sig.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.sig.key.pem;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.enc.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.enc.key.pem;
  
  location /
  {
    root html;
    index index.html index.htm;
  }
}
```
注释：测试证书使用[www.gmcrt.cn](https://www.gmcrt.cn/)签发。
## 配置示例(国密双向)
```
server
{
  listen 0.0.0.0:2443 ssl;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:AES128-SHA:DES-CBC3-SHA:ECC-SM4-CBC-SM3:ECC-SM4-GCM-SM3:ECDHE-SM4-CBC-SM3:ECDHE-SM4-GCM-SM3;
  
  ssl_verify_client on;
  ssl_client_certificate keystore/sm2.ca.pem;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.sig.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.sig.key.pem;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.enc.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.enc.key.pem;
  
  location /
  {
    root html;
    index index.html index.htm;
  }
}
```
注释：测试证书使用[www.gmcrt.cn](https://www.gmcrt.cn/)签发，浏览器国密U盾可使用[国密U盾伴侣](https://www.gmcrt.cn/gmcrt/index.jsp?Idx=6)导入证书/私钥。
## 配置示例(国密/RSA单向自适应)
```
server
{
  listen 0.0.0.0:3443 ssl;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:AES128-SHA:DES-CBC3-SHA:ECC-SM4-CBC-SM3:ECC-SM4-GCM-SM3;
  ssl_verify_client off;
  
  ssl_certificate keystore/rsa.demo1.gmssl.cn.crt.pem;
  ssl_certificate_key keystore/rsa.demo1.gmssl.cn.key.pem;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.sig.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.sig.key.pem;
  
  ssl_certificate keystore/sm2.demo1.gmssl.cn.enc.crt.pem;
  ssl_certificate_key keystore/sm2.demo1.gmssl.cn.enc.key.pem;
  
  location /
  {
    root html;
    index index.html index.htm;
  }
}
```

限制
1. 试用版本每季度末失效，国密SSL协议会异常或者错误，需更新库，重新链接。请勿用于正式/生产环境，后果自负。
