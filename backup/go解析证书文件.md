```
package cert

import (
	"crypto/x509"
	"encoding/pem"
	"os"
	"path/filepath"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

func parseCertificate(file string) {
	// 读取文件内容
	fileData, err := os.ReadFile(file)
	if err != nil {
		log.Errorf("Error reading file %s: %s\n", file, err)
		return
	}

	// 解析 PEM 块
	block, _ := pem.Decode(fileData)
	if block == nil {
		log.Errorf("No PEM block found in file %s\n", file)
		return
	}

	// 判断文件类型
	fileType := strings.ToLower(filepath.Ext(file))
	switch fileType {
	case ".crt", ".pem":
		// 解析证书
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			log.Errorf("Error parsing certificate from file %s: %s\n", file, err)
			return
		}

		// 输出证书有效期等信息
		log.Infof("Certificate in file %s:", file)
		log.Infof("  Subject: %s", cert.Subject.CommonName)
		log.Infof("  Valid from: %s", cert.NotBefore)
		log.Infof("  Valid until: %s", cert.NotAfter)

		// 计算证书有效期结束时间与当前时间之间的天数差
		now := time.Now()
		expiresInDays := int((time.Duration(cert.NotAfter.Sub(now).Hours()) / 24))
		log.Infof("证书%s 将于 %d 天后过期", cert.Subject.CommonName, expiresInDays)
		log.Infof("---------------------------")
	default:
		log.Infof("Unsupported file type: %s %s", fileType, file)
	}
}
```