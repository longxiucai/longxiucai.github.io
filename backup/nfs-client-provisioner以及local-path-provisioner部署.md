# nfs-client
注意修改镜像地址（spec.image）、nfs的IP地址与共享路径（volumes与env两处）
```
# Source: pre-resource/templates/nfs.yaml
kind: ServiceAccount
apiVersion: v1
metadata:
  name: nfs-client-provisioner-common
  namespace: nfs-storage
---
# Source: pre-resource/templates/nfs.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-storage
provisioner: common-nfs-storage
parameters:
  archiveOnDelete: "true"
---
# Source: pre-resource/templates/nfs.yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-provisioner-runner-common
rules:
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "delete"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "update", "patch"]
---
# Source: pre-resource/templates/nfs.yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-client-provisioner-common
  namespace: nfs-storage
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner-common
    namespace: nfs-storage
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner-common
  apiGroup: rbac.authorization.k8s.io
---
# Source: pre-resource/templates/nfs.yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner-common
  namespace: nfs-storage
rules:
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
---
# Source: pre-resource/templates/nfs.yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner-common
  namespace: nfs-storage
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner-common
    namespace: nfs-storage
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner-common
  apiGroup: rbac.authorization.k8s.io
---
# Source: pre-resource/templates/nfs.yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nfs-client-provisioner-common
  namespace: nfs-storage
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      k8s-app: nfs-client-provisioner-common
  template:
    metadata:
      labels:
        k8s-app: nfs-client-provisioner-common
    spec:
      imagePullSecrets:
      - name: regcred
      serviceAccountName: nfs-client-provisioner-common
      containers:
        - name: nfs-client-provisioner-common
          image: nfs-client-provisioner:20230912
          imagePullPolicy: IfNotPresent
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
            - mountPath: /etc/localtime
              name: localtime              
          ports:
            - containerPort: 9200
          env:
            - name: PROVISIONER_NAME
              value: common-nfs-storage 
            - name: NFS_SERVER
              value: XX.XX.XX.XX
            - name: NFS_PATH
              value: /XX/xx
      volumes:
        - name: nfs-client-root
          nfs:
            server: XX.XX.XX.XX
            path: /XX/xx
        - name: localtime
          hostPath:
            path: /etc/localtime

```
# local-path
注意修改路径（config.json）
```
apiVersion: v1
kind: Namespace
metadata:
  name: local-path-storage

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: local-path-provisioner-service-account
  namespace: local-path-storage

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: local-path-provisioner-role
rules:
  - apiGroups: [ "" ]
    resources: [ "nodes", "persistentvolumeclaims", "configmaps" ]
    verbs: [ "get", "list", "watch" ]
  - apiGroups: [ "" ]
    resources: [ "endpoints", "persistentvolumes", "pods" ]
    verbs: [ "*" ]
  - apiGroups: [ "" ]
    resources: [ "events" ]
    verbs: [ "create", "patch" ]
  - apiGroups: [ "storage.k8s.io" ]
    resources: [ "storageclasses" ]
    verbs: [ "get", "list", "watch" ]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: local-path-provisioner-bind
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: local-path-provisioner-role
subjects:
  - kind: ServiceAccount
    name: local-path-provisioner-service-account
    namespace: local-path-storage

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-path-provisioner
  namespace: local-path-storage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: local-path-provisioner
  template:
    metadata:
      labels:
        app: local-path-provisioner
    spec:
      serviceAccountName: local-path-provisioner-service-account
      containers:
        - name: local-path-provisioner
          image: local-path-provisioner:v0.0.24
          imagePullPolicy: IfNotPresent
          command:
            - local-path-provisioner
            - --debug
            - start
            - --config
            - /etc/config/config.json
          volumeMounts:
            - name: config-volume
              mountPath: /etc/config/
          env:
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
      volumes:
        - name: config-volume
          configMap:
            name: local-path-config

---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete

---
kind: ConfigMap
apiVersion: v1
metadata:
  name: local-path-config
  namespace: local-path-storage
data:
  config.json: |-
    {
            "nodePathMap":[
            {
                    "node":"DEFAULT_PATH_FOR_NON_LISTED_NODES",
                    "paths":["/opt/local-path-provisioner"]
            }
            ]
    }
  setup: |-
    #!/bin/sh
    set -eu
    mkdir -m 0777 -p "$VOL_DIR"
  teardown: |-
    #!/bin/sh
    set -eu
    rm -rf "$VOL_DIR"
  helperPod.yaml: |-
    apiVersion: v1
    kind: Pod
    metadata:
      name: helper-pod
    spec:
      containers:
      - name: helper-pod
        image: busybox:1.36.0
        imagePullPolicy: IfNotPresent

```