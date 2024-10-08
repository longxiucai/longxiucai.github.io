```
type hchan struct {
	// chan 里元素数量
	qcount   uint
	// chan 底层循环数组的长度
	dataqsiz uint
	// 指向底层循环数组的指针
	// 只针对有缓冲的 channel
	buf      unsafe.Pointer
	// chan 中元素大小
	elemsize uint16
	// chan 是否被关闭的标志
	closed   uint32
	// chan 中元素类型
	elemtype *_type // element type
	// 已发送元素在循环数组中的索引
	sendx    uint   // send index
	// 已接收元素在循环数组中的索引
	recvx    uint   // receive index
	// 等待接收的 goroutine 队列
	recvq    waitq  // list of recv waiters
	// 等待发送的 goroutine 队列
	sendq    waitq  // list of send waiters

	// 保护 hchan 中所有字段
	lock mutex
}
```
`buf` 指向底层循环数组，只有**缓冲型**的 `channel` 才有。
`sendx`，`recvx` 均指向底层循环数组，表示当前可以发送和接收的元素位置索引值（相对于底层数组）。
`sendq`，`recvq` 分别表示被阻塞的 `goroutine`，这些 `goroutine` 由于尝试读取 `channel` 或向 `channel` 发送数据而被阻塞。
`waitq` 是 `sudog` 的一个双向链表，而 `sudog` 实际上是对 `goroutine` 的一个封装：
```
type waitq struct {
	first *sudog
	last  *sudog
}
```
`lock` 用来保证每个读 `channel` 或写 `channel` 的操作都是原子的。
例如，创建一个容量为 6 的，元素为 int 型的 channel 数据结构如下 ：
![0](https://github.com/user-attachments/assets/5f1f780a-7f8f-493c-85b8-d906e1d01bf6)

