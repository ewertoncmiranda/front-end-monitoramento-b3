# PANORAMA-AJUDA — IMPLEMENTADO

## Entregue

Primeiro card da Início: nomes dos setores e contagem de ações corrigidos para o contrato real (setor/empresas). Contagem representa códigos de ações, não emissores distintos. Compatibilidade com o formato antigo preservada.

Introdução em linguagem simples e botões de interrogação: definição de setor e amostra, mediana das variações dos preços, janela observada, direção e tamanho das barras, interpretação de misto/andou junto/disperso, comparação de ações em pontos percentuais. Cada setor tem ajuda sobre sua atividade e seu selo com o percentual real de coesão, quando disponível. Outros permanece por último, sem destaques, por reunir classificações diversas.

Valores de ações expandidas são desvios em relação à mediana do setor. Acima/abaixo do setor não equivale a alta/queda absoluta. Percentual setorial não é variação de lucro, receita ou dividendos. Setor em queda também pode andar junto.

Boxes flutuantes reaproveitam o componente de ajuda existente, com posicionamento dentro da janela, abertura de um por vez e fechamento por Escape, clique fora, ×, rolagem e redimensionamento. Botões de ajuda não ficam aninhados no botão de expansão do setor.

## Evidência

13 casos do card (incluindo DTO real, nomes, contagem, percentuais de coesão, ordenação de Outros, ausência de dado, escape e comportamento de expansão). Teste de ajuda inclui Escape. Prévia verificada no navegador interno com dados do endpoint existente: Telecomunicações, 3 ações, +3,70%, coesão 66,7%, selo misto. A suíte completa npm test passou. Não houve alteração de cálculos no gestor ou ETL.

## Desvios

Nenhum novo endpoint, CLI, dependência ou schema. Apenas frontend. Publicação em uma única branch feature-explicacao-panorama, com vários commits; o PR abre automaticamente. Não altera a stack da porta 8082.
