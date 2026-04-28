# 通过manifest
1、镜像仓库中有2个架构的镜像且tag不一致，没有则push上去
```
docker push  harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine-arm64
docker push  harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine-amd64
```
2、创建manifest
```
docker manifest create harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine \
--amend harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine-amd64 \
--amend harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine-arm64
```
3、push manifest
```
 docker manifest push harbor.yourharbor.com/docker.io/timberio/vector:0.39.0-alpine   
```

# 通过buildx
确保 docker buildx 已经配置好：
```
docker buildx create --use
docker buildx inspect --bootstrap
```
首先，使用`docker buildx imagetools inspect`查看 velero/velero:v1.14.0 是否支持多架构。
```
lyx@Hahahaha:~$ docker buildx imagetools inspect velero/velero:v1.14.0
Name:      docker.io/velero/velero:v1.14.0
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:b871c72cd59908f5ca1ee1690952085b628e010771dba1485f2ed6d8d5e917fe
           
Manifests: 
  Name:        docker.io/velero/velero:v1.14.0@sha256:69b02ee0edacc982b8edcae34236b596170b955dbbf3ca3002a8b3044b7daad1
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/amd64
               
  Name:        docker.io/velero/velero:v1.14.0@sha256:1878708c2f7feed45cc7223f86a5644662cee8900895138a9c77121eb4d42eae
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/arm64
               
  Name:        docker.io/velero/velero:v1.14.0@sha256:c87dde6af797d29beeb829db41318f8c4ede7a6c85b51a205b59256a2b6f1e21
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.digest: sha256:69b02ee0edacc982b8edcae34236b596170b955dbbf3ca3002a8b3044b7daad1
    vnd.docker.reference.type:   attestation-manifest
               
  Name:        docker.io/velero/velero:v1.14.0@sha256:a2c4d3ddea2d2d95928eb9cef71701fbcccb06e3bf928d4bd6f26ec8000de9de
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.type:   attestation-manifest
    vnd.docker.reference.digest: sha256:1878708c2f7feed45cc7223f86a5644662cee8900895138a9c77121eb4d42eae

```
接下来，将这两个架构的镜像标记为你的 Harbor 仓库地址，并创建多架构镜像：
```
docker buildx imagetools create --tag harbor.yourharbor.com/docker.io/velero/velero:v1.14.0  \
docker.io/velero/velero:v1.14.0@sha256:69b02ee0edacc982b8edcae34236b596170b955dbbf3ca3002a8b3044b7daad1  \
docker.io/velero/velero:v1.14.0@sha256:1878708c2f7feed45cc7223f86a5644662cee8900895138a9c77121eb4d42eae
```