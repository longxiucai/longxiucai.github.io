# 日志滚存+日志打印控制台+选举+多任务（一个常驻任务、一个leader执行任务）
```
package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/gommon/log"
	"gopkg.in/natefinch/lumberjack.v2"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/leaderelection"
	"k8s.io/client-go/tools/leaderelection/resourcelock"
)

// 选主核心配置
const (
	leaderLockName      = "lyx-leader-lock"
	leaderLockNamespace = "monitoring"
	leaseDuration       = 15 * time.Second
	renewDeadline       = 10 * time.Second
	retryPeriod         = 2 * time.Second
	reElectDelay        = 1 * time.Second
	logFilePath         = "/file/go/src/test/log/leader-election.log"
)

var (
	k8sClient     kubernetes.Interface
	localIdentity string
)

func main() {
	// 1. 初始化日志
	initLogger()
	log.Info("✅ 程序启动，初始化LeaderElection组件")

	// 2. 初始化K8s客户端
	var err error
	k8sClient, err = initK8sClient("/home/lyx/.kube/config")
	if err != nil {
		log.Fatal("❌ K8s客户端初始化失败：", err.Error())
		os.Exit(1)
	}
	log.Info("✅ K8s客户端初始化成功")

	// 3. 根上下文+退出信号监听
	rootCtx, rootCancel := context.WithCancel(context.Background())
	defer rootCancel()
	registerSignalHandler(rootCancel)

	// 4. 初始化实例唯一标识
	localIdentity = fmt.Sprintf("%s-%d", getHostName(), os.Getpid())
	log.Info("✅ 实例唯一标识：", localIdentity)

	// 5. 启动全局常驻逻辑
	go defaultLogic()
	log.Info("✅ 常驻逻辑defaultLogic已启动")

	// 6. 启动选主循环
	log.Info("✅ 启动Leader选举循环，等待竞选...")
	lock := newLeaseLock()
	startLeaderElectionLoop(rootCtx, lock)
}

// ========== 核心框架函数 ==========
func initLogger() {
	logFile := &lumberjack.Logger{
		Filename:   logFilePath,
		MaxSize:    200,
		MaxBackups: 4,
		MaxAge:     7,
		Compress:   false,
		LocalTime:  true,
	}
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)
	log.SetLevel(log.INFO)
	log.SetPrefix("[lyx-leader]")
}

func initK8sClient(kubeconfig string) (kubernetes.Interface, error) {
	var config *rest.Config
	var err error
	if kubeconfig == "" {
		kubeconfig = os.Getenv("KUBECONFIG")
	}

	if kubeconfig != "" {
		log.Infof("Loading kube client config from path %q", kubeconfig)
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	} else {
		log.Infof("Using in-cluster kube client config")
		config, err = rest.InClusterConfig()
	}
	if err != nil {
		return nil, err
	}
	client, err := kubernetes.NewForConfig(rest.AddUserAgent(config, "lyx-leader"))
	if err != nil {
		return nil, fmt.Errorf("创建KubeClient失败: %w", err)
	}
	return client, nil
}

func registerSignalHandler(cancelFunc context.CancelFunc) {
	sigCh := make(chan os.Signal, 2)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sigCh
		log.Warn("⚠️ 收到退出信号（Ctrl+C/Kill），开始优雅关停...")
		cancelFunc()

		time.Sleep(300 * time.Millisecond)
		log.Info("✅ 程序优雅关停完成，退出进程")
		os.Exit(0)
	}()
}

func startLeaderElectionLoop(rootCtx context.Context, lock *resourcelock.LeaseLock) {
	for {
		// 执行单次选主
		leaderelection.RunOrDie(rootCtx, leaderelection.LeaderElectionConfig{
			Lock:            lock,
			ReleaseOnCancel: true,
			LeaseDuration:   leaseDuration,
			RenewDeadline:   renewDeadline,
			RetryPeriod:     retryPeriod,
			Callbacks: leaderelection.LeaderCallbacks{
				OnStartedLeading: onStartedLeading,
				OnStoppedLeading: onStoppedLeading,
			},
		})

		select {
		case <-rootCtx.Done():
			return
		case <-time.After(reElectDelay):
			log.Info(fmt.Sprintf("⚠️ 丢失Leader身份，重新竞选（间隔%vs）", reElectDelay))
		}
	}
}

func newLeaseLock() *resourcelock.LeaseLock {
	return &resourcelock.LeaseLock{
		LeaseMeta: metav1.ObjectMeta{
			Name:      leaderLockName,
			Namespace: leaderLockNamespace,
		},
		Client: k8sClient.CoordinationV1(),
		LockConfig: resourcelock.ResourceLockConfig{
			Identity: localIdentity,
		},
	}
}

func defaultLogic() {
	log.Info("通用常驻逻辑defaultLogic启动")
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Info("defaultLogic - 执行通用任务")
		}
	}
}

func onStartedLeading(ctx context.Context) {
	log.Info("成功当选Leader，启动专属任务...")
	ticker := time.NewTicker(5 * time.Second)
	defer func() {
		ticker.Stop()
		log.Warn("⚠️ Leader专属任务已停止")
	}()
	for {
		select {
		case <-ctx.Done():
			log.Info("✅ Leader任务上下文已取消，正常退出")
			return
		case <-ticker.C:
			Leaderlogic(ctx)
		}
	}
}
func Leaderlogic(ctx context.Context) {
	log.Info("🔍 Leader专属逻辑 - 执行检查任务")
}

// 丢失Leader身份后的清理逻辑
func onStoppedLeading() {
	log.Warn("❌ 已丢失Leader身份，释放Leader资源")
}

// ========== 工具函数 ==========
func getHostName() string {
	hostname, err := os.Hostname()
	if err != nil {
		log.Warn("获取主机名失败，使用默认标识", err)
		return "unknown-host"
	}
	return hostname
}
```