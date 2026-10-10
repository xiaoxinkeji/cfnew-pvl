//go:build linux

package main

import (
	"fmt"
	"runtime"
	"syscall"
)

// SYS_SETNS 在 Go 标准库里只定义在部分架构的 zsysnum 文件中
// （amd64 没有，arm64 有）。这里按架构补齐，避免在 amd64 上编译不过。
//
// Linux setns(2) 的调用号：
//
//	x86_64 308 | arm64 268 | arm 375 | 386 346
//	mips 4344 | mips64 5303 | ppc64 350 | riscv64 268 | s390x 339

var sysSetns = map[string]uintptr{
	"amd64":   308,
	"arm64":   268,
	"arm":     375,
	"386":     346,
	"riscv64": 268,
	"s390x":   339,
	"ppc64":   350,
	"ppc64le": 350,
}

// setns 切换调用线程所在的 network namespace。
//
// Go 标准库不导出 Setns，所以直接发系统调用。
// fd 是 /proc/self/ns/net 或 /var/run/netns/<name> 打开的句柄。
//
// 注意：Setns 作用于**当前线程**。Go 的 goroutine 会在线程间迁移，
// 所以调用方必须先 runtime.LockOSThread()，否则切完可能被调度到别的
// 线程上，netns 白切了。
func setns(fd int, nstype int) error {
	num, ok := sysSetns[runtime.GOARCH]
	if !ok {
		return fmt.Errorf("架构 %s 上没有 setns 调用号", runtime.GOARCH)
	}
	_, _, errno := syscall.RawSyscall(num, uintptr(fd), uintptr(nstype), 0)
	if errno != 0 {
		return errno
	}
	return nil
}
