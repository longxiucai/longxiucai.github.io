
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml 
再创建如下资源：
```
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: jaeger-inmemory-instance
spec:
  upgradeStrategy: automatic
  image: registry.your-registry.org/jaegertracing/jaeger:2.0.0-rc2
  ports:
  - name: jaeger
    port: 16686
  config:
    service:
      extensions: [jaeger_storage, jaeger_query]
      pipelines:
        traces:
          receivers: [otlp]    
          exporters: [jaeger_storage_exporter]
    extensions:
      jaeger_query:
        storage:
          traces: memstore
      jaeger_storage:
        backends:
          memstore:
            memory:
              max_traces: 100000
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    exporters:
      jaeger_storage_exporter:
        trace_storage: memstore
```