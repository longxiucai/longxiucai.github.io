一般都是在向 `slice` 追加了元素之后，才会引起扩容。追加元素调用的是 `append` 函数。

先来看看 append 函数的原型：
```
func append(slice []Type, elems ...Type) []Type
```
append 函数的参数长度可变，因此可以追加多个值到 slice 中，还可以用 ... 传入 slice，直接追加一个切片。
```
slice = append(slice, elem1, elem2)
slice = append(slice, anotherSlice...)
```
`append`函数返回值是一个新的slice，Go编译器不允许调用了 append 函数后不使用返回值。
```
append(slice, elem1, elem2)
append(slice, anotherSlice...)
```
所以上面的用法是错的，不能编译通过。

使用 append 可以向 slice 追加元素，实际上是往底层数组添加元素。但是底层数组的长度是固定的，如果索引 len-1 所指向的元素已经是底层数组的最后一个元素，就没法再添加了。

这时，slice 会迁移到新的内存位置，新底层数组的长度也会增加，这样就可以放置新增的元素。同时，为了应对未来可能再次发生的 append 操作，新的底层数组的长度，也就是新 slice 的容量是留了一定的 buffer 的。否则，每次添加元素的时候，都会发生迁移，成本太高。

新 slice 预留的 buffer 大小是有一定规律的。在golang1.18版本更新之前网上大多数的文章都是这样描述slice的扩容策略的：
> 当原 slice 容量小于 1024 的时候，新 slice 容量变成原来的 2 倍；原 slice 容量超过 1024，新 slice 容量变成原来的1.25倍。

在1.18版本更新之后，slice的扩容策略变为了：
> 当原slice容量(oldcap)小于256的时候，新slice(newcap)容量为原来的2倍；原slice容量超过256，新slice容量newcap = oldcap+(oldcap+3*256)/4

> [!TIP]
> 在实际过程中，上述前半截扩容为原来的2倍是正确的，但是后半截有所不同，后半部分还对 `newcap` 作了一个**内存对齐**，这个和内存分配策略相关。进行内存对齐之后，新 `slice` 的容量是要**大于等于**按照前半部分生成的`newcap`，并不是准确的1.25倍或者公式。具体见src/runtime/slice.go的growslice函数

# 引申
```
package main

import "fmt"

func main() {
    s := []int{5}
    s = append(s, 7)
    s = append(s, 9)
    x := append(s, 11)
    y := append(s, 12)
    fmt.Println(s, x, y)
}
```

代码|	切片对应状态
| :------------ |:---------------| 
s := []int{5}|	s 只有一个元素，[5]| 
s = append(s, 7)|	s 扩容，容量变为2，[5, 7]| 
s = append(s, 9)|	s 扩容，容量变为4，[5, 7, 9]。注意，这时 s 长度是3，只有3个元素| 
x := append(s, 11)|	由于 s 的底层数组仍然有空间，因此并不会扩容。这样，底层数组就变成了 [5, 7, 9, 11]。**注意，此时 s = [5, 7, 9]，容量为4；x = [5, 7, 9, 11]，容量为4。这里 s 不变**| 
y := append(s, 12)|	这里还是在 s 元素的尾部追加元素，由于 s 的长度为3，容量为4，所以直接在底层数组索引为3的地方填上12。结果：s = [5, 7, 9]，y = [5, 7, 9, 12]，x = [5, 7, 9, 12]，x，y 的长度均为4，容量也均为4| 


所以最后程序的执行结果是：
```
[5 7 9] [5 7 9 12] [5 7 9 12]
```
> [!TIP]
> append函数执行完后，返回的是一个全新的 slice，并且对传入的 slice 并不影响。

