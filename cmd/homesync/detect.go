// 本机 3x-ui 自动探测
//
// 手工填面板地址和 token 太容易填错：端口要查、basePath 要查（面板设了子路径
// 时漏掉就 404）、token 还得先跑一条命令生成。这里全部自动搞定。
//
// 端口/basePath 从 `x-ui setting -show` 读，token 从 `x-ui setting -getApiToken`
// 取并落盘复用——作者 fanout 里点出了一个真问题：**每调一次 getApiToken 面板就
// 新生成一个且不回收**，重启多了会把面板的 api_tokens 表撑爆。所以落盘后先验证
// 旧的还能不能用，能用就不新建。
package main

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

const (
	xuiBinary = "/usr/local/x-ui/x-ui" // 面板主程序，读设置/取 token
	xuiMenu   = "/usr/bin/x-ui"        // 交互菜单，第 11 项打印对外访问地址
)

var (
	// 值一律限定在本行内取：\s* 会跨过换行，字段为空时会把下一行内容当成值
	reXUIPort = regexp.MustCompile(`(?m)^port:[^\S\r\n]*(\d+)`)
	reXUIBase = regexp.MustCompile(`(?m)^webBasePath:[^\S\r\n]*(\S+)`)
	// 只认 "apiToken: xxx" 这一行，避免匹配到提示文字里的长单词
	reXUIToken = regexp.MustCompile(`(?m)^apiToken:[^\S\r\n]*([A-Za-z0-9]+)`)
	// "Panel is not secure with SSL" 包含 "Panel is secure with SSL"，必须先排除
	reXUISSLOff = regexp.MustCompile(`(?i)panel is not secure with ssl`)
	reXUISSLOn  = regexp.MustCompile(`(?i)panel is secure with ssl`)
	reXUICert   = regexp.MustCompile(`(?m)^cert:[^\S\r\n]*(\S+)`)
	reXUIAccess = regexp.MustCompile(`Access URL:\s*(https?)://([^:/\s]+):(\d+)(\S*)`)
	reANSI      = regexp.MustCompile(`\x1b\[[0-9;]*m`)
)

// DetectXUI 探测本机 3x-ui，返回可直接用的面板地址和 token。
// workDir 用于落盘/复用 token。
func DetectXUI(workDir string) (url, token string, err error) {
	if _, err := os.Stat(xuiBinary); err != nil {
		return "", "", errors.New("本机没装 3x-ui（找不到 " + xuiBinary + "）")
	}
	out, err := exec.Command(xuiBinary, "setting", "-show").Output()
	if err != nil {
		return "", "", fmt.Errorf("读面板设置失败（面板没运行？）: %w", err)
	}
	text := string(out)

	scheme := "http"
	host := "127.0.0.1"
	// 优先信面板自己给出的地址：绑了域名时它给域名，比我们拼 127.0.0.1 靠谱
	if m := reXUIAccess.FindStringSubmatch(stripANSI(runMenu11())); m != nil {
		scheme, host = m[1], m[2]
	} else if on, stated := xuiSSLFromSettings(text); stated && on {
		scheme = "https"
	} else if certOut, err := exec.Command(xuiBinary, "setting", "-getCert").Output(); err == nil {
		if reXUICert.MatchString(string(certOut)) {
			scheme = "https"
		}
	}

	pm := reXUIPort.FindStringSubmatch(text)
	bm := reXUIBase.FindStringSubmatch(text)
	if pm == nil || bm == nil {
		return "", "", errors.New("从面板设置里解析不出端口或路径，手工指定 -url 吧")
	}
	url = fmt.Sprintf("%s://%s:%s%s", scheme, host, pm[1], trimSuffixSlash(bm[1]))

	// 先试盘上存的 token：还能用就复用，别每次都新建
	if workDir != "" {
		if saved := readSavedToken(workDir); saved != "" {
			if tokenValid(url, saved) {
				return url, saved, nil
			}
		}
	}

	tokOut, err := exec.Command(xuiBinary, "setting", "-getApiToken").Output()
	if err != nil {
		return "", "", fmt.Errorf("取 API token 失败: %w", err)
	}
	tm := reXUIToken.FindStringSubmatch(string(tokOut))
	if tm == nil {
		return "", "", errors.New("没拿到 API token，手工指定 -token 吧")
	}
	token = tm[1]
	if workDir != "" {
		_ = saveToken(workDir, token)
	}
	return url, token, nil
}

// runMenu11 跑 x-ui 菜单第 11 项（View Current Settings）拿对外访问地址。
// 菜单是交互式的，喂 "11\n\n0\n" 让它走完并退出。失败返回空串即可，不影响主流程。
func runMenu11() string {
	if _, err := os.Stat(xuiMenu); err != nil {
		return ""
	}
	cmd := exec.Command(xuiMenu)
	cmd.Stdin = strings.NewReader("11\n\n0\n")
	out, err := cmd.Output()
	if err != nil && len(out) == 0 {
		return ""
	}
	return string(out)
}

func xuiSSLFromSettings(text string) (on, stated bool) {
	if reXUISSLOff.MatchString(text) {
		return false, true
	}
	if reXUISSLOn.MatchString(text) {
		return true, true
	}
	return false, false
}

func stripANSI(s string) string { return reANSI.ReplaceAllString(s, "") }

// trimSuffixSlash 去掉结尾的斜杠。
// 面板设置里可能是 "/"（根）、"/abc/" 或 "/a/b" —— 统一成不带尾斜杠，
// 拼出来的地址才不会变成 http://host:54321// 。
// 根路径 "/" 会得到空串，正好代表没有子路径。
func trimSuffixSlash(s string) string {
	return strings.TrimSuffix(strings.TrimSpace(s), "/")
}

// tokenValid 用一次只读调用验证 token 还能不能用。
// 面板返回 401 或连不上都算失效。
func tokenValid(url, token string) bool {
	c := NewClient(url, token, true) // 本机调用，跳过证书校验
	return c.Ping() == nil
}

const tokenFileName = ".xui-token"

func readSavedToken(workDir string) string {
	blob, err := os.ReadFile(filepath.Join(workDir, tokenFileName))
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(blob))
}

func saveToken(workDir, token string) error {
	return os.WriteFile(filepath.Join(workDir, tokenFileName),
		[]byte(token+"\n"), 0o600)
}
