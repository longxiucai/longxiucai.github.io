# 示例
使用slog将日志保存到文件，同时输出到控制台。

使用第三方库`import "gopkg.in/natefinch/lumberjack.v2"`实现log rotation
```
	// 配置 lumberjack
	logFile := &lumberjack.Logger{
		Filename:   common.LogFilePath, // 日志文件路径
		MaxSize:    100,                // 单个日志文件的最大大小（MB）
		MaxBackups: 3,                  // 保留的旧日志文件数量
		MaxAge:     28,                 // 保留旧日志文件的最大天数
		Compress:   true,               // 是否压缩旧日志文件
	}
	// 配置 slog 写入文件、同时写到控制台
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	logger := slog.New(slog.NewTextHandler(multiWriter, &slog.HandlerOptions{
		Level: slog.LevelInfo, // 设定日志等级
	}))
	slog.SetDefault(logger) // 设置全局默认日志
	slog.Info("log saved to", slog.String("path", common.LogFilePath))
```
# lumberjack参数

字段名 | 类型 | 作用 | 说明
-- | -- | -- | --
Filename | string | 指定日志文件路径 | 为空时，默认使用 <进程名>-lumberjack.log 存放在 os.TempDir()
MaxSize | int | 日志文件 最大大小（MB） | 例如 MaxSize: 10，表示日志文件 超过 10MB 就会进行切割
MaxAge | int | 最大保留天数 | 旧日志超过 MaxAge 天后删除（0 表示不按天删除）
MaxBackups | int | 最大保留日志文件数 | 旧日志文件超过 MaxBackups 后会被删除
LocalTime | bool | 是否使用 本地时间 作为日志文件时间戳 | false 时使用 UTC 时间
Compress | bool | 是否对 旧日志进行 gzip 压缩 | true 表示对历史日志进行 .gz 压缩
size | int64 | 记录当前日志文件的大小 | 内部使用
file | *os.File | 当前日志文件的文件句柄 | 用于读写日志
mu | sync.Mutex | 互斥锁 | 确保多线程安全
millCh | chan bool | 信号通道 | 控制日志清理（删除旧日志等）
startMill | sync.Once | 确保 millCh 只初始化一次 | 避免重复启动清理任务

