```
import ct "github.com/daviddengcn/go-colortext"

func PrintYellow(out io.Writer, content string) {
	ct.ChangeColor(ct.Yellow, false, ct.None, false)
	fmt.Fprint(out, content)
	ct.ResetColor()
}
...
```