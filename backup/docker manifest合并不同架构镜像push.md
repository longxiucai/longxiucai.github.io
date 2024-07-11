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