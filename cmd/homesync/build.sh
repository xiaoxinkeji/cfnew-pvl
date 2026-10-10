#!/bin/sh
# 交叉编译常用平台产物到 dist/
# 单文件静态二进制（CGO_ENABLED=0），拷到目标机器直接跑，不用装 Go 环境。
set -e
cd "$(dirname "$0")/../.."
mkdir -p dist
NAME=homesync
for target in \
  "linux/amd64" \
  "linux/arm64" \
  "linux/386" \
  "darwin/amd64" \
  "darwin/arm64" \
  "windows/amd64" ; do
  GOOS="${target%/*}"
  GOARCH="${target#*/}"
  OUT="dist/${NAME}-${GOOS}-${GOARCH}"
  if [ "$GOOS" = "windows" ]; then OUT="${OUT}.exe"; fi
  echo "building $OUT"
  CGO_ENABLED=0 GOOS="$GOOS" GOARCH="$GOARCH" \
    go build -trimpath -ldflags="-s -w" -o "$OUT" ./cmd/homesync
done
echo "done:"
ls -lh dist/
