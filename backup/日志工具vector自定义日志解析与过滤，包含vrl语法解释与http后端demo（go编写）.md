源码：https://github.com/vectordotdev/vector

helm repo:   https://helm.vector.dev/

repo chart: https://github.com/vectordotdev/helm-charts/tree/develop

文档： https://vector.dev/docs/

# 验证与测试方法
1、当前目录中创建vector.yaml文件，文件名必须为vector.yaml
2、执行命令验证
```
alias vector='nerdctl run -it -v $(pwd)/:/etc/vector/ -v /var/log/:/var/log/ --rm harbor.kylincloudnative.com/docker.io/timberio/vector:0.39.0-alpine'
nerdctl pull harbor.kylincloudnative.com/docker.io/timberio/vector:0.39.0-alpine
vector
```
# ingress-controller日志示例(/var/log/test-pod-log-ingress)
```
2024-07-15T14:28:37+08:00       error   ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_10250"}
2024-07-15T14:28:37+08:00       error   ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_10250"}
2024-07-15T14:28:37+08:00       warn    ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_10255"}
2024-07-15T14:28:37+08:00       warn    ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_4194"}
2024-07-15T14:28:38+08:00       error   ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_10250"}
2024-07-15T14:28:38+08:00       warn    ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_10255"}
2024-07-15T14:28:38+08:00       warn    ingress/controller.go:653       upstream is not referenced      {"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_4194"}
```
# vector.yaml配置
```
api:
  enabled: true
  address: 127.0.0.1:58686
  playground: false
sources:
  ingress:
    type: file
    include: 
      - /var/log/test-pod-log-ingress
    data_dir: /etc/vector/workdir
transforms:
  parse_ingress:
    inputs:
      - ingress
    type: remap
    source: |
      . |= parse_regex!(.message, r'^(?P<timestamp>\d+-\d+-\d+T\d+:\d+:\d+\+\d+:\d+)\s+(?P<log_level>\w+)\s+(?P<file_path>[\w./:-]+)\s+(?P<message>[^\{]+)\s+(?P<structured_data>\{.*\})$')
      .structured_data = parse_json!(.structured_data)
      .structured_data = parse_key_value!(.structured_data.cluster, key_value_delimiter: "=" )
      . = merge(., .structured_data)
      del(.structured_data)
  ingress_filter:
    type: filter
    inputs:
      - parse_ingress
    condition:
      type: vrl
      source: .log_level == "error"
sinks:
  http_log:
    inputs:
      - ingress_filter
    uri: http://10.42.16.241:8080/push
    type: http
    encoding:
      codec: json
  console_log:
    inputs:
      - parse_ingress
    type: console
    encoding:
      codec: json
```
## sources配置说明
直接从文件读取日志
## transforms配置说明
1、**parse_ingress**使用正则表达式解析日志的timestamp、log_level、file_path、message、structured_data，然后将structured_data再次通过key-value的方式解析。
* 第一行parse_regex，通过正则表达式命名捕获组，使用方法：`(?P<name>ABC)`匹配ABC字符串
* 第二行parse_json，上一步中structured_data匹配到了`{"cluster": "name=default; base_url=http://apisix-admin.apisix-system:9180/apisix/admin", "upstream": "default_kubelet_4194"} ` 将其作为json数据解析
* 第三行parse_key_value，将上一步中解析的数据.structured_data.cluster通过key=values的格式解析
* 第四行merge解析完成的structured_data  此时解析完成之后生成了` "base_url":"http://apisix-admin.apisix-system:9180/apisix/admin"，"name":"default;" ` 。此时日志解析为：
```
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"ce629edcbdf8","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","structured_data":{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","name":"default;"},"timestamp":"2024-07-15T14:28:38+08:00"}
```
* 第五行删除structured_data本身这个完整的json数据。此时日志解析完成
```
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:38+08:00"}
```
2、**ingress_filter**将**parse_ingress**的数据过滤，只取log_level为error的日志。
## sink配置说明
1、http_log将ingress_filter过滤后的日志发送至指定url，服务端收到数据如下
```
{Message:upstream is not referenced File:/var/log/test-pod-log-ingress Host:ce629edcbdf8 BaseUrl:http://apisix-admin.apisix-system:9180/apisix/admin FilePath:ingress/controller.go:653 LogLevel:error}
{Message:upstream is not referenced File:/var/log/test-pod-log-ingress Host:ce629edcbdf8 BaseUrl:http://apisix-admin.apisix-system:9180/apisix/admin FilePath:ingress/controller.go:653 LogLevel:error}
{Message:upstream is not referenced File:/var/log/test-pod-log-ingress Host:ce629edcbdf8 BaseUrl:http://apisix-admin.apisix-system:9180/apisix/admin FilePath:ingress/controller.go:653 LogLevel:error}
```
2、console_log将解析后，没有过滤的完整日志答应到控制台，解析完成之后数据如下
```
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"error","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:37+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"error","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:37+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:37+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:37+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"error","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:38+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:38+08:00"}
{"base_url":"http://apisix-admin.apisix-system:9180/apisix/admin","file":"/var/log/test-pod-log-ingress","file_path":"ingress/controller.go:653","host":"960f99dafe96","log_level":"warn","message":"upstream is not referenced","name":"default;","source_type":"file","timestamp":"2024-07-15T14:28:38+08:00"}
```
# 接收日志后端demo（语言：Golang，http框架：gin）
```
type LogData struct {
    // 根据你的Vector数据格式定义结构体字段
    Message string `json:"message"`
    // 添加更多字段...
    File     string `json:"file"`
    Host     string `json:"host"`
    BaseUrl  string `json:"base_url"`
    FilePath string `json:"file_path"`
    LogLevel string `json:"log_level"`
}
 
func pushTest() {
    router := gin.Default()
    router.POST("/push", func(c *gin.Context) {
        body, err := c.GetRawData()
        if err != nil {
            c.String(500, "Error reading request body")
            return
        }
        var LogData []LogData
        json.Unmarshal(body, &LogData)
        // Respond with a message including the received data
        responseMessage := fmt.Sprintf("Hello, this is a POST response. Post data: %s", string(body))
        for _, ld := range LogData {
            fmt.Printf("%+v\n", ld)
        }
        c.String(200, responseMessage)
    })
    router.Run(":8080")
}
```
