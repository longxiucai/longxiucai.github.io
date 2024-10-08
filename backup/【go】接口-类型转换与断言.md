我们知道，Go 语言中不允许隐式类型转换，也就是说 `=` 两边，不允许出现类型不相同的变量。
类型转换、类型断言本质都是把一个类型转换成另外一个类型。不同之处在于，类型断言是对接口变量进行的操作。

# 类型转换
对于类型转换而言，转换前后的两个类型要相互兼容才行。类型转换的语法为：
```
<结果类型> := <目标类型> ( <表达式> )
```
```
package main

import "fmt"

func main() {
	var i int = 9

	var f float64
	f = float64(i)
	fmt.Printf("%T, %v\n", f, f)

	f = 10.8
	a := int(f)
	fmt.Printf("%T, %v\n", a, a)

	// s := []int(i)
}
```
上面的代码里，我定义了一个 `int` 型和 `float64` 型的变量，尝试在它们之前相互转换，结果是成功的：`int` 型和 `float64` 是相互兼容的。
如果我把最后一行代码的注释去掉，编译器会报告类型不兼容的错误：
```
cannot convert i (type int) to type []int
```
# 断言
前面说过，因为空接口 `interface{}` 没有定义任何函数，因此 Go 中所有类型都实现了空接口。当一个函数的形参是 `interface{}`，那么在函数中，需要对形参进行断言，从而得到它的真实类型。

断言的语法为：
```
<目标类型的值>，<布尔参数> := <表达式>.( 目标类型 ) // 安全类型断言 
<目标类型的值> := <表达式>.( 目标类型 )　　//非安全类型断言
```
类型转换和类型断言有些相似，不同之处，在于类型断言是对接口进行的操作。
还是来看一个简短的例子：
```
package main

import "fmt"

type Student struct {
	Name string
	Age int
}

func main() {
	var i interface{} = new(Student)
	s := i.(Student)
	
	fmt.Println(s)
}
```
运行一下：
```
panic: interface conversion: interface {} is *main.Student, not main.Student
```
直接 panic 了，这是因为 `i` 是 `*Student` 类型，并非 `Student` 类型，断言失败。这里直接发生了 panic，线上代码可能并不适合这样做，可以采用“安全断言”的语法：
```
func main() {
	var i interface{} = new(Student)
	s, ok := i.(Student)
	if ok {
		fmt.Println(s)
	}
}
```
这样，即使断言失败也不会 panic。

断言其实还有另一种形式，就是用在利用 switch 语句判断接口的类型。每一个 case 会被顺序地考虑。当命中一个 case 时，就会执行 case 中的语句，因此 case 语句的顺序是很重要的，因为很有可能会有多个 case 匹配的情况。
代码示例如下：
```
func main() {
	//var i interface{} = new(Student)
	//var i interface{} = (*Student)(nil)
	var i interface{}

	fmt.Printf("%p %v\n", &i, i)

	judge(i)
}

func judge(v interface{}) {
	fmt.Printf("%p %v\n", &v, v)

	switch v := v.(type) {
	case nil:
		fmt.Printf("%p %v\n", &v, v)
		fmt.Printf("nil type[%T] %v\n", v, v)

	case Student:
		fmt.Printf("%p %v\n", &v, v)
		fmt.Printf("Student type[%T] %v\n", v, v)

	case *Student:
		fmt.Printf("%p %v\n", &v, v)
		fmt.Printf("*Student type[%T] %v\n", v, v)

	default:
		fmt.Printf("%p %v\n", &v, v)
		fmt.Printf("unknow\n")
	}
}

type Student struct {
	Name string
	Age int
}
```
main 函数里有三行不同的声明，每次运行一行，注释另外两行，得到三组运行结果：
```
// --- var i interface{} = new(Student)
0xc4200701b0 [Name: ], [Age: 0]
0xc4200701d0 [Name: ], [Age: 0]
0xc420080020 [Name: ], [Age: 0]
*Student type[*main.Student] [Name: ], [Age: 0]

// --- var i interface{} = (*Student)(nil)
0xc42000e1d0 <nil>
0xc42000e1f0 <nil>
0xc42000c030 <nil>
*Student type[*main.Student] <nil>

// --- var i interface{}
0xc42000e1d0 <nil>
0xc42000e1e0 <nil>
0xc42000e1f0 <nil>
nil type[<nil>] <nil>
```
对于第一行语句：
```
var i interface{} = new(Student)
```
`i` 是一个 `*Student` 类型，匹配上第三个 `case`，从打印的三个地址来看，这三处的变量实际上都是不一样的。在 `main` 函数里有一个局部变量 `i`；调用函数时，实际上是复制了一份参数，因此函数里又有一个变量 `v`，它是 `i` 的拷贝；断言之后，又生成了一份新的拷贝。所以最终打印的三个变量的地址都不一样。

对于第二行语句：
```
var i interface{} = (*Student)(nil)
```
这里想说明的其实是 `i` 在这里动态类型是 `(*Student)`, 数据为 `nil`，它的类型并不是 `nil`，它与 `nil` 作比较的时候，得到的结果也是 `false`。

最后一行语句：
```
var i interface{}
```
这回 `i` 才是 `nil` 类型。

# 引申
## 引申1
`fmt.Println` 函数的参数是`interface`。对于内置类型，函数内部会用穷举法，得出它的真实类型，然后转换为字符串打印。而对于自定义类型，首先确定该类型是否实现了`String()`方法，如果实现了，则直接打印输出`String()`方法的结果；否则，会通过反射来遍历对象的成员进行打印。

再来看一个简短的例子，比较简单，不要紧张：
```
package main

import "fmt"

type Student struct {
	Name string
	Age int
}

func main() {
	var s = Student{
		Name: "qcrao",
		Age: 18,
	}

	fmt.Println(s)
}
```
因为 Student 结构体没有实现 String() 方法，所以 fmt.Println 会利用反射挨个打印成员变量：
```
{qcrao 18}
```
增加一个 String() 方法的实现：
```
func (s Student) String() string {
	return fmt.Sprintf("[Name: %s], [Age: %d]", s.Name, s.Age)
}
```
打印结果：
```
[Name: qcrao], [Age: 18]
```
按照我们自定义的方法来打印了。
## 引申2 
针对上面的例子，如果改一下：
```
func (s *Student) String() string {
	return fmt.Sprintf("[Name: %s], [Age: %d]", s.Name, s.Age)
}
```
注意看两个函数的接受者类型不同，现在 `Student` 结构体只有一个接受者类型为 **指针类型** 的 `String()` 函数，打印结果：
```
{qcrao 18}
```
为什么？
> [!TIP]
> 类型 `T` 只有接受者是 `T` 的方法；而类型 `*T` 拥有接受者是 `T` 和 `*T` 的方法。语法上 `T` 能直接调 `*T` 的方法仅仅是 Go 的语法糖。
所以， `Student` 结构体定义了接受者类型是值类型的 `String()` 方法时，通过
```
fmt.Println(s)
fmt.Println(&s)
```
均可以按照自定义的格式来打印。

如果 Student 结构体定义了接受者类型是 **指针类型** 的 `String()` 方法时，只有通过
```
fmt.Println(&s)
```
才能按照自定义的格式打印。
