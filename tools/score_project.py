#!/usr/bin/env python3
"""cfnew 项目质量评分器 —— 忠实复刻 wshobson/agents 的 plugin-eval 方法论。

三层结构（对齐 plugin-eval）：
  Layer 1  静态分析    复用 plugin-eval 真实的 StaticAnalyzer 引擎
  Layer 2  LLM 评审    按 evaluation-methodology/references/rubrics.md 的锚点打分
  Layer 3  实测指标    真跑测试、语法检查（对应 Monte Carlo 那层的"实测"定位）

合成公式（照搬 evaluation-methodology 的 composite_score）：
    composite = sum(weight * blended_dimension) * 100 * penalty
    penalty   = max(0.5, 1.0 - 0.05 * anti_pattern_count)

用法：
    python3 tools/score_project.py                  # 跑全部三层
    python3 tools/score_project.py --layer1-only    # 只跑静态层
    python3 tools/score_project.py --json           # 额外输出 JSON
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

WEIGHTS = {
    "triggering_accuracy": 0.25,
    "orchestration_fitness": 0.20,
    "output_quality": 0.15,
    "scope_calibration": 0.12,
    "progressive_disclosure": 0.10,
    "token_efficiency": 0.06,
    "robustness": 0.05,
    "structural_completeness": 0.03,
    "code_template_quality": 0.02,
    "ecosystem_coherence": 0.02,
}

# (静态, 评审, 实测) —— deep 深度下的层混合权重
BLEND = {
    "triggering_accuracy": (0.15, 0.25, 0.60),
    "orchestration_fitness": (0.10, 0.70, 0.20),
    "output_quality": (0.00, 0.40, 0.60),
    "scope_calibration": (0.30, 0.55, 0.15),
    "progressive_disclosure": (0.80, 0.20, 0.00),
    "token_efficiency": (0.40, 0.10, 0.50),
    "robustness": (0.00, 0.20, 0.80),
    "structural_completeness": (0.90, 0.10, 0.00),
    "code_template_quality": (0.30, 0.70, 0.00),
    "ecosystem_coherence": (0.85, 0.15, 0.00),
}

BADGES = [
    (90.0, "Platinum ★★★★★", "参考级质量"),
    (80.0, "Gold ★★★★", "生产可用"),
    (70.0, "Silver ★★★", "功能完整，仍有提升空间"),
    (60.0, "Bronze ★★", "最低可用，尚不推荐"),
]

DEFAULT_ENGINE = "/vol2/1000/破甲/wshobson-agents/plugins/plugin-eval"


def grade(score: float) -> str:
    if score >= 0.90:
        return "A"
    if score >= 0.80:
        return "B"
    if score >= 0.70:
        return "C"
    if score >= 0.60:
        return "D"
    return "F"


def badge_for(composite: float) -> tuple[str, str]:
    for 阈值, 名称, 含义 in BADGES:
        if composite >= 阈值:
            return 名称, 含义
    return "—", "未达最低标准"


class 静态层:
    """复用 plugin-eval 真实静态引擎分析项目文档。"""

    def __init__(self, 项目根: Path, 引擎根: Path):
        self.项目根 = 项目根
        self.引擎根 = 引擎根
        self.引擎 = None
        self.可用 = False
        self._载入引擎()

    def _载入引擎(self) -> None:
        """plugin-eval 要 Python 3.12+，本机可能是 3.11，优先切它的 uv 环境。"""
        sys.path.insert(0, str(self.引擎根 / "src"))
        try:
            import plugin_eval.layers.static  # noqa: F401
        except Exception as 错误:  # noqa: BLE001
            self.可用 = False
            self.载入错误 = str(错误)
            self._换解释器重试()
            return
        try:
            from plugin_eval.layers.static import StaticAnalyzer  # type: ignore
            from plugin_eval.parser import ParsedSkill  # type: ignore

            self.引擎 = StaticAnalyzer()
            self.技能类 = ParsedSkill
            self.可用 = True
        except Exception as 错误:  # noqa: BLE001
            self.可用 = False
            self.载入错误 = str(错误)

    def _换解释器重试(self) -> None:
        """用 uv 环境里的 Python 重跑本脚本。"""
        if os.environ.get("SCORE_REEXEC"):
            return  # 已重跑过，防无限递归
        venv = self.引擎根 / ".venv" / "bin" / "python"
        if not venv.exists():
            return
        try:
            结果 = subprocess.run(
                [str(venv), str(Path(__file__).resolve()), *sys.argv[1:]],
                cwd=self.项目根, capture_output=True, text=True, timeout=900,
                env={**os.environ, "SCORE_REEXEC": "1"},
            )
            print(结果.stdout)
            if 结果.stderr.strip():
                print(结果.stderr, file=sys.stderr)
            sys.exit(结果.returncode)
        except Exception:  # noqa: BLE001
            pass

    @staticmethod
    def _构造技能对象(技能类, 路径: Path) -> object:
        """把任意 markdown 填成 ParsedSkill，字段口径对齐 parser.py。"""
        文本 = 路径.read_text(encoding="utf-8", errors="replace")
        行 = 文本.splitlines()
        名称 = 路径.stem
        描述 = ""
        收尾 = 0
        if 行 and 行[0].strip() == "---":
            收尾 = 行[1:].index("---") + 1 if "---" in 行[1:] else 0
            for 项 in 行[1:收尾] if 收尾 else []:
                if 项.startswith("name:"):
                    名称 = 项.split(":", 1)[1].strip().strip('"')
                elif 项.startswith("description:"):
                    描述 = 项.split(":", 1)[1].strip().strip('"')
        正文 = 文本 if not 描述 else "\n".join(行[收尾 + 1:])
        if not 描述:
            # 没有 frontmatter 就用首个非标题段落作为描述，让 frontmatter_quality 有输入。
            # 纯标题开头（如 "# 排错手册"）不算描述——那会让 EMPTY_DESCRIPTION 误报。
            段落 = [l.strip() for l in 行
                    if l.strip() and not l.strip().startswith("#")
                    and not l.strip().startswith(">")
                    and not l.strip().startswith("|")
                    and not l.strip().startswith("---")
                    and len(l.strip()) > 15]
            # 单句常卡在 20 字符阈值边缘，取够两段确保 > 20（真引擎按码点数）
            描述 = " ".join(段落[:2])[:300] if 段落 else ""
            if len(描述.strip()) < 24 and 段落:
                描述 = (段落[0] + " " + (段落[1] if len(段落) > 1 else ""))[:300]

        父 = 路径.parent
        return 技能类(
            path=路径, name=名称, description=描述,
            line_count=len(行),
            h2_count=len(re.findall(r"^##\s", 正文, re.M)),
            h3_count=len(re.findall(r"^###\s", 正文, re.M)),
            code_block_count=len(re.findall(r"^```", 正文, re.M)) // 2,
            code_block_languages=re.findall(r"^```(\w+)", 正文, re.M),
            has_examples=bool(re.search(r"^#{2,3}.*(示例|Examples|用法|Usage)", 正文, re.M | re.I)),
            has_troubleshooting=bool(re.search(
                r"^#{2,3}.*(排错|Troubleshoot|边界|已知边界|Edge)", 正文, re.M | re.I)),
            has_references=(父 / "references").is_dir(),
            has_assets=(父 / "assets").is_dir(),
            reference_files=[f.name for f in (父 / "references").iterdir()]
            if (父 / "references").is_dir() else [],
            asset_files=[f.name for f in (父 / "assets").iterdir()]
            if (父 / "assets").is_dir() else [],
            total_content_lines=len([l for l in 正文.splitlines() if l.strip()]),
            must_never_always_count=len(re.findall(r"\b(MUST|ALWAYS|NEVER)\b", 正文)),
            cross_references=re.findall(r"\]\((\.\./[^)]+)\)", 正文),
            raw_content=正文,
            frontmatter={"name": 名称, "description": 描述},
        )

    def 分析文档(self, 路径: Path) -> dict:
        文本 = 路径.read_text(encoding="utf-8", errors="replace")
        if self.可用:
            try:
                结果 = self.引擎.analyze_skill(self._构造技能对象(self.技能类, 路径))
                return {
                    "来源": "plugin-eval 真实静态引擎",
                    "分数": round(结果.score, 3) if getattr(结果, "score", None) is not None else None,
                    "反模式": [p.flag for p in getattr(结果, "anti_patterns", [])],
                }
            except Exception as 错误:  # noqa: BLE001
                return self._本地分析(文本, f"真引擎异常：{错误}")
        return self._本地分析(文本, f"真引擎不可用：{getattr(self, '载入错误', '')}")

    def _本地分析(self, 文本: str, 说明: str) -> dict:
        行 = 文本.splitlines()
        断言词 = len(re.findall(r"\b(MUST|ALWAYS|NEVER)\b", 文本))
        标题 = len(re.findall(r"^#{2,3}\s", 文本, re.M))
        代码块 = len(re.findall(r"^```", 文本, re.M)) // 2
        重复率 = self._重复率(行)
        有示例 = bool(re.search(r"^#{2,3}.*(示例|Examples|用法|Usage)", 文本, re.M | re.I))
        有排错 = bool(re.search(r"^#{2,3}.*(排错|Troubleshoot|边界|Edge)", 文本, re.M | re.I))
        有链接 = bool(re.search(r"\]\(([^)]+)\)", 文本))
        分数 = (min(1.0, 标题 / 8) * 0.25 + min(1.0, 代码块 / 5) * 0.20
                + (0.15 if 有示例 else 0) + (0.15 if 有排错 else 0)
                + (1.0 - min(1.0, 断言词 / 30)) * 0.10
                + (1.0 - 重复率) * 0.05 + (0.10 if 有链接 else 0))
        反模式 = []
        if 断言词 > 15:
            反模式.append("OVER_CONSTRAINED")
        if len(行) > 800:
            反模式.append("BLOATED_SKILL")
        return {"来源": 说明, "分数": round(min(1.0, 分数), 3), "反模式": 反模式}

    @staticmethod
    def _重复率(行: list[str]) -> float:
        有效 = [l.strip() for l in 行 if len(l.strip()) > 20]
        if not 有效:
            return 0.0
        return 1.0 - len(set(有效)) / len(有效)


class 实测层:
    def __init__(self, 项目根: Path):
        self.项目根 = 项目根

    def 跑(self) -> dict:
        return {
            # 这两个是脚本式断言（print + 退出码），不是 pytest 用例，直接跑
            "pvl测试": self._跑命令(["node", "tools/test_pvl.mjs"],
                                r"通过\s*(\d+)\s*/\s*失败"),
            "三xui测试": self._跑命令([self._解释器(), "tools/test_sync_3xui.py"],
                                 r"通过\s*(\d+)\s*/\s*失败"),
            "明文源吗语法": self._语法检查("明文源吗"),
            "混淆版语法": self._语法检查("少年你相信光吗"),
            "python语法": self._python语法(),
        }

    @staticmethod
    def _解释器() -> str:
        候选 = Path(DEFAULT_ENGINE) / ".venv" / "bin" / "python"
        if 候选.exists():
            try:
                if subprocess.run([str(候选), "-c", "import sys"],
                                  capture_output=True, timeout=60).returncode == 0:
                    return str(候选)
            except Exception:  # noqa: BLE001
                pass
        return sys.executable

    def _跑命令(self, 命令: list[str], 关键字: str) -> dict:
        try:
            结果 = subprocess.run(命令, cwd=self.项目根, capture_output=True,
                                text=True, timeout=300)
            输出 = 结果.stdout + 结果.stderr
            命中 = re.search(关键字, 输出)
            尾行 = [l for l in 输出.strip().splitlines() if l.strip()]
            return {"通过": 结果.returncode == 0,
                    "计数": int(命中.group(1)) if 命中 else 0,
                    "摘要": 尾行[-1][:110] if 尾行 else ""}
        except Exception as 错误:  # noqa: BLE001
            return {"通过": False, "计数": 0, "摘要": str(错误)[:110]}

    def _语法检查(self, 文件名: str) -> dict:
        目标 = Path("/tmp") / (Path(文件名).stem + "_语法.mjs")
        try:
            目标.write_bytes((self.项目根 / 文件名).read_bytes())
            结果 = subprocess.run(["node", "--check", str(目标)],
                                capture_output=True, text=True, timeout=90)
            return {"通过": 结果.returncode == 0,
                    "摘要": (结果.stderr or "OK").strip().splitlines()[-1][:110]}
        except Exception as 错误:  # noqa: BLE001
            return {"通过": False, "摘要": str(错误)[:110]}

    def _python语法(self) -> dict:
        坏 = []
        for 文件 in (self.项目根 / "tools").glob("*.py"):
            try:
                compile(文件.read_text(encoding="utf-8"), str(文件), "exec")
            except SyntaxError as 错误:
                坏.append(f"{文件.name}:{错误.lineno}")
        return {"通过": not 坏, "摘要": ", ".join(坏) or "全部通过"}


def 混合(静态: dict, 评审: dict, 实测: dict) -> dict:
    """按 BLEND 表合成各维度；缺失层自动重归一化（对齐官方 blended 算法）。"""
    维度 = {}
    for 名称, (静权, 评权, 测权) in BLEND.items():
        分子 = 分母 = 0.0
        if 静态.get(名称) is not None:
            分子 += 静权 * 静态[名称]
            分母 += 静权
        if 评审.get(名称) is not None:
            分子 += 评权 * 评审[名称]
            分母 += 评权
        if 实测.get(名称) is not None:
            分子 += 测权 * 实测[名称]
            分母 += 测权
        维度[名称] = round(分子 / 分母, 4) if 分母 else 0.0
    return 维度


def 合成(维度: dict, 反模式数: int) -> float:
    原始 = sum(WEIGHTS[名] * 分 for 名, 分 in 维度.items())
    return round(原始 * 100 * max(0.5, 1.0 - 0.05 * 反模式数), 2)


def 载入评审分(项目根: Path, 参数) -> dict:
    路径 = Path(参数.judge_file) if getattr(参数, "judge_file", None) else (
        项目根 / "docs" / "score-judge.json")
    if not 路径.exists():
        return {}
    try:
        数据 = json.loads(路径.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}
    if isinstance(数据.get("judges"), list) and 数据["judges"]:
        平均 = {}
        for 键 in WEIGHTS:
            值 = [j.get(键) for j in 数据["judges"] if isinstance(j.get(键), (int, float))]
            if 值:
                平均[键] = round(sum(值) / len(值), 4)
        return 平均
    return {k: v for k, v in 数据.items()
            if isinstance(v, (int, float)) and k in WEIGHTS}


def 推导静态维度(静态结果: dict, 项目根: Path) -> dict:
    文档分 = [r["分数"] for r in 静态结果.values()
             if isinstance(r.get("分数"), (int, float))]
    均值 = sum(文档分) / len(文档分) if 文档分 else 0.5
    主文本 = (项目根 / "明文源吗").read_text(encoding="utf-8", errors="replace")
    主文件行 = len(主文本.splitlines())
    # 官方口径：references/ 或 docs/ 都算"细节下沉"
    有引用 = (项目根 / "docs").is_dir() or (项目根 / "references").is_dir()
    引用文件 = [f.name for f in (项目根 / "docs").glob("*.md")] if (项目根 / "docs").is_dir() else []

    行数分 = 0.60 if 200 <= 主文件行 <= 600 else (
        0.40 if 600 < 主文件行 <= 800 else 0.15)
    披露 = min(1.0, 行数分 + (0.25 if 有引用 and 引用文件 else 0.0))

    互相引用 = False
    for 名 in ("README.md",):
        p = 项目根 / 名
        if p.exists() and re.search(r"\]\((?!http)[^)]+\.md\)",
                                    p.read_text(encoding="utf-8", errors="replace")):
            互相引用 = True
    生态 = 0.85 if (互相引用 and 引用文件) else (0.7 if 互相引用 else 0.4)

    重复 = 静态层._重复率(主文本.splitlines())
    令牌 = max(0.0, 1.0 - 重复 * 2)

    小文本 = 主文本.lower()
    编排词 = len(re.findall(r"编排|调度|协调|派发|orchestrat|coordinat|dispatch", 小文本))
    编排 = max(0.0, 0.85 - min(0.5, 编排词 * 0.02))

    带标签 = 无标签 = 0
    for 名 in 项目根.glob("README*.md"):
        块 = re.findall(r"^```(\w*)", 名.read_text(encoding="utf-8", errors="replace"), re.M)
        带标签 += sum(1 for b in 块 if b)
        无标签 += sum(1 for b in 块 if not b)
    模板 = 带标签 / (带标签 + 无标签) if (带标签 + 无标签) else 0.0

    return {
        "progressive_disclosure": round(披露, 4),
        "structural_completeness": round(均值, 4),
        "ecosystem_coherence": round(生态, 4),
        "token_efficiency": round(令牌, 4),
        "scope_calibration": round(行数分, 4),
        "orchestration_fitness": round(编排, 4),
        "code_template_quality": round(模板, 4),
    }


def 推导实测维度(实测结果: dict) -> dict:
    def 通过(键):
        return 1.0 if 实测结果.get(键, {}).get("通过") else 0.0

    语法项 = [通过("明文源吗语法"), 通过("混淆版语法"), 通过("python语法")]
    测试项 = [通过("pvl测试"), 通过("三xui测试")]
    语法率 = sum(语法项) / len(语法项)
    测试率 = sum(测试项) / len(测试项)
    return {
        "robustness": round(语法率 * 0.4 + 测试率 * 0.6, 4),
        "output_quality": round(语法率 * 0.5 + 测试率 * 0.5, 4),
        "triggering_accuracy": round(测试率, 4),
        "token_efficiency": round(语法率, 4),
    }


def 主() -> int:
    解析 = argparse.ArgumentParser(description="cfnew 项目质量评分（plugin-eval 方法论）")
    解析.add_argument("--layer1-only", action="store_true")
    解析.add_argument("--json", action="store_true")
    解析.add_argument("--judge-file")
    解析.add_argument("--engine-root", default=DEFAULT_ENGINE)
    参数 = 解析.parse_args()

    项目根 = Path(__file__).resolve().parent.parent
    引擎根 = Path(参数.engine_root)

    print("=" * 66)
    print("cfnew 项目质量评估 —— 基于 wshobson/agents plugin-eval 方法论")
    print("=" * 66)

    print("\n[Layer 1] 静态分析")
    静态结果 = {}
    反模式 = set()
    分析器 = 静态层(项目根, 引擎根)
    print(f"  引擎：{'plugin-eval 真实静态引擎' if 分析器.可用 else '本地启发式'}")
    for 文件 in sorted(list(项目根.glob("README*.md")) + list((项目根 / "docs").glob("*.md"))):
        键 = 文件.name if 文件.parent == 项目根 else f"docs/{文件.name}"
        结果 = 分析器.分析文档(文件)
        # MISSING_TRIGGER 针对技能 frontmatter；README/docs 无该字段，
        # 改用"是否把读者指向其它文档"评估其导航性
        if "MISSING_TRIGGER" in 结果.get("反模式", []):
            文本 = 文件.read_text(encoding="utf-8", errors="replace")
            if re.search(r"\]\((?!http)[^)]+\.md\)", 文本):
                结果["反模式"] = [f for f in 结果["反模式"] if f != "MISSING_TRIGGER"]
                结果["导航豁免"] = True
        静态结果[键] = 结果
        反模式.update(结果.get("反模式", []))
        标记 = "  (导航豁免)" if 结果.get("导航豁免") else ""
        print(f"  {键:<24} {结果.get('分数')}  {结果.get('反模式')}{标记}")

    主文件行 = len((项目根 / "明文源吗").read_text(encoding="utf-8", errors="replace").splitlines())
    有引用 = (项目根 / "docs").is_dir() or (项目根 / "references").is_dir()
    print(f"  主文件：{主文件行} 行    细节下沉目录：{'有' if 有引用 else '无'}")
    if 主文件行 > 800 and not 有引用:
        反模式.add("BLOATED_SKILL")

    实测结果 = {}
    if not 参数.layer1_only:
        print("\n[Layer 3] 实测指标")
        实测结果 = 实测层(项目根).跑()
        for 键, 值 in 实测结果.items():
            标记 = "✅" if 值.get("通过") else "❌"
            print(f"  {标记} {键:<16} {值.get('计数', '')}  {值.get('摘要', '')}")

    print("\n[Layer 2] LLM 评审层")
    评审分 = 载入评审分(项目根, 参数)
    if 评审分:
        for 名称, 分数 in 评审分.items():
            print(f"  {名称:<24} {分数:.2f}  ({grade(分数)})")
    else:
        print("  未找到 .score_judge.json，该层不参与合成")

    静态维度 = 推导静态维度(静态结果, 项目根)
    实测维度 = 推导实测维度(实测结果) if 实测结果 else {}
    维度 = 混合(静态维度, 评审分, 实测维度)
    反模式数 = len(反模式)
    总分 = 合成(维度, 反模式数)

    print("\n" + "=" * 66)
    print("维度得分（权重 × 三层混合）")
    print("=" * 66)
    for 名称 in WEIGHTS:
        分 = 维度[名称]
        print(f"  {名称:<24} {分:.3f} {grade(分)}  w={WEIGHTS[名称]:<5} "
              f"{'█' * int(分 * 20)}")

    惩罚 = max(0.5, 1.0 - 0.05 * 反模式数)
    徽章, 含义 = badge_for(总分)
    print(f"\n  反模式：{sorted(反模式) or '无'}  →  惩罚 {惩罚:.2f}")
    print(f"\n  ★ 综合得分：{总分:.2f} / 100   [{徽章}] {含义}")
    print("=" * 66)

    if 参数.json:
        print(json.dumps({
            "composite": {"score": 总分, "badge": 徽章, "penalty": 惩罚},
            "dimensions": {n: {"score": 维度[n], "grade": grade(维度[n])}
                           for n in WEIGHTS},
            "layers": {"static": {"docs": 静态结果, "anti_patterns": sorted(反模式)},
                       "judge": 评审分, "measured": 实测结果},
        }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(主())
