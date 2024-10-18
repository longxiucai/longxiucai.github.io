## Dockerfile
```
# Build the manager binary
FROM --platform=${BUILDPLATFORM} golang:1.19 as builder
WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# Copy the go source
COPY pkg/ pkg/
COPY cmd/ cmd/
COPY internal/ internal/
COPY lib/ lib/
COPY controllers/ controllers/
COPY vendor/ vendor/

# Build
ARG TARGETARCH
RUN echo "Building for $TARGETARCH platform" && \
    CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -mod=vendor -a -o controller cmd/machine-config-controller/main.go

# Use distroless as minimal base image to package the manager binary
FROM --platform=${BUILDPLATFORM} harbor.kylincloudnative.com/docker.io/library/alpine:latest
WORKDIR /
COPY --from=builder /workspace/controller .
USER 65532:65532

ENTRYPOINT ["/controller"]
```
## Makefile
```
PLATFORMS ?= linux/arm64,linux/amd64 ###,linux/s390x,linux/ppc64le
.PHONY: docker-buildx
#make docker-buildx IMG=harbor.kylincloudnative.com/longyuxiang/mco-controller:v1-20231221
docker-buildx: version  ## Build and push docker image for the manager for cross-platform support
	- docker buildx create --name project-v3-builder
	- docker buildx use project-v3-builder
	- docker buildx build --push --platform=$(PLATFORMS) --tag ${IMG} -f Dockerfile .
	- docker buildx rm project-v3-builder
```
## use
```
make docker-buildx IMG=harbor.xxx.com/longyuxiang/mco-daemon:v1-20231221
```