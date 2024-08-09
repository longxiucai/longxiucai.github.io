iface 和 eface 都是 Go 中描述接口的底层结构体，区别在于 iface 描述的接口包含方法，而 eface 则是不包含任何方法的空接口：interface{}。

## iface
从源码层面看一下：
```
type iface struct {
	tab  *itab
	data unsafe.Pointer
}

type itab struct {
	inter  *interfacetype
	_type  *_type
	link   *itab
	hash   uint32 // copy of _type.hash. Used for type switches.
	bad    bool   // type does not implement interface
	inhash bool   // has this itab been added to hash?
	unused [2]byte
	fun    [1]uintptr // variable sized
}
```
iface 内部维护两个指针，tab 指向一个 itab 实体， 它表示接口的类型以及赋给这个接口的实体类型。data 则指向接口具体的值，一般而言是一个指向堆内存的指针。

再来仔细看一下 itab 结构体：_type 字段描述了实体的类型，包括内存对齐方式，大小等；inter 字段则描述了接口的类型。fun 字段放置和接口方法对应的具体数据类型的方法地址，实现接口调用方法的动态分派，一般在每次给接口赋值发生转换时会更新此表，或者直接拿缓存的 itab。

再看一下 interfacetype 类型，它描述的是接口的类型：

```
type interfacetype struct {
	typ     _type
	pkgpath name
	mhdr    []imethod
}
```
可以看到，它包装了 _type 类型，_type 实际上是描述 Go 语言中各种数据类型的结构体。我们注意到，这里还包含一个 mhdr 字段，表示接口所定义的函数列表， pkgpath 记录定义了接口的包名。

这里通过一张图来看下 iface 结构体的全貌：
![0](https://github.com/user-attachments/assets/fafe26b4-346f-49d4-b7d4-497c7e852bea)

## eface
```
type eface struct {
    _type *_type
    data  unsafe.Pointer
}
```
相比 iface，eface 就比较简单了。只维护了一个 _type 字段，表示空接口所承载的具体的实体类型。data 描述了具体的值。
![1](https://github.com/user-attachments/assets/356d30f2-89a0-4f87-855a-f648de21fd9c)

上面两个函数的参数和 iface 及 eface 结构体的字段是可以联系起来的：两个函数都是将参数组装一下，形成最终的接口。

作为补充，我们最后再来看下 _type 结构体：
```
type _type struct {
    // 类型大小
	size       uintptr
    ptrdata    uintptr
    // 类型的 hash 值
    hash       uint32
    // 类型的 flag，和反射相关
    tflag      tflag
    // 内存对齐相关
    align      uint8
    fieldalign uint8
    // 类型的编号，有bool, slice, struct 等等等等
	kind       uint8
	alg        *typeAlg
	// gc 相关
	gcdata    *byte
	str       nameOff
	ptrToThis typeOff
}
```
## 举例
Go 语言中最常见的就是 Reader 和 Writer 接口：
```
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}
```
接下来，就是接口之间的各种转换和赋值了：
```
var r io.Reader
tty, err := os.OpenFile("/Users/qcrao/Desktop/test", os.O_RDWR, 0)
if err != nil {
    return nil, err
}
r = tty
```
首先声明 r 的类型是 io.Reader，注意，这是 r 的静态类型，此时它的动态类型为 nil，并且它的动态值也是 nil。

之后，r = tty 这一语句，将 r 的动态类型变成 *os.File，动态值则变成非空，表示打开的文件对象。这时，r 可以用<value, type>对来表示为： <tty, *os.File>。
![2](https://github.com/user-attachments/assets/96518978-b149-4757-ae5c-5ab6ccddcbe6)

注意看上图，此时虽然 fun 所指向的函数只有一个 Read 函数，其实 *os.File 还包含 Write 函数，也就是说 *os.File 其实还实现了 io.Writer 接口。因此下面的断言语句可以执行：
```
var w io.Writer
w = r.(io.Writer)
```
之所以用断言，而不能直接赋值，是因为 r 的静态类型是 io.Reader，并没有实现 io.Writer 接口。断言能否成功，看 r 的动态类型是否符合要求。

这样，w 也可以表示成 <tty, *os.File>，仅管它和 r 一样，但是 w 可调用的函数取决于它的静态类型 io.Writer，也就是说它只能有这样的调用形式： w.Write() 。w 的内存形式如下图：
![3](https://github.com/user-attachments/assets/57978369-e34b-4378-be83-adffbd8f1ab0)
和 r 相比，仅仅是 fun 对应的函数变了：Read -> Write。

最后，再来一个赋值：
```
var empty interface{}
empty = w
```
由于 empty 是一个空接口，因此所有的类型都实现了它，w 可以直接赋给它，不需要执行断言操作。
![4](https://github.com/user-attachments/assets/363813f8-3955-4c0b-b387-7f2af679c63b)

从上面的三张图可以看到，interface 包含三部分信息：_type 是类型信息，*data 指向实际类型的实际值，itab 包含实际类型的信息，包括大小、包路径，还包含绑定在类型上的各种方法（图上没有画出方法）

