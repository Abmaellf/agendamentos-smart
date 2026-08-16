# Checklist de qualidade da especificação

## 1. Evidência e escopo

- Distinguir fatos confirmados pelo usuário ou documentação de hipóteses inferidas do código.
- Descrever o comportamento desejado, sem afirmar que ele já existe.
- Manter uma feature coesa, com ator, objetivo e resultado claros.
- Registrar integrações e fluxos vizinhos como premissas ou fora do escopo quando não fizerem parte da entrega.

## 2. Histórias de usuário

- Expressar uma jornada completa e valiosa em cada história.
- Usar `P1` para o menor resultado que justifica a entrega; usar prioridades posteriores para incrementos independentes.
- Explicar a prioridade pelo valor ou risco, não pela ordem de implementação.
- Definir um teste independente que produza valor observável sem depender das histórias posteriores.
- Evitar histórias que sejam apenas camadas técnicas, componentes ou tarefas internas.

## 3. Cenários de aceitação

- Informar estado inicial em `Given`, ação única em `When` e resultado observável em `Then`.
- Cobrir ao menos o caminho principal de cada história.
- Adicionar negação, autorização, conflito ou validação quando forem essenciais ao valor da história.
- Não citar funções, bibliotecas, endpoints, tabelas ou detalhes de layout, salvo quando fizerem parte de um contrato pedido pelo usuário.

## 4. Casos de borda

- Cobrir limites numéricos, datas, duplicidade, concorrência, indisponibilidade e autorização quando aplicáveis.
- Declarar o comportamento esperado, não deixar apenas uma pergunta aberta.
- Converter uma decisão de produto realmente ausente em `[NEEDS CLARIFICATION: ...]` dentro do requisito relacionado.

## 5. Requisitos funcionais

- Numerar sequencialmente como `FR-001`, `FR-002`, ...
- Usar `DEVE`, `DEVEM` ou `MUST` e formular um comportamento verificável por requisito.
- Separar validação, persistência, autorização e feedback quando puderem falhar independentemente.
- Incluir isolamento de dados, perfis, estados de carregamento/erro/vazio/sucesso e auditoria quando o domínio exigir.
- Evitar adjetivos subjetivos e palavras ambíguas como “adequado”, “etc.”, “normalmente” ou “se possível”.

## 6. Entidades

- Descrever significado, atributos de negócio e relações, sem esquema físico ou tipos de linguagem.
- Incluir somente entidades que a feature cria, consulta ou altera.
- Registrar snapshots históricos quando mudanças futuras não puderem reescrever o passado.

## 7. Critérios de sucesso

- Numerar sequencialmente como `SC-001`, `SC-002`, ...
- Incluir número, unidade, população observada e condição de medição.
- Combinar, quando aplicável, tempo de conclusão, taxa de sucesso, prevenção de erros e resultado de negócio.
- Permanecer independente de framework, protocolo, armazenamento e topologia.
- Não transformar cobertura de código ou latência de endpoint em resultado de produto, salvo pedido explícito.

## 8. Revisão final

- Remover todos os placeholders do template.
- Manter no máximo três marcações `[NEEDS CLARIFICATION: ...]`, todas de alto impacto.
- Confirmar que cada requisito está coberto por uma história, cenário, caso de borda ou critério mensurável.
- Confirmar que nenhuma suposição contradiz as fontes consultadas.
- Executar o validador e corrigir todos os erros antes da entrega.
