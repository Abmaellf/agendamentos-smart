---
name: create-feature-spec
description: Criar e revisar especificações funcionais de features no padrão GitHub Spec Kit, com branch numerada, histórias de usuário priorizadas e testáveis, cenários Given/When/Then, casos de borda, requisitos funcionais, entidades, critérios mensuráveis e premissas. Usar ao transformar uma descrição de produto em `specs/NNN-feature-name/spec.md`, iniciar trabalho spec-driven, completar o template de feature ou validar uma spec antes do planejamento e da implementação.
---

# Criar especificação de feature

Produzir uma especificação centrada no comportamento e no valor para o usuário. Não definir stack, componentes, endpoints, banco de dados ou estratégia de implementação nesta etapa.

## Processo

1. Reunir evidências antes de escrever:
   - ler instruções locais (`AGENTS.md`, quando existir), documentação de produto e specs relacionadas;
   - inspecionar o código somente para separar comportamento existente, comportamento planejado e hipótese;
   - tratar a descrição do usuário como fonte principal e não promover uma hipótese a requisito confirmado.
2. Delimitar a feature:
   - registrar o objetivo, os atores, o fluxo principal e o que fica fora do escopo;
   - fazer uma pergunta somente quando uma decisão ausente mudar materialmente o produto;
   - quando for possível continuar, marcar a lacuna como `[NEEDS CLARIFICATION: pergunta objetiva]`, com no máximo três marcações de alto impacto.
3. Definir a identidade:
   - escolher um slug curto, em kebab-case e orientado à ação;
   - usar o próximo número disponível em `specs/` e nas branches Git locais/remotas já conhecidas;
   - apenas registrar o nome da feature branch na spec; criar ou trocar a branch somente se o usuário pedir.
4. Inicializar o arquivo a partir do asset:

   ```bash
   python3 skills/create-feature-spec/scripts/init_feature_spec.py \
     --root . \
     --title "Título da feature" \
     --slug "acao-da-feature" \
     --input "Descrição original do usuário"
   ```

   Usar `--number N` somente quando o identificador já tiver sido decidido. O script recusa sobrescrever uma spec existente.

5. Substituir todos os placeholders:
   - ordenar histórias por valor em `P1`, `P2`, `P3` e continuar apenas se necessário;
   - tornar cada história demonstrável e testável de forma independente;
   - escrever cenários observáveis em Given/When/Then, incluindo falhas relevantes;
   - escrever requisitos atômicos com `DEVE` ou `MUST`, sem decisões técnicas;
   - incluir entidades somente quando houver dados de negócio;
   - escrever resultados mensuráveis e independentes de tecnologia;
   - registrar premissas e limites de escopo explicitamente.
6. Ler [references/spec-quality.md](references/spec-quality.md) e revisar a spec contra o checklist completo.
7. Validar e corrigir até obter sucesso:

   ```bash
   python3 skills/create-feature-spec/scripts/validate_feature_spec.py \
     specs/NNN-acao-da-feature/spec.md
   ```

8. Entregar o caminho da spec, o escopo coberto, as clarificações restantes e o resultado da validação.

## Regras de conteúdo

- Manter os títulos canônicos do template, mesmo quando o conteúdo estiver em português.
- Preservar a descrição original em `Input`; resumir somente quebras de linha e espaços repetidos.
- Não confundir critério de aceitação com detalhe de interface ou arquitetura.
- Não declarar uma feature implementada por ela estar especificada.
- Não usar métricas vagas como “rápido”, “intuitivo”, “robusto” ou “a maioria” sem quantidade e contexto de medição.
- Não agrupar comportamentos independentes em um único requisito.
- Garantir que casos de erro indiquem o resultado esperado e não somente que “um erro ocorre”.

## Recursos

- `assets/spec-template.md`: template canônico copiado pelo inicializador.
- `references/spec-quality.md`: checklist detalhado de qualidade e rastreabilidade.
- `scripts/init_feature_spec.py`: escolhe o identificador e cria a estrutura da feature.
- `scripts/validate_feature_spec.py`: verifica estrutura, placeholders, histórias, requisitos, cenários e métricas.
