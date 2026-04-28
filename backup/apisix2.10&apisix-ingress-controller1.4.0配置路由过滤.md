参考：https://625a9090d04b9a6953165811--2-11-old-docs-apache-apisix.netlify.app/zh/docs/apisix/2.10/plugins/uri-blocker
使用uri-blocker插件，该插件可帮助我们拦截用户请求，只需要指定block_rules即可。
# 使用方式
利用ApisixRoute自定义资源配置路由并且配置路由插件
如下示例配置访问`http://lyx.cn:30233/test/path/1`、`https:/lyx.cn:30234/test/path/1`不转发到后端直接返回200
```
apiVersion: apisix.apache.org/v2beta3
kind: ApisixRoute
metadata:
  name: test-route
  namespace: test
spec:
  http:
  - backends:
    - serviceName: test-service
      servicePort: 5000
    match:
      hosts:
      - lyx.cn
      paths:
      - /test/path/1
    name: test
    plugins:
      - name: uri-blocker
        enable: true
        config:
          block_rules:
            - "^/test/path/1$"  # 精确匹配 /test/path/1
          rejected_code: 200  # 返回 200，而不是默认的 403
          rejected_msg: "Request blocked by APISIX"
```

