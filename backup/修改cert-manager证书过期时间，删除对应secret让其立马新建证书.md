```
#!/bin/bash

# 配置部分 - 在这里设置目标月数
TARGET_MONTHS=120  # 例如36个月=3年

# 计算小时数（1个月按30天计算，1天=24小时）
HOURS_PER_MONTH=$((30 * 24))  # 720小时/月
TARGET_DURATION=$((TARGET_MONTHS * HOURS_PER_MONTH))"h"

# 创建日志文件
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="certificate_update_${TIMESTAMP}.log"
echo "===== 证书更新操作日志 - $(date) =====" > "$LOG_FILE"
echo "目标有效期: $TARGET_MONTHS 个月 ($TARGET_DURATION)" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 函数：等待secret创建
wait_for_secret() {
    local ns=$1
    local secret=$2
    local timeout=30
    local interval=2
    local count=0
    
    echo "  等待secret $ns/$secret 生成..."
    while ! kubectl get secret "$secret" -n "$ns" >/dev/null 2>&1; do
        sleep $interval
        count=$((count + interval))
        if [ $count -ge $timeout ]; then
            echo "  ⚠️ 超时：secret $ns/$secret 未在 $timeout 秒内生成"
            echo "超时：secret $ns/$secret 未生成" >> "$LOG_FILE"
            return 1
        fi
    done
    echo "  ✅ secret $ns/$secret 已生成"
    return 0
}

# 函数：检查证书过期时间
check_cert_expiry() {
    local ns=$1
    local secret=$2
    
    # 提取并解码证书
    cert_data=$(kubectl get secret "$secret" -n "$ns" -o jsonpath='{.data.tls\.crt}')
    if [ -z "$cert_data" ]; then
        echo "  ❌ 无法从 $ns/$secret 获取证书数据"
        echo "错误：无法从 $ns/$secret 获取证书数据" >> "$LOG_FILE"
        return 1
    fi
    
    # 解码并检查有效期
    expiry_date=$(echo "$cert_data" | base64 -d | openssl x509 -noout -enddate | cut -d= -f2)
    if [ -z "$expiry_date" ]; then
        echo "  ❌ 无法解析 $ns/$secret 的证书过期时间"
        echo "错误：无法解析 $ns/$secret 的证书过期时间" >> "$LOG_FILE"
        return 1
    fi
    
    # 转换为时间戳以便计算
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    current_timestamp=$(date +%s)
    days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    echo "  ******** 证书 $ns/$secret 过期时间: $expiry_date (约 $days_remaining 天)"
    echo "$ns/$secret 过期时间: $expiry_date (约 $days_remaining 天)" >> "$LOG_FILE"
    return 0
}

# 获取所有命名空间
namespaces=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')

# 记录总数统计
total_certs=0
updated_certs=0
failed_certs=0

echo "===== 开始证书更新流程 ====="
echo "目标有效期: $TARGET_MONTHS 个月 ($TARGET_DURATION)"
echo "日志将保存至: $LOG_FILE"
echo ""

# 遍历所有命名空间
for ns in $namespaces; do
    echo "处理命名空间: $ns"
    echo "处理命名空间: $ns" >> "$LOG_FILE"
    
    # 获取当前命名空间中的所有Certificate资源
    certs=$(kubectl get certificates -n "$ns" -o jsonpath='{.items[*].metadata.name}')
    
    if [ -z "$certs" ]; then
        echo "  未发现Certificate资源，跳过"
        echo "  未发现Certificate资源，跳过" >> "$LOG_FILE"
        echo ""
        continue
    fi
    
    # 遍历每个Certificate资源
    for cert in $certs; do
        total_certs=$((total_certs + 1))
        echo "  处理Certificate: $cert"
        echo "  处理Certificate: $cert" >> "$LOG_FILE"
        
        # 获取当前duration
        current_duration=$(kubectl get certificate "$cert" -n "$ns" -o jsonpath='{.spec.duration}')
        
        # 获取关联的secret名称
        secret_name=$(kubectl get certificate "$cert" -n "$ns" -o jsonpath='{.spec.secretName}')
        if [ -z "$secret_name" ]; then
            echo "  ❌ 无法获取 $ns/$cert 关联的secret名称"
            echo "  错误：无法获取关联的secret名称" >> "$LOG_FILE"
            failed_certs=$((failed_certs + 1))
            continue
        fi
        
        # 如果当前duration与目标不同，则进行更新
        if [ "$current_duration" != "$TARGET_DURATION" ]; then
            # 使用kubectl patch更新duration
            if kubectl patch certificate "$cert" -n "$ns" --type=merge -p "{\"spec\":{\"duration\":\"$TARGET_DURATION\"}}"; then
                echo "  ✅ 已更新 $ns/$cert: $current_duration -> $TARGET_DURATION"
                echo "  已更新: $current_duration -> $TARGET_DURATION" >> "$LOG_FILE"
                
                # 删除secret触发更新
                echo "  删除secret $secret_name 以触发证书更新..."
                if kubectl delete secret "$secret_name" -n "$ns" >/dev/null 2>&1; then
                    echo "  已删除secret $secret_name"
                    echo "  已删除secret: $secret_name" >> "$LOG_FILE"
                    
                    # 等待新secret生成
                    if wait_for_secret "$ns" "$secret_name"; then
                        # 检查新证书的过期时间
                        check_cert_expiry "$ns" "$secret_name"
                    fi
                    updated_certs=$((updated_certs + 1))
                else
                    echo "  ❌ 无法删除secret $secret_name"
                    echo "  错误：无法删除secret $secret_name" >> "$LOG_FILE"
                    failed_certs=$((failed_certs + 1))
                fi
            else
                echo "  ❌ 更新 $ns/$cert 失败"
                echo "  错误：更新Certificate失败" >> "$LOG_FILE"
                failed_certs=$((failed_certs + 1))
            fi
        else
            echo "  ⏭️ $ns/$cert 已为目标有效期，无需更新"
            echo "  无需更新：已为目标有效期" >> "$LOG_FILE"
            # 检查当前证书的过期时间
            check_cert_expiry "$ns" "$secret_name"
        fi
        echo ""
        echo "" >> "$LOG_FILE"
    done
done

# 输出总结信息
echo "===== 操作完成 ====="
echo "总处理Certificate资源: $total_certs"
echo "成功更新: $updated_certs"
echo "更新失败: $failed_certs"
echo "Certificate资源如下"
kubectl get certificates --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"/"}{.metadata.name}{" "}{.spec.duration}{"\n"}{end}'
echo "详细日志: $LOG_FILE"

echo ""
echo "更新总结:" >> "$LOG_FILE"
echo "总处理Certificate资源: $total_certs" >> "$LOG_FILE"
echo "成功更新: $updated_certs" >> "$LOG_FILE"
echo "更新失败: $failed_certs" >> "$LOG_FILE"
echo "操作完成时间: $(date)" >> "$LOG_FILE"
```