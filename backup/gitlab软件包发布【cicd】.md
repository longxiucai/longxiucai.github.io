以go程序为例，build.sh编译输出物料为`_output`目录，然后将其打包为`软件名称-分支名称-日期.tar`，然后通过api来发布
官方文档参考： https://docs.gitlab.com/ee/user/packages/generic_packages/index.html#publish-a-generic-package-by-using-
```yaml1
stages:
  - build-and-uploads

build_job:
  stage: build-and-uploads
  script:
    - bash build.sh aarch64
    - bash build.sh x86_64
    - mv _output installer-apiserver-$CI_COMMIT_REF_NAME-$(date +%Y%m%d)
    - tar -cf installer-apiserver-$CI_COMMIT_REF_NAME-$(date +%Y%m%d).tar installer-apiserver-$CI_COMMIT_REF_NAME-$(date +%Y%m%d)/
    - |
      curl --header "JOB-TOKEN: $CI_JOB_TOKEN" --upload-file installer-apiserver-$CI_COMMIT_REF_NAME-$(date +%Y%m%d).tar "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/installer-apiserver-output/$CI_COMMIT_REF_NAME/installer-apiserver-$CI_COMMIT_REF_NAME-$(date +%Y%m%d).tar"
```
然后即可在页面查看：
![1723798006765](https://github.com/user-attachments/assets/92ac40ef-c330-40e5-82ce-2144e66e3008)
