测试版本：ingress-nginx-controller:v1.7.0-2
## 开启access_by_lua_block，让acess阶段执行插件（适用于优先级分流）
```
kubectl exec -it  -n ingress-nginx ingress-nginx-controller-qdwws    -- cat template/nginx.tmpl > nginx.tmpl
```
修改nginx.tmpl，下列access_by_lua_block部分是被注释掉的，去掉注释，增加plugins.run()
```
location {{ $path }} {
    ...
            # be careful with `access_by_lua_block` and `satisfy any` directives as satisfy any
            # will always succeed when there's `access_by_lua_block` that does not have any lua code doing `ngx.exit(ngx.DECLINED)`
            # other authentication method such as basic auth or external auth useless - all requests will be allowed.
            access_by_lua_block {
                plugins.run()
            }

```
将nginx.tmpl文件放到configmap中
```
kubectl create cm -n ingress-nginx nginx-custom-template-config --from-file nginx.tmpl
```
修改ingress-nginx-controller的ds，增加nginx-configmap的挂载，保存如下文件为ingress-volume-patch.yaml后执行`kubectl patch -n ingress-nginx daemonsets.apps ingress-nginx-controller  --patch-file ingress-volume-patch.yaml`
```
spec:
  template:
    spec:
      containers:
      - name: ingress-nginx-controller
        volumeMounts:
        - name: nginx-custom-template
          mountPath: /etc/nginx/template/nginx.tmpl
          subPath: nginx.tmpl
      volumes:
      - name: nginx-custom-template
        configMap:
          name: nginx-custom-template-config
```

## 增加自定义插件并启用
### 增加插件（插件中代码还需要调试优化）
创建如下ConfigMap，必须为main.lua，通过定义并返回`_M`来导出函数

脚本说明:
* 配置加载机制：
    * 从缓存获取配置，缓存过期时间为 30 秒
    * 缓存未命中时从文件读取配置并更新缓存
* 核心逻辑：
    * 判断当前请求的域名是否属于低优先级列表
    * 增加全局连接计数和（如果是低优先级）低优先级连接计数
    * 当全局连接数超过8000且低优先级连接数超过3000，返回 503 错误
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-plugins
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/component: controller
data:
  main.lua: |
    local ngx = ngx
    local cjson = require "cjson"
    local _M = {}
    local CONFIG_TTL = 30

    -- 读取配置
    local function get_config()
      local CONFIG_PATH = "/etc/nginx/conf.d/conn_limit_config.json"
      local config_cache = ngx.shared.config_cache
      local cached = config_cache:get("config")
      if cached then
          return cjson.decode(cached)
      end
      local file = io.open(CONFIG_PATH, "r")
      if not file then
          ngx.log(ngx.ERR, "无法读取配置文件: ", CONFIG_PATH)
          ngx.exit(500)
      end
      local content = file:read("*a")
      file:close()
      local config = cjson.decode(content)
      config_cache:set("config", content, CONFIG_TTL)
      return config
    end

    -- 判断域名是否在列表中
    local function is_in_list(domain, list)
      for _, d in ipairs(list) do
          if d == domain then return true end
      end
      return false
    end

    -- 清理计数
    local function cleanup(is_low, host)
      local low_conns = ngx.shared.low_conns
      local global_conns = ngx.shared.global_conns
      local new_global = global_conns:incr("total", -1, 0) or 0
      local new_low = is_low and (low_conns:incr("count", -1, 0) or 0) or 0
      ngx.log(ngx.INFO, "[结束阶段计数] Host: ", host or "",
              " | 全局连接=", new_global,
              " | 低优连接=", new_low)
    end

    -- access 阶段：连接数统计与限流
    function _M.access()
      ngx.log(ngx.INFO, "[conn-limit-TEST] access 阶段执行！")  -- 新增测试日志
      local low_conns = ngx.shared.low_conns
      local global_conns = ngx.shared.global_conns
      local config = get_config()
      local host = ngx.var.host or ""
      local is_low = is_in_list(host, config.low_priority.domains or {})

      local global_threshold = config.global_threshold or 1
      local low_max = config.low_priority.max_conns or 1

      -- 增加计数
      local current_global = global_conns:incr("total", 1, 0)
      local current_low = is_low and low_conns:incr("count", 1, 0) or 0

      ngx.log(ngx.INFO, "[访问阶段计数] Host: ", host,
              " | 全局连接=", current_global,
              " | 低优连接=", current_low)

      -- 限制低优请求
      if current_global >= global_threshold and is_low and current_low > low_max then
          ngx.log(ngx.WARN, "[拒绝请求] Host=", host,
                  " | 全局=", current_global,
                  " | 低优=", current_low)
          cleanup(is_low, host)
          ngx.status = 503
          ngx.say("Service busy (low-prio quota exceeded: ", current_low, "/", low_max, ")")
          return ngx.exit(503)
      end

      -- 保存上下文
      ngx.ctx.host = host
      ngx.ctx.is_low = is_low
    end

    -- log 阶段：连接数释放
    function _M.log()
      local host = ngx.ctx.host
      local is_low = ngx.ctx.is_low
      if host then
          cleanup(is_low, host)
      end
    end
    -- 客户端中断处理
    function on_abort_phase()
      local host = ngx.ctx.host
      local is_low = ngx.ctx.is_low
      if host then
          ngx.log(ngx.WARN, "[客户端中断] Host=", host)
          cleanup(is_low, host)
      end
    end
    return _M
```
挂载到ingress-nginx-controller的ds中，保存如下文件为ingress-plugins-patch.yaml后执行`kubectl patch -n ingress-nginx daemonsets.apps ingress-nginx-controller --patch-file ingress-plugins-patch.yaml`
```
spec:
  template:
    spec:
      containers:
      - name: ingress-nginx-controller
        volumeMounts:
        - name: plugin-volume
          mountPath: /etc/nginx/lua/plugins/dynamic_conn_limit/main.lua ##必须在/etc/nginx/lua/plugins/下面，目录为插件名称，文件为main.lua
          subPath: main.lua
      volumes:
      - name: plugin-volume
        configMap:
          name: ingress-nginx-plugins
```
### 启用插件
修改ingress-nginx-controller的配置`kubectl edit cm -n ingress-nginx ingress-nginx`增加字段`plugins: dynamic_conn_limit`以及`lua-shared-dicts: global_conns:10m,low_conns:10m,config_cache:10m`增加共享内存
### 配置文件
创建如下ConfigMap,配置全局连接数为8000，nginx1.org为高优域名，nginx.org为低优域名，低优域名最大连接数为3000，实现
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-conn-config
  namespace: ingress-nginx
data:
  conn_limit_config.json: |
    {
      "global_threshold": 8000,
      "high_priority_domains": ["nginx1.org"],
      "low_priority": {
        "domains": ["nginx.org"],
        "max_conns": 3000
      }
    }
```

##  注解中插入lua脚本即可在access阶段执行下面脚本（不适用优先级分流）
```
     nginx.ingress.kubernetes.io/server-snippet: |
      access_by_lua_file /etc/nginx/lua/scripts/dynamic-conn-limit.lua;
```
手动将脚本挂载进去即可，具体步骤参考文档上面，此种方法只能在access阶段执行，当连接释放时，存储的连接数变量无法减少。

## 存在问题
不知道是版本过低还是ingress-nginx-controller的bug，配置完成之后经常出现插件或者lua脚本注入执行不生效的问题，任何日志没打印，导致脚本的功能无法生效。但是脚本中存在错误的时候加载会报错，当多次者修改配置再还原，重启等操作之后，插件或者lua脚本功能**可能**会生效。