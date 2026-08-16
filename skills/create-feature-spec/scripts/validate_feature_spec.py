#!/usr/bin/env python3
"""Validate the minimum structure and completeness of a Spec Kit feature spec."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


REQUIRED_SECTIONS = (
    (r"^## User Scenarios & Testing (?:\*\(mandatory\)\*|_\(mandatory\)_)$", "User Scenarios & Testing"),
    (r"^## Edge Cases$", "Edge Cases"),
    (r"^## Requirements (?:\*\(mandatory\)\*|_\(mandatory\)_)$", "Requirements"),
    (r"^### Functional Requirements$", "Functional Requirements"),
    (r"^## Success Criteria (?:\*\(mandatory\)\*|_\(mandatory\)_)$", "Success Criteria"),
    (r"^### Measurable Outcomes$", "Measurable Outcomes"),
    (r"^## Assumptions$", "Assumptions"),
)

PLACEHOLDER_PATTERNS = (
    r"\{\{[A-Z_]+\}\}",
    r"\[Brief Title\]",
    r"\[(?:Describe|Explain|Assumption|Dependency|Entity|What it represents|Add more)",
    r"\[(?:initial state|action|expected outcome|boundary condition|error scenario)",
    r"\[(?:specific capability|key interaction|data requirement|behavior)\]",
    r"\[Measurable metric",
    r"\[User satisfaction metric",
    r"\[Business metric",
    r"\$ARGUMENTS",
)


def story_blocks(text: str) -> list[tuple[str, str]]:
    heading = re.compile(
        r"^### User Story (\d+) - (.+?) \(Priority: (P[1-9]\d*)\)\s*$",
        re.MULTILINE,
    )
    matches = list(heading.finditer(text))
    blocks: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        blocks.append((match.group(0), text[match.end() : end]))
    return blocks


def numbered_ids(text: str, prefix: str) -> list[int]:
    pattern = re.compile(rf"^- \*\*{prefix}-(\d{{3}})\*\*: .+$", re.MULTILINE)
    return [int(value) for value in pattern.findall(text)]


def check_sequence(values: list[int], prefix: str, errors: list[str]) -> None:
    if not values:
        errors.append(f"nenhum identificador {prefix}-NNN encontrado")
        return
    expected = list(range(1, len(values) + 1))
    if values != expected:
        errors.append(f"identificadores {prefix} devem ser sequenciais desde 001: {values}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida uma especificação de feature.")
    parser.add_argument("spec", help="Caminho para spec.md")
    args = parser.parse_args()

    path = Path(args.spec)
    if not path.is_file():
        raise SystemExit(f"erro: arquivo inexistente: {path}")
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []

    if not re.search(r"^# Feature Specification: \S.+$", text, re.MULTILINE):
        errors.append("título da feature ausente ou vazio")
    if not re.search(
        r"^\*\*Feature Branch\*\*: `\d{3}-[a-z0-9][a-z0-9-]*`\s*$",
        text,
        re.MULTILINE,
    ):
        errors.append("Feature Branch deve seguir NNN-kebab-case")
    if not re.search(r"^\*\*Created\*\*: \d{4}-\d{2}-\d{2}\s*$", text, re.MULTILINE):
        errors.append("Created deve usar YYYY-MM-DD")
    if not re.search(r'^\*\*Input\*\*: User description: ".+"\s*$', text, re.MULTILINE):
        errors.append("Input deve preservar uma descrição não vazia")

    for pattern, section_name in REQUIRED_SECTIONS:
        if not re.search(pattern, text, re.MULTILINE):
            errors.append(f"seção obrigatória ausente: {section_name}")
    for pattern in PLACEHOLDER_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            errors.append(f"placeholder não resolvido: {pattern}")

    blocks = story_blocks(text)
    if not blocks:
        errors.append("nenhuma história com prioridade encontrada")
    priorities: list[str] = []
    for heading, block in blocks:
        priority_match = re.search(r"Priority: (P[1-9]\d*)", heading)
        priorities.append(priority_match.group(1) if priority_match else "")
        if "**Why this priority**:" not in block:
            errors.append(f"história sem justificativa de prioridade: {heading}")
        if "**Independent Test**:" not in block:
            errors.append(f"história sem teste independente: {heading}")
        if "#### Acceptance Scenarios:" not in block:
            errors.append(f"história sem cenários de aceitação: {heading}")
        if not re.search(
            r"^\d+\. \*\*Given\*\* .+, \*\*When\*\* .+, \*\*Then\*\* .+$",
            block,
            re.MULTILINE,
        ):
            errors.append(f"história sem cenário Given/When/Then completo: {heading}")
    if len(priorities) != len(set(priorities)):
        warnings.append("há prioridades repetidas; confirme se as histórias têm a mesma urgência")

    fr_ids = numbered_ids(text, "FR")
    sc_ids = numbered_ids(text, "SC")
    check_sequence(fr_ids, "FR", errors)
    check_sequence(sc_ids, "SC", errors)

    for line in re.findall(r"^- \*\*FR-\d{3}\*\*: .+$", text, re.MULTILINE):
        if not re.search(r"\b(?:MUST|DEVE|DEVEM)\b", line, re.IGNORECASE):
            errors.append(f"requisito sem MUST/DEVE: {line}")
    for line in re.findall(r"^- \*\*SC-\d{3}\*\*: .+$", text, re.MULTILINE):
        if not re.search(r"\d", line):
            errors.append(f"critério sem medida numérica: {line}")

    clarifications = len(re.findall(r"\[NEEDS CLARIFICATION:[^\]]+\]", text))
    if clarifications > 3:
        errors.append(f"há {clarifications} clarificações; o máximo é 3")
    if re.search(r"\[NEEDS CLARIFICATION(?::[^\]]*)?$", text, re.MULTILINE):
        errors.append("marcação NEEDS CLARIFICATION incompleta")

    for warning in warnings:
        print(f"AVISO: {warning}")
    if errors:
        for error in errors:
            print(f"ERRO: {error}")
        print(f"FALHOU: {len(errors)} erro(s), {len(warnings)} aviso(s)")
        return 1

    print(
        "OK: "
        f"{len(blocks)} história(s), {len(fr_ids)} requisito(s), "
        f"{len(sc_ids)} critério(s), {clarifications} clarificação(ões)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
