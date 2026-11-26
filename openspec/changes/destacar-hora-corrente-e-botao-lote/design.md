# Design

## Context

Conforme `proposal.md`, a agenda semanal já calcula a hora corrente por fuso da unidade, distribui os agendamentos em uma matriz com linhas de altura variável e mantém a ação de lote em `AppointmentsPage`. O botão atual é um controle nativo com estado expandido e a operação de lote já usa uma mutação única; a mudança deve manter o contêiner sem linha roxa no repouso e revelar o contorno apenas no hover, sem duplicar a regra de horário ou de elegibilidade.

## Goals / Non-Goals

**Goals:**

- Representar cada combinação de dia e hora como uma área visual sem borda permanente e revelar seu contorno no hover, respeitando a geometria real dos cartões simultâneos e a altura expandida da linha.
- Manter o hover verde da linha da hora e restringir a borda roxa adicional à célula sob o cursor, inclusive quando a grade tiver rolagem horizontal ou a coluna corrente for a última visível.
- Integrar um botão circular simples com “+” ao canto inferior direito, sem perder semântica de botão, foco, teclado ou leitura por tecnologia assistiva.
- Cobrir a apresentação e o fluxo de lote com testes observáveis em DOM e uma inspeção visual local.

**Non-Goals:**

- Alterar o cálculo do fuso, a janela temporal ou a lista de agendamentos elegíveis.
- Substituir o fluxo de abertura/confirmação da ação existente ou criar chamadas individuais por paciente.
- Alterar a aparência dos cartões fora do agrupamento da hora corrente ou criar uma visualização Dia/Lista.

## Decisions

### 1. Derivar o agrupamento da geometria já calculada

Cada célula visual deverá usar a mesma coluna do dia, hora e geometria de linha que a matriz já utiliza. O hover verde continuará sendo derivado da hora compartilhada pela linha; a borda roxa adicional só será aplicada à chave dia + hora cujo estado de hover estiver ativo. Na célula corrente com cartões simultâneos, a área continua abrangendo a altura efetiva necessária para o agrupamento.

Alternativa descartada: desenhar a borda diretamente em cada cartão, pois isso repetiria o destaque e não comunicaria que o “+” atua sobre o conjunto.

### 2. Separar a camada de contorno da interação dos cartões

A moldura poderá ser uma camada visual sobre cada célula, com `pointer-events` configurado para não bloquear a seleção dos cartões. O estado de hover/foco será refletido por classes ou atributos estáveis da chave dia + hora, reaproveitando o estado de hora destacada que a matriz já mantém; o repouso não renderizará linha roxa e posicionar o cursor não poderá disparar a mutação.

Alternativa descartada: transformar todo o contêiner em um único botão, porque isso quebraria a abertura de detalhes por paciente e confundiria a semântica de ação em lote com a seleção de cartões.

### 3. Manter somente o botão nativo no canto

O canto inferior direito receberá somente um botão nativo circular com o ícone “+”, posicionado relativamente ao contêiner e ancorado ao limite inferior e direito do agrupamento, com fallback para a borda interna da última coluna. O botão usará `border-radius: 50%`; não haverá diagonal, clip-path, preenchimento triangular ou linha adicional além do próprio botão. O controle seguirá com nome acessível, `aria-expanded`, foco visível e o mesmo tratamento de carregamento/desabilitação.

Alternativa descartada: usar uma imagem rasterizada da referência, porque ela não seria responsiva nem acessível.

### 4. Preservar o contrato de lote

O acionamento confirmado continuará passando pelo comando de atualização em lote existente, com o contexto de unidade e hora corrente, e a agenda continuará sendo refeita somente após a confirmação. A apresentação poderá reutilizar o estado expandido atual e seus textos de feedback; não haverá alteração de endpoint, payload ou iteração de chamadas no frontend.

### 5. Testar estilo sem depender de layout calculado pelo jsdom

Os testes devem verificar atributos e classes/estilos observáveis, como `data-testid`, cor de borda, ausência de marcador/elemento triangular, posição relativa ao canto e associação com a hora corrente. O comportamento de lote deve continuar sendo validado por uma única requisição mockada e pela atualização da lista. A inspeção visual deve cobrir múltiplos cartões simultâneos, coluna intermediária, última coluna e viewport estreita.

## Risks / Trade-offs

- [A moldura pode cobrir a área clicável de um cartão] → manter a camada de contorno não interativa e testar a abertura de detalhes de cada cartão.
- [O botão pode perder a posição no canto durante overflow ou rolagem] → preservar o overflow visível da matriz, ancorar o botão à célula e verificar a última coluna em viewport larga e estreita.
- [A linha corrente pode crescer por cartões simultâneos] → calcular a área pelo limite visual efetivo do agrupamento, não por uma altura constante.
- [A cor roxa pode perder contraste sobre cartões coloridos] → manter o contorno fora do conteúdo dos cartões, reforçar o estado de foco e confirmar a leitura do ícone no teste visual.

## Migration Plan

1. Implementar o contorno de hover e o botão simples na grade, sem tocar no contrato da API.
2. Atualizar os testes direcionados e a documentação da feature.
3. Executar testes da grade/ação, lint, build e validação estrita da change; realizar inspeção visual local.
4. Em rollback, remover somente as classes/elementos de hover, preservando o botão simples e a mutação de lote já existentes; nenhuma migração de dados é necessária.
