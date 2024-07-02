```
package dbtest

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func maindb() {
	// 连接 MySQL 数据库
	db, err := sql.Open("mysql", "dbinit:123456@tcp(10.42.186.232:3306)/dbinit_test")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 测试连接
	err = db.Ping()
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}

	fmt.Println("Connected to MySQL database successfully!")

	// 查询示例
	rows, err := db.Query("SELECT * FROM users")
	if err != nil {
		log.Fatal("Error executing query:", err)
	}
	defer rows.Close()

	// 遍历查询结果
	for rows.Next() {
		var id int
		var name string
		err := rows.Scan(&id, &name)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		fmt.Printf("ID: %d, Name: %s\n", id, name)
	}
}
```