```
# 创建buildx构建器实例（如果不存在）
BUILDER_NAME="build-multiarch"
if ! docker-buildx ls | grep -q $BUILDER_NAME; then
    echo "📦 创建多架构构建器..."
    docker-buildx create --name $BUILDER_NAME --driver-opt network=host \
        --driver-opt env.http_proxy=http://127.0.0.1:7890 \
        --driver-opt env.https_proxy=http://127.0.0.1:7890 \
        --driver-opt env.HTTP_PROXY=http://127.0.0.1:7890 \
        --driver-opt env.HTTPS_PROXY=http://127.0.0.1:7890 \
        --use
else
    echo "📦 使用已存在的构建器: $BUILDER_NAME"
    docker-buildx use $BUILDER_NAME
fi

# 启用binfmt_misc支持（用于交叉编译）
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```