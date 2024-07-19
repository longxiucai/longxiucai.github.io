# 详细步骤
1. **用户提交高级资源定义**：通过 kubectl apply -f deployment.yaml 或 API 请求来提交 Deployment、ReplicaSet 等高级资源定义。
2. **API Server 接收和验证**：API Server 接收请求后进行验证和授权。
3. **持久化到 etcd**：通过验证后，API Server 将高级资源定义存储到 etcd 中。
4. **controller-manager 监视和处理**：controller-manager 监视 etcd 中的高级资源，并创建或更新相应的 Pod 定义。
5. **创建或更新 Pod**：controller-manager 将 Pod 定义发送到 API Server，并存储到 etcd 中。
6. **调度器选择节点**：调度器监视未分配节点的 Pod，选择合适节点并更新 Pod 定义中的节点信息。
7. **Kubelet 接收和执行**：目标节点上的 Kubelet 获取 Pod 定义，并使用容器运行时启动容器。
8. **状态报告**：Kubelet 启动容器后，将 Pod 的状态报告给 API Server，API Server 更新 etcd 中的状态信息。
9. **网络配置**：网络插件为 Pod 分配 IP，并配置网络规则。
# 流程
```
User → Kubectl/API Request → API Server → Authentication & Authorization → Etcd (Persist State) 
→ controller-manager → Create/Update Pod → Scheduler → Select Node → Update Pod Spec 
→ Node's Kubelet → Container Runtime → Start Containers 
→ Kubelet Reports Status → API Server → Update Etcd
```