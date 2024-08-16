# Git 速查表

## 创建

| 操作 | 命令 |
| --- | --- |
| 克隆现有仓库 | `git clone ssh://user@domain.com/repo.git` |
| 创建一个新的本地仓库 | `git init` |

## 本地修改

| 操作 | 命令 |
| --- | --- |
| 查看工作目录中已更改的文件（即查看 Git 状态） | `git status` |
| 查看跟踪文件的更改（即远程仓库与本地仓库文件的不同） | `git diff` |
| 将所有当前更改添加到下一次提交（即全部提交） | `git add .` |
| 将某个文件的更改添加到下一次提交（即部分提交） | `git add -p <file>` |
| 提交跟踪文件中的所有本地更改 | `git commit -a` |
| 提交先前进行的更改 | `git commit` |
| 更改最后一次提交（不要修改已发布的提交） | `git commit --amend` |

## 提交历史

| 操作 | 命令 |
| --- | --- |
| 显示所有提交，从最新的提交开始 | `git log` |
| 显示特定文件随时间的修改 | `git log -p <file>` |
| 查看特定文件什么时间被什么人修改了什么内容 | `git blame <file>` |

## 分支和标签

| 操作 | 命令 |
| --- | --- |
| 列出所有现有分支 | `git branch -av` |
| 切换当前分支 | `git checkout <branch>` |
| 基于当前 HEAD 指针创建新分支 | `git branch <new-branch>` |
| 基于当前远程分支创建一个新跟踪分支 | `git checkout --track <remote/branch>` |
| 删除一个本地分支 | `git branch -d <branch>` |
| 将一次提交标记为一个标签 | `git tag <tag-name>` |

## 更新和推送

| 操作 | 命令 |
| --- | --- |
| 列出当前仓库关联的所有远程仓库 | `git remote -v` |
| 显示远程仓库的详细信息 | `git remote show <remote>` |
| 关联一个新的远程仓库到本地仓库 | `git remote add <shortname> <url>` |
| 仅拉取远程仓库所有更改，不合并到本地仓库 | `git fetch <remote>` |
| 拉取远程仓库所有更改，并合并到本地仓库 | `git pull <remote> <branch>` |
| 推送本地仓库修改到远程仓库 | `git push <remote> <branch>` |
| 删除远程仓库的一个分支 | `git branch -dr <remote/branch>` |
| 推送所有本地仓库标签到远程仓库 | `git push --tags` |

## 合并和变基

| 操作 | 命令 |
| --- | --- |
| 合并指定分支到当前分支 | `git merge <branch>` |
| 变基 | `git rebase <branch>` |
| 放弃变基 | `git rebase --abort` |
| 解决冲突之后继续变基 | `git rebase --continue` |
| 运行合并冲突解决工具来解决合并冲突 | `git mergetool` |
| 使用编辑器手动解决冲突，并（在解决之后）将文件标记为已解决 | `git add <resolved-file>`<br>`git rm <resolved-file>` |

## 撤销

| 操作 | 命令 |
| --- | --- |
| 放弃工作目录中的所有本地更改 | `git reset --hard HEAD` |
| 放弃特定文件中的本地更改 | `git checkout HEAD <file>` |
| 还原提交 | `git revert <commit>` |
| 将你的 HEAD 指针重置为上一次提交，并放弃此后的所有更改 | `git reset --hard <commit>` |
| 重置 HEAD 指针，并将所有更改保留为未提交的更改 | `git reset <commit>` |
| 重置 HEAD 指针，并保留未提交的本地更改 | `git reset --keep <commit>` |

# 基础知识
## 配置
```
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```
上述命令里的name和Email是你注册GitHub时使用的name和Email
> [!TIP]
> git config命令的–global参数,用了这个参数,表示你这台机器上所有的Git仓库都会使用这个配置,当然也可以对某个仓库指定不同的用户名和Email地址。

## 创建版本库
### 说明
什么是版本库呢?版本库又名仓库,英文名repository,你可以简单理解成一个目录,这个目录里面的所有文件都可以被Git管理起来,每个文件的修改、删除,Git都能跟踪,以便任何时刻都可以追踪历史,或者在将来某个时刻可以还原。
### 命令
初始化本地仓库
```
git init
```
添加文件到仓库
```
# 添加单个文件
git add <file>
# 添加多个文件
git add file1 file2 ...
# 添加全部已修改文件
git add .
```
提交文件到仓库
```
git commit -m "说明"
```
### 步骤
首先,选择一个合适的地方,创建一个空目录,在该目录下执行:
```
git init
```
此时一个仓库就创建好了,在该目录下会生成一个`.git`隐藏文件,这个文件是`git`的配置文件,请勿随意修改。
其次,添加一个文件到仓库,新建readme.txt,执行:
```
git add readme.txt
```
然后把文件提交到仓库,执行:
```
git commit -m "你的注释"
```
结果如下:
```
$ git commit -m "第一次提交"
[master (root-commit) 6999761] 第一次提交
1 file changed, 1 insertion(+)
create mode 100644 readme.txt
```
其中,`-m`到改动记录。后面输入的是本次提交的说明,可以输入任意内容,当然最好是有意义的,这样你就能从历史记录里方便地找
`git commit`命令执行成功后会告诉你
`1 file changed`:1个文件被改动(我们新添加的readme.txt文件);
`1 insertions`:插入了一行内容(readme.txt有一行内容)。

## 回退
### 说明
我们多次修改文件,如果不小心删除了某些东西,可以使用版本回退来实现复原
### 命令
git工作区状态
```
git status
```
查看全部修改内容
```
git diff
```
查看指定文件修改内容
```
git diff <file>
```
回退到指定版本
```
git reset --hard commit_id
```
回退到上一个版本
```
git reset --hard HEAD^
```
回退到上上一个版本
```
git reset --hard HEAD^^
```
回退到上n个版本
```
git reset --hard HEAD~n
```
查看详细提交历史
```
git log
```
查看简化提交历史
```
git log --pretty=oneline
```
查看分支合并图
```
git log --graph
```
查看命令历史
```
git reflog
```
### 步骤
继续上一节的内容,修改readme.txt,增加了一行内容,执行:
```
git status
```
结果如下:
```
$ git status
On branch master
Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git checkout -- <file>..." to discard changes in working directory)
            modified:  readme.txt
no changes added to commit (use "git add" and/or "git commit -a")
```
`git status`命令可以让我们时刻掌握仓库当前的状态,上面的命令输出告诉我们,`readme.txt`被修改过了,但还没有提交修改。
此时,如果想查看具体我们修改了`readme.txt`的哪一部分内容,执行:
```
git diff
```
结果如下:
```
$ git diff
diff --git a/readme.txt b/readme.txt
index cc3b095..6b77a0b 100644
--- a/readme.txt
+++ b/readme.txt
@@ -1,2 +1,3 @@
git is very famous!
-第一次追加内容
\ No newline at end of file
+第一次追加内容^M
+第二次追加内容
\ No newline at end of file
```
知道修改了什么内容,就可以放心提交了,依次执行`git add` `git commit -m " "`即可,提交完毕,执行`git status`查看状态,显示如下:
```
$ git status
On branch master
nothing to commit, working tree clean
```
好了,经过多次提交之后,如果想退回到某个版本,先执行:
```
git log
```
结果如下:
```
$ git log
commit f09d57ce853e850551e8802b9a4be3643ba894c0 (HEAD -> master)
Author: rumosky <rumosky@163.com>
Date: Sun Nov 3 16:02:23 2019 +0800

       第三次追加内容

commit c3b8908ddddd8364ac8b2681b56e948885e49b1d
Author: rumosky <rumosky@163.com>
Date: Sun Nov 3 16:00:36 2019 +0800

       第二次追加内容

commit a82d91a6bb97b1acc158d98bc1f82697df938e3b
Author: rumosky <rumosky@163.com>
Date: Sun Nov 3 15:49:55 2019 +0800

       第一次追加内容

commit 69997611303057230d8fa50c81681bd823644553
Author: rumosky <rumosky@163.com>
Date: Sun Nov 3 15:28:27 2019 +0800

       第一次提交
```
可以看到有四次提交,其中,`commit`后面的一串字符是`commit_id`,若觉得日志内容很长,可以添加参数`pretty=oneline`,结果如下:
```
$ git log --pretty=oneline
f09d57ce853e850551e8802b9a4be3643ba894c0 (HEAD -> master) 第三次追加内容
c3b8908ddddd8364ac8b2681b56e948885e49b1d 第二次追加内容
a82d91a6bb97b1acc158d98bc1f82697df938e3b 第一次追加内容
69997611303057230d8fa50c81681bd823644553 第一次提交
```
回到上一个版本,结果如下:
```
$ git reset --hard HEAD^
HEAD is now at c3b8908 第二次追加内容
```
现在,我们回退到了上一个版本,但是如果我们后悔了,想恢复到新版本怎么办?
没事,此时,先执行`git reflog`找到最新版的`commit_id`,结果如下:
```
$ git reflog
c3b8908 (HEAD -> master) HEAD@{0}: reset: moving to HEAD^
f09d57c HEAD@{1}: commit: 第三次追加内容
c3b8908 (HEAD -> master) HEAD@{2}: commit: 第二次追加内容
a82d91a HEAD@{3}: commit: 第一次追加内容
6999761 HEAD@{4}: commit (initial): 第一次提交
```
第三次追加内容`commit_id`是`f09d57c`,执行回退命令,结果如下:
```
$ git reset --hard f09d57c
HEAD is now at f09d57c 第三次追加内容
```
此时,查看readme文件,发现已经恢复了:
```
$ cat readme.txt
git is very famous!
第一次追加内容
第二次追加内容
第三次追加内容
```
> [!TIP]
> commit_id没有必要全部输入,至少输入前四位就可以找到该commit
## 工作区和暂存区
### 说明
前面讲了我们把文件往Git版本库里添加的时候,是分两步执行的:
第一步是用 `git add`把文件添加进去,实际上就是把文件修改添加到暂存区;
第二步是用 `git commit`提交更改,实际上就是把暂存区的所有内容提交到当前分支。
因为我们创建`Git`版本库时,`Git`自动为我们创建了唯一一个`master`分支,所以现在`git commit`就是往`master`分支上提交更改。
你可以简单理解为,需要提交的文件修改通通放到暂存区,然后,一次性提交暂存区的所有修改。
## 撤销修改
### 命令
#### 丢弃工作区的修改(未提交至暂存区)
```
# 丢弃指定文件的修改
git checkout -- file
git restore <file>
# 丢弃所有文件的修改
git checkout -- .
git restore .
```
#### 丢弃已添加到暂存区的修改
```
# 丢弃指定文件的修改
git reset HEAD <file>
git restore --staged <file>
# 丢弃所有文件的修改
git reset HEAD .
git restore --staged .
```
## 删除文件
### 命令
删除未添加到暂存区的文件
```
#显示将要删除的文件和目录
git clean -n
#删除文件和目录
git clean -df
#删除文件
git clean -f
git rm <file>
```
# 远程仓库
## 添加远程仓库
### 说明
现在的情景是,你的本地仓库已经有了,但是你必须要有一个远程仓库,才可以使得自己的代码可以让别人来协作开发,也可
以作为一个本地仓库的备份。
### 命令
#### 关联远程仓库
```
git remote add origin <url>
# 其中origin是默认的远程仓库名,也可以自行修改
# url可以是ssh链接,也可以是http链接,推荐使用ssh,安全高速
```
#### 删除远程仓库
```
git remote rm origin
```
#### 查看远程仓库
```
git remote -v
```
#### 推送提交到远程仓库
```
git push origin master
# 一般用于非首次推送
```
```
git push -u origin master
# -u参数是将本地master分支与远程仓库master分支关联起来,一般用于第一次推送代码到远程库
```
## 从远程仓库克隆
### 说明
之前讲的内容都是先有本地库,后有远程库,然后再关联远程库。
而一般大多数情形都是先有远程库,然后克隆远程库到本地,再进行工作。
### 命令
克隆远程仓库到本地
```
git clone url
# url可以是ssh或http,建议使用原生ssh链接,高速安全
```
# 分支管理
## 创建与合并分支
### 命令
查看分支
```
git branch
```
创建分支
```
git branch <name>
```
切换分支
```
git checkout <name>
git switch <name>
# switch是2.23版本新增命令
```
创建并切换到该分支
```
git checkout -b <name>
git switch -c <name>
```
合并指定分支到当前分支
```
git merge <name>
```
删除本地已合并分支
```
git branch -d <name>
```
删除远程分支
```
git push <远程仓库名> --delete <远程分支名>
```
推送本地分支到远程仓库并在远程仓库创建新分支
```
git push <远程仓库名> <本地分支名>:<远程分支名>
```
### 说明
在版本回退里,你已经知道,每次提交,Git都把它们串成一条时间线,这条时间线就是一个分支。截止到目前,只有一条时间线,在Git里,这个分支叫主分支,即master分支。HEAD严格来说不是指向提交,而是指向master,master才是指向提交的,所以,HEAD指向的就是当前分支。
所以创建分支、切换分支、删除分支只是对相对应的指针进行操作,所以速度才会非常快。
### switch
我们注意到切换分支使用`git checkout <branch>`,而前面讲过的撤销修改则是`git checkout -- <file>`,同一个命令,有两种作用,确实有点令人迷惑。
实际上,切换分支这个动作,用`switch`更科学。因此,最新版本的Git提供了新的git switch命令来切换分支,使用新的`git switch`命令,比`git checkout`要更容易理解。

## 解决冲突
### 说明
冲突是如何表示的？
当产生合并冲突时,该部分会以`<<<<<<<` , `=======` , `>>>>>>>`表示。在`=======`之前的部分是当前分支这边的情况,在`=======`之后的部分是传入分支的情况。
### 命令
当Git无法自动合并分支时,就必须首先解决冲突。解决冲突后,再提交,合并完成。
解决冲突就是把Git合并失败的文件手动编辑为我们希望的内容,再提交。
查看分支合并图:
```
git log --graph
```
> 冲突的产生一般都是以下情况:
> 远程仓库的代码落后于本地仓库
> 远程仓库的代码远超本地仓库
> 在你还未提交代码的时候,你的同事已经提交了代码,就会导致远程仓库代码领先于你的代码
#### 解决冲突
在看到冲突以后,你可以选择以下两种方式:
* 决定不合并。这时,唯一要做的就是重置`index`到`HEAD`节点。`git merge --abort`用于这种情况。
* 解决冲突。`Git`会标记冲突的地方,解决完冲突的地方后使用`git add`加入到`index`中,然后使用`git commit`产生合并节点。
你可以用以下工具来解决冲突:
* 使用合并工具。`git mergetool`将会调用一个可视化的合并工具来处理冲突合并。
* 查看差异。`git diff`将会显示三路差异(三路合并中所采用的三路比较算法)。
* 查看每个分支的差异。`git log --merge -p <path>`将会显示`HEAD`版本和`MERGE_HEAD`版本的差异。
* 查看合并前的版本。`git show :1:文件名`显示共同祖先的版本,`git show :2:文件名`显示当前分支的`HEAD`版本,`git show :3:文件名`显示对方分支的`MERGE_HEAD`版本。
## 分支管理策略
### 说明
首先,`master`分支应该是非常稳定的,也就是仅用来发布新版本,平时不能在上面干活;
那在哪干活呢?干活都在`dev`分支上,也就是说,`dev`分支是不稳定的,到某个时候,比如`1.0`版本发布时,再把`dev`分支合并到`master`上,在`master`分支发布`1.0`版本;
## Bug分支
### 说明
修复bug时,我们会通过创建新的bug分支进行修复,然后合并,最后删除;
当手头工作没有完成时,先把工作现场`git stash`一下,然后去修复bug,修复后,再`git stash pop`,回到工作现场;
在master分支上修复的bug,想要合并到当前dev分支,可以用`git cherry-pick <commit_id>`命令,把bug提交的修改“复制”到当前分支,避免重复劳动。
### 命令
暂存工作区状态
```
git stash
```
查看暂存的工作区状态
```
git stash list
```
恢复全部暂存状态,但不删除暂存内容
```
git stash apply
```
恢复指定暂存状态,但不删除暂存内容
```
git stash apply stash@{<id>}
```
删除暂存内容
```
git stash drop
```
恢复暂存状态,同时删除暂存内容
```
git stash pop
```
复制一个特定的提交到当前分支
```
git cherry-pick <commit_id>
```
## Feature分支
### 命令
强制删除分支(会丢失分支上的修改)
```
git branch -D <name>
```
### 说明
开发一个新feature,最好新建一个分支;
如果要丢弃一个没有被合并过的分支,可以通过`git branch -D <name>`强行删除。
## 多人协作
### 问题
本地仓库有文件,远程仓库也有文件,但是这两个仓库文件不一致。这时,将本地仓库与远程仓库关联起来,执
行`git branch --set-upstream-to <branch-name> origin/<branch-name>`,提示错误:`error:the requested upstream branch 'origin/master' does not exist"`
解决办法:
若直接执行`git pull`会提示:`refusing to merge unrelated histories`
正确做法:
```
git pull origin master --allow-unrelated-histories
git branch --set-upstream-to=origin/master master
git push origin master
```
## Rebase变基
### 说明
rebase操作可以把本地未push的分叉提交历史整理成直线;
rebase的目的是使得我们在查看历史提交的变化时更容易,因为分叉的提交需要三方对比。
### 命令
变基(衍合)
```
git rebase <branch>
```
放弃变基
```
git rebase --abort
```
解决冲突之后继续变基
```
git rebase --continue
```

# 标签管理
发布一个版本时,我们通常先在版本库中打一个标签(tag),这样,就唯一确定了打标签时刻的版本。将来无论什么时候,取
某个标签的版本,就是把那个打标签的时刻的历史版本取出来。所以,标签也是版本库的一个快照。
Git的标签虽然是版本库的快照,但其实它就是指向某个commit的指针(跟分支很像对不对?但是分支可以移动,标签不能移
动),所以,创建和删除标签都是瞬间完成的。
Git有commit,为什么还要引入tag?
“请把上周一的那个版本打包发布,commit号是6a5819e...”
“一串乱七八糟的数字不好找!”
如果换一个办法:
“请把上周一的那个版本打包发布,版本号是v1.2”
“好的,按照tag v1.2查找commit就行!”
所以,tag就是一个让人容易记住的有意义的名字,它跟某个commit绑在一起。
## 创建标签
新建标签(指向最新的commit_id)
```
git tag <tag_name>
```
新建标签(指向特定commit_id)
```
git tag <tag_name> <commit_id>
```
查看所有标签
```
git tag
```
显示某个标签的详细信息
```
git show <tag_name>
```
新建带有说明的标签
```
git tag -a <tag_name> -m "说明" <commit_id>
```
## 操作标签
删除指定本地标签
```
git tag -d <tag_name>
```
删除指定远程标签
```
git push origin :refs/tags/<tag_name>
```
推送一个本地标签
```
git push origin <tag_name>
```
推送全部未推送过的本地标签
```
git push origin --tags
```
# 扩展
## Git撤回已经推送至远程仓库的提交
我们在工作时,经常会遇到已经提交远程仓库,但是又不是我想要的版本,要撤下来。这时可以使用下列命令:
```
# 不删除工作区的修改,仅撤销commit
git reset --soft <commit_id>
# 删除工作区的修改,撤销commit
git reset --hard <commit_id>
```
> [!TIP]
> `git reset --soft`表示只是改变了`HEAD`的指向,本地代码不会变化,我们使用`git status`依然可以看到,同时也可以`git commit`提交。
> `git reset --hard`后者直接回改变本地源码,不仅仅指向变化了,代码也回到了那个版本时的代码,所以使用是一定要小心,想清楚。