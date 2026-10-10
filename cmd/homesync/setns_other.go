//go:build !linux

package main

// setns 只在 Linux 上有意义。macOS/Windows 上没有 network namespace，
// 隧道方案本身也不适用，这里给个明确失败而不是编译不过。

import "errors"

func setns(fd int, nstype int) error {
	return errors.New("network namespace 只在 Linux 上支持")
}
