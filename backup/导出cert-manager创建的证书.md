```
#!/bin/bash

# 创建一个目录存放导出的证书
mkdir -p exported_certificates
cd exported_certificates || exit

# 获取所有命名空间
namespaces=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')

# 遍历每个命名空间
for ns in $namespaces; do
    echo "Processing namespace: $ns"
    
    # 获取该命名空间中所有包含tls证书的secret（使用临时文件避免管道为空的问题）
    temp_file=$(mktemp)
    kubectl get secrets -n "$ns" -o jsonpath='{range .items[?(@.type=="kubernetes.io/tls")]}{.metadata.name}{"\n"}{end}' 2>/dev/null > "$temp_file"
    secrets=$(cat "$temp_file")
    rm "$temp_file"
    
    # 如果有符合条件的secret，进行处理
    if [ -n "$secrets" ]; then
        # 为每个命名空间创建子目录
        mkdir -p "$ns"
        cd "$ns" || continue
        
        # 遍历每个secret
        while IFS= read -r secret; do
            echo "  Exporting secret: $secret"
            
            # 导出CA证书（如果存在）
            if kubectl get secret "$secret" -n "$ns" -o jsonpath='{.data.ca\.crt}' > /dev/null 2>&1; then
                kubectl get secret "$secret" -n "$ns" -o jsonpath='{.data.ca\.crt}' | base64 -d > "${ns}_${secret}_ca.crt"
            fi
            
            # 导出tls证书
            kubectl get secret "$secret" -n "$ns" -o jsonpath='{.data.tls\.crt}' | base64 -d > "${ns}_${secret}_tls.crt"
            
            # 导出tls私钥
            kubectl get secret "$secret" -n "$ns" -o jsonpath='{.data.tls\.key}' | base64 -d > "${ns}_${secret}_tls.key"
        done <<< "$secrets"
        
        cd .. || exit
    else
        echo "  No TLS secrets found in namespace: $ns"
    fi
done

echo "Certificate export completed. Files are in exported_certificates directory."
```