1. isolinux.bin & isolinux.cfg

isolinux.bin是光盘引导程序，在mkisofs的选项中需要明确给出文件路径，这个文件属于SYSLINUX项目，对应fedora13中的syslinux包，文档可参考：/usr/share/doc/syslinux-4.02/isolinux.txt或者项目Wiki；可引导光盘相关信息请参考El Torito规范；
isolinux.cfg是isolinux.bin的配置文件，当光盘启动后（即运行isolinux.bin），会自动去找isolinux.cfg文件，然后根据配置信息进行后续工作；查找isolinux.cfg的顺序为:
boot/syslinux/isolinux.cfg
syslinux/isolinux.cfg
isolinux.cfg

2. vesamenu.c32

vesamenu.c32就是我们看到的光盘启动后的安装图形界面，也属于SYSLINUX项目，还有一个menu.c32版本，是纯文本的菜单；

3. memtest

如果通过光盘启动菜单选择了memtest选项，则开始进行内存检测；这是一个独立的程序，属于memtest86+项目，对应的fedora13的包是memtest86+-4.00-3.fc13.i686.rpm；通过效验md5值可以发现这个文件就是从包中提取出来的，发行版定制工具会从yum源将这个包安装到chroot中，然后将 /boot/memtest86+* 复制到ISO根目录；

4. splash.jgp

是光盘启动界面的背景图，应该来自文件 /usr/lib/anaconda-runtime/syslinux-vesa-splash.jpg，属于fedora-logos包；制作方法见Fedora官方Wiki：[How_to_create_a_custom_syslinux_splash](https://fedoraproject.org/wiki/How_to_create_a_custom_syslinux_splash)

5. vmlinuz & initrd.img

vmlinuz是内核映像，initrd.img是ramfs (先cpio，再gzip压缩)，都是编译内核生成的；isolinux.bin根据安装选项找到对应的配置，装载内核和ramfs；

6. install.img

install.img是一个squashfs根文件系统，当内核启动后就装载install.img并切换根文件系统，执行里面的anaconda程序，anaconda是fedora的安装程序；
```
    $ sudo mount install.img /mnt -oloop   # mount
    $ sudo mksquashfs /dir                 # build
```
7. discinfo

安装过程中，anaconda会去读取.discinfo文件，获取光盘信息（以前CD安装系统需要多张光盘），内容如下：
1273712438.740122     # timestamp （ python time.time() ）
Fedora 13             # releasestr
i386                  # arch
ALL                   # discNum （ALL表示只有一张安装盘）
注：参考文件/usr/lib/anaconda-runtime/makestamp.py 

8.Packages & repodata

packages就是存放包的目录，对这个目录执行createrepo命令就会生成一个repodata的目录，这个repodata就是yum源，里面的文件基本都是xml格式，记录了Packages中所有包的基本信息，如包名、包信息、包版本、包中的文件清单等等；

