## 需要iso来当本地yum源的需提前添加cd-rom并选择好对应的iso文件
![](https://github.com/user-attachments/assets/b6940c91-1798-4f32-aa79-2d2b59bf371d)

## 重启之后在grub界面按`e`
![](https://github.com/user-attachments/assets/fe06fe3f-5a37-4176-ad5c-ae4e55a2d665)

## 找到如下行，并且删除圈出来的部分
找到`linux`开头的行，删除`ro`与`rhgb`，rhgb不删除可能会报错无法进入救援模式
![](https://github.com/user-attachments/assets/629f57e0-482e-4499-a04c-fef6f450c1be)

## 增加圈出来的部分，ctrl+x进入救援模式，不需要root密码
增加`rw init=/bin/bash console=tty0`
![](https://github.com/user-attachments/assets/58e7d784-0b96-4604-9483-26a5c6181faa)

## 救援模式下查看cd-rom为/dev/sr0，挂载之后可以当做本地yum源，用于还原包的版本。可以通过passwd修改root密码
![](https://github.com/user-attachments/assets/98d7acca-db1a-4538-b46f-ee64394b993a)
