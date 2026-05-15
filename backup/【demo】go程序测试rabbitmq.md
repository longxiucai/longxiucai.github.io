支持自动重连，随时 Ctrl+C 退出程序
```
package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/streadway/amqp"
)

var (
	conn    *amqp.Connection
	channel *amqp.Channel
	stop    = make(chan struct{})
)

func main() {
	user := flag.String("user", "user", "用户名")
	pass := flag.String("pass", "password", "密码")
	host := flag.String("host", "rabbitmq.ha.svc.cluster.local", "地址")
	port := flag.String("port", "5672", "端口")
	mode := flag.String("mode", "send", "模式: send/recv")
	queue := flag.String("queue", "test_cluster_queue", "队列名")
	flag.Parse()

	rabbitURL := fmt.Sprintf("amqp://%s:%s@%s:%s/", *user, *pass, *host, *port)
	setupCloseHandler()

	for {
		select {
		case <-stop:
			return
		default:
		}

		connect(rabbitURL, *queue)

		if *mode == "send" {
			runSender(*queue)
		}

		if *mode == "recv" {
			runReceiver(*queue)
		}

		closeAll()
		fmt.Println("连接断开，将自动重连...")
		time.Sleep(1 * time.Second)
	}
}

func runSender(queue string) {
	fmt.Println("✅ 进入发送模式，输入消息发送，按 Ctrl+C 退出")

	scanner := bufio.NewScanner(os.Stdin)

	for {
		select {
		case <-stop:
			return
		default:
		}

		fmt.Print("> ")

		if !scanner.Scan() {
			return
		}

		msg := scanner.Text()
		if msg == "" {
			continue
		}

		ok := sendMsg(queue, msg)
		if !ok {
			fmt.Println("连接异常，退出发送循环，准备重连...")
			return
		}
	}
}

func runReceiver(queue string) {
	fmt.Println("✅ 进入接收模式，等待消息... Ctrl+C 退出")

	msgs, err := channel.Consume(
		queue,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return
	}

	for {
		select {
		case <-stop:
			return
		case d, ok := <-msgs:
			if !ok {
				return
			}
			fmt.Println("收到消息:", string(d.Body))
		}
	}
}

func sendMsg(queue, body string) bool {
	err := channel.Publish(
		"",
		queue,
		false,
		false,
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(body),
		},
	)

	if err != nil {
		fmt.Println("❌ 发送失败：", err)
		return false
	}

	fmt.Println("✅ 发送成功:", body)
	return true
}

func connect(url string, queue string) {
	for {
		select {
		case <-stop:
			return
		default:
		}

		var err error

		conn, err = amqp.Dial(url)
		if err != nil {
			fmt.Printf("⚠️ 连接失败，5秒后重试... (Ctrl+C退出)\n")
			waitWithStop(5 * time.Second)
			continue
		}

		channel, err = conn.Channel()
		if err != nil {
			closeAll()
			waitWithStop(5 * time.Second)
			continue
		}

		_, err = channel.QueueDeclare(
			queue,
			false,
			true,
			false,
			false,
			nil,
		)

		if err != nil {
			closeAll()
			waitWithStop(5 * time.Second)
			continue
		}

		fmt.Println("✅ 连接成功！")
		return
	}
}

func setupCloseHandler() {
	c := make(chan os.Signal, 1)

	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-c
		fmt.Println("\n退出程序...")
		close(stop)
		closeAll()
		os.Exit(0)
	}()
}

func waitWithStop(d time.Duration) {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
	case <-stop:
	}
}

func closeAll() {
	if channel != nil {
		_ = channel.Close()
		channel = nil
	}

	if conn != nil {
		_ = conn.Close()
		conn = nil
	}
}

```
测试如图

<img width="652" height="493" alt="Image" src="https://github.com/user-attachments/assets/35bfe81c-2137-4643-8300-2ab7a4de4b3f" />

<img width="569" height="294" alt="Image" src="https://github.com/user-attachments/assets/c2b1045a-d7ed-4ed9-b9ab-b88244ad1064" />