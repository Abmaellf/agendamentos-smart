#!/usr/bin/env python3
"""Initialize a numbered Spec Kit feature specification without overwriting files."""

from __future__ import annotations

import argparse
import re
import subprocess
import unicodedata
from datetime import date
from pathlib import Path


BRANCH_NUMBER = re.compile(r"(?:^|/)(\d{3})-[a-z0-9][a-z0-9-]*$")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    if not slug:
        raise ValueError("o slug não pode ficar vazio após a normalização")
    return slug


def known_numbers(root: Path, specs_root: Path) -> set[int]:
    numbers: set[int] = set()
    if specs_root.exists():
        for child in specs_root.iterdir():
            match = BRANCH_NUMBER.search(child.name)
            if child.is_dir() and match:
                numbers.add(int(match.group(1)))

    result = subprocess.run(
        ["git", "branch", "--all", "--format=%(refname:short)"],
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        for branch in result.stdout.splitlines():
            match = BRANCH_NUMBER.search(branch.strip())
            if match:
                numbers.add(int(match.group(1)))
    return numbers


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Cria specs/NNN-slug/spec.md a partir do template da skill."
    )
    parser.add_argument("--root", default=".", help="Raiz do repositório (padrão: .)")
    parser.add_argument("--title", required=True, help="Título legível da feature")
    parser.add_argument("--slug", help="Slug kebab-case; derivado do título se omitido")
    parser.add_argument("--input", required=True, help="Descrição original do usuário")
    parser.add_argument("--number", type=int, help="Número explícito entre 1 e 999")
    parser.add_argument("--status", default="Draft", help="Status inicial (padrão: Draft)")
    parser.add_argument(
        "--output-root", default="specs", help="Diretório de specs relativo à raiz"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    if not root.is_dir():
        raise SystemExit(f"erro: raiz inexistente: {root}")

    slug = slugify(args.slug or args.title)
    specs_root = root / args.output_root
    used_numbers = known_numbers(root, specs_root)
    number = args.number if args.number is not None else max(used_numbers, default=0) + 1
    if number < 1 or number > 999:
        raise SystemExit("erro: o número deve estar entre 1 e 999")
    if number in used_numbers:
        raise SystemExit(f"erro: o número {number:03d} já está em uso")

    branch = f"{number:03d}-{slug}"
    feature_dir = specs_root / branch
    spec_path = feature_dir / "spec.md"
    if feature_dir.exists() or spec_path.exists():
        raise SystemExit(f"erro: destino já existe: {feature_dir}")

    template_path = Path(__file__).resolve().parents[1] / "assets" / "spec-template.md"
    template = template_path.read_text(encoding="utf-8")
    original_input = re.sub(r"\s+", " ", args.input).strip().replace('"', '\\"')
    replacements = {
        "{{FEATURE_NAME}}": args.title.strip(),
        "{{FEATURE_BRANCH}}": branch,
        "{{DATE}}": date.today().isoformat(),
        "{{STATUS}}": args.status.strip(),
        "{{ARGUMENTS}}": original_input,
    }
    for marker, value in replacements.items():
        template = template.replace(marker, value)

    feature_dir.mkdir(parents=True)
    spec_path.write_text(template, encoding="utf-8")
    print(spec_path.relative_to(root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
