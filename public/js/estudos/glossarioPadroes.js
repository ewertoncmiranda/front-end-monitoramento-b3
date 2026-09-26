// Unica responsabilidade: explicar em detalhe cada padrao que o detector da
// aba Velas reconhece. Conteudo estatico, indexado pelo MESMO `id` usado em
// analise/detectorPadroes.js - e esse id que o cartao do painel usa para
// montar o link `#/glossario?padrao=<id>`.
//
// Cada verbete responde sempre as mesmas quatro perguntas, na mesma ordem:
//   fundamento  - por que o desenho existe (quem comprou, quem vendeu);
//   indica      - o que ele sugere, e o que NAO sugere;
//   cenarios    - onde ele costuma ser usado e onde perde sentido;
//   combinaCom  - ids de outros padroes que confirmam ou contradizem.
// `nestePainel` diz como o detector daqui o reconhece, para o leitor saber
// que a regra e mecanica e pode diferir da definicao de um livro.

export const PADROES_DETALHADOS = [
  {
    id: 'doji',
    termo: 'Doji',
    fundamento:
      'Abertura e fechamento praticamente iguais: compradores e vendedores empurraram o preço durante o pregão e terminaram empatados. O tamanho das sombras mostra quão longe cada lado chegou antes de recuar.',
    indica:
      'Indecisão, não direção. Depois de uma tendência longa, sugere que o lado dominante perdeu força; no meio de um movimento lateral, não diz nada.',
    cenarios: [
      'Topo ou fundo de uma tendência já estabelecida, como aviso de possível pausa.',
      'Perto de suporte, resistência ou da máxima/mínima de 52 semanas.',
      'Perde sentido em ativo de baixa liquidez, onde abertura e fechamento podem ser um único negócio.',
    ],
    combinaCom: ['estrela-manha', 'estrela-noite', 'harami', 'volume-anomalo'],
    nestePainel:
      'Corpo de no máximo 10% da amplitude do dia. Aparece ~3,8 vezes por janela em séries aleatórias: sozinho, é comum demais para ser informação.',
  },
  {
    id: 'martelo',
    termo: 'Martelo',
    fundamento:
      'O preço foi derrubado com força durante o pregão, mas os compradores absorveram a venda e levaram o fechamento de volta para perto da máxima. A sombra inferior longa é o registro dessa rejeição da baixa.',
    indica:
      'Possível esgotamento da queda. É um sinal de alerta, não de compra: a confirmação clássica é o pregão seguinte fechar acima do corpo do martelo.',
    cenarios: [
      'Somente depois de uma queda — a mesma forma depois de alta é o enforcado.',
      'Mais relevante quando toca um suporte conhecido ou a mínima de 52 semanas.',
      'Ganha peso com volume acima da média no dia do martelo ou na confirmação.',
    ],
    combinaCom: ['engolfo-alta', 'estrela-manha', 'volume-anomalo', 'doji'],
    nestePainel:
      'Sombra inferior de pelo menos 2x o corpo, sombra superior no máximo do tamanho do corpo, e queda de 2% ou mais nas 5 velas anteriores.',
  },
  {
    id: 'enforcado',
    termo: 'Enforcado',
    fundamento:
      'Geometria idêntica à do martelo, mas no topo de uma alta. A sombra inferior longa mostra que, pela primeira vez em dias, houve venda forte o bastante para derrubar o preço durante o pregão.',
    indica:
      'Primeiro sinal de que a alta pode estar perdendo sustentação. É mais fraco que o martelo: exige confirmação por fechamento abaixo do corpo no dia seguinte.',
    cenarios: [
      'Somente depois de uma alta — é o contexto que separa o enforcado do martelo.',
      'Mais relevante perto de resistência ou da máxima de 52 semanas.',
      'Sem confirmação no pregão seguinte, costuma ser só ruído.',
    ],
    combinaCom: ['engolfo-baixa', 'estrela-noite', 'estrela-cadente', 'volume-anomalo'],
    nestePainel:
      'Mesma regra geométrica do martelo, com alta de 2% ou mais nas 5 velas anteriores.',
  },
  {
    id: 'estrela-cadente',
    termo: 'Estrela cadente',
    fundamento:
      'Os compradores levaram o preço bem acima da abertura, mas não conseguiram sustentar: o fechamento voltou para perto da mínima. A sombra superior longa registra a rejeição dos preços mais altos.',
    indica:
      'Possível exaustão da alta. É o espelho do martelo: sinal de alerta que pede confirmação por queda no pregão seguinte.',
    cenarios: [
      'Somente depois de uma alta — depois de queda, a mesma forma é chamada de martelo invertido.',
      'Mais forte quando a sombra toca uma resistência ou a máxima de 52 semanas.',
      'Ganha peso com volume alto, que mostra que muita gente vendeu naqueles preços.',
    ],
    combinaCom: ['estrela-noite', 'engolfo-baixa', 'enforcado', 'volume-anomalo'],
    nestePainel:
      'Sombra superior de pelo menos 2x o corpo, sombra inferior no máximo do tamanho do corpo, e alta de 2% ou mais nas 5 velas anteriores.',
  },
  {
    id: 'marubozu-alta',
    termo: 'Marubozu de alta',
    fundamento:
      'Corpo cheio, quase sem sombras: abriu perto da mínima e fechou perto da máxima. Os compradores controlaram o pregão do primeiro ao último negócio, sem recuo relevante.',
    indica:
      'Força compradora naquele dia. No início de um movimento, sugere continuação; depois de uma alta longa, pode ser o último fôlego (clímax de compra).',
    cenarios: [
      'Rompimento de uma resistência ou de uma faixa lateral.',
      'Saída de um fundo, confirmando um martelo ou uma estrela da manhã.',
      'Desconfie em dia de notícia ou de gap: o corpo cheio pode ser só a reação a um fato isolado.',
    ],
    combinaCom: ['martelo', 'estrela-manha', 'engolfo-alta', 'volume-anomalo'],
    nestePainel: 'Corpo de pelo menos 90% da amplitude, com fechamento acima da abertura.',
  },
  {
    id: 'marubozu-baixa',
    termo: 'Marubozu de baixa',
    fundamento:
      'Corpo cheio de baixa: abriu perto da máxima e fechou perto da mínima. Os vendedores dominaram a sessão inteira, sem que os compradores conseguissem reagir.',
    indica:
      'Força vendedora naquele dia. No início de uma queda, sugere continuação; depois de uma queda longa, pode ser capitulação (venda em pânico perto do fundo).',
    cenarios: [
      'Perda de um suporte ou saída de uma faixa lateral para baixo.',
      'Confirmação de um enforcado, estrela cadente ou estrela da noite.',
      'Confira se não é dia ex-dividendos com preço bruto: a queda pode ser só o provento saindo do preço.',
    ],
    combinaCom: ['estrela-noite', 'engolfo-baixa', 'enforcado', 'gap'],
    nestePainel: 'Corpo de pelo menos 90% da amplitude, com fechamento abaixo da abertura.',
  },
  {
    id: 'engolfo-alta',
    termo: 'Engolfo de alta',
    fundamento:
      'Depois de um dia de baixa, o dia seguinte abre no nível do fechamento anterior (ou abaixo) e fecha acima da abertura anterior. Os compradores desfizeram toda a queda da véspera e ainda avançaram.',
    indica:
      'Troca de controle de vendedores para compradores. Quanto maior o corpo da segunda vela em relação à primeira, mais forte a leitura.',
    cenarios: [
      'Depois de uma queda — no meio de uma lateralização é extremamente comum e pouco informativo.',
      'Perto de suporte ou da mínima de 52 semanas.',
      'Com volume acima da média na segunda vela; sem volume, a troca de controle é duvidosa.',
    ],
    combinaCom: ['martelo', 'estrela-manha', 'marubozu-alta', 'volume-anomalo'],
    nestePainel:
      'Vela anterior de baixa, atual de alta, abertura ≤ fechamento anterior e fechamento ≥ abertura anterior. Aparece ~7,4 vezes por janela no ruído: compare a contagem real com esse número.',
  },
  {
    id: 'engolfo-baixa',
    termo: 'Engolfo de baixa',
    fundamento:
      'Depois de um dia de alta, o dia seguinte abre no nível do fechamento anterior (ou acima) e fecha abaixo da abertura anterior. Os vendedores apagaram toda a alta da véspera.',
    indica:
      'Troca de controle de compradores para vendedores. É um dos padrões de reversão de topo mais citados, mas também um dos mais frequentes no ruído.',
    cenarios: [
      'Depois de uma alta, perto de resistência ou da máxima de 52 semanas.',
      'Com volume acima da média na segunda vela.',
      'Perde força em mercado lateral, onde engolfos se alternam sem consequência.',
    ],
    combinaCom: ['enforcado', 'estrela-cadente', 'estrela-noite', 'volume-anomalo'],
    nestePainel:
      'Vela anterior de alta, atual de baixa, abertura ≥ fechamento anterior e fechamento ≤ abertura anterior. Aparece ~8,8 vezes por janela no ruído.',
  },
  {
    id: 'harami',
    termo: 'Harami (vela dentro)',
    fundamento:
      'O corpo de hoje cabe inteiro dentro do corpo de ontem. "Harami" é "grávida" em japonês: a vela grande "carrega" a pequena. Mostra que o movimento forte da véspera não teve continuidade.',
    indica:
      'Perda de força e possível pausa. Não indica direção por si só: é a vela seguinte que diz se o movimento anterior retoma ou se reverte.',
    cenarios: [
      'Depois de uma vela longa no fim de uma tendência.',
      'Quando a vela de dentro é um doji (harami cross), a leitura de indecisão é mais forte.',
      'Em janela curta é quase inútil: é o padrão mais comum no ruído deste painel.',
    ],
    combinaCom: ['doji', 'engolfo-alta', 'engolfo-baixa', 'estrela-manha', 'estrela-noite'],
    nestePainel:
      'Corpo atual contido no corpo anterior. Aparece ~16 vezes por janela de 63 velas aleatórias — uma a cada quatro. Encontrá-lo não é informação.',
  },
  {
    id: 'estrela-manha',
    termo: 'Estrela da manhã',
    fundamento:
      'Três velas: uma baixa forte, uma vela de corpo pequeno (indecisão) e uma alta que recupera mais da metade da primeira. Conta a história completa de uma reversão — venda, empate e retomada compradora.',
    indica:
      'Possível fundo. É considerado mais confiável que padrões de uma vela porque já traz a própria confirmação na terceira vela.',
    cenarios: [
      'Depois de uma queda clara, perto de suporte ou da mínima de 52 semanas.',
      'Mais forte quando a vela do meio é um doji e a terceira vem com volume alto.',
      'A calibragem deste painel mostrou vantagem aparente mesmo no ruído: confira a taxa-base e o tamanho da amostra antes de confiar.',
    ],
    combinaCom: ['doji', 'martelo', 'engolfo-alta', 'marubozu-alta', 'volume-anomalo'],
    nestePainel:
      '1ª vela de baixa com corpo grande, 2ª de corpo pequeno, 3ª de alta fechando acima do meio da 1ª.',
  },
  {
    id: 'estrela-noite',
    termo: 'Estrela da noite',
    fundamento:
      'Espelho da estrela da manhã: uma alta forte, uma vela de indecisão e uma baixa que devolve mais da metade da primeira. Compradores dominaram, empataram e depois perderam o controle.',
    indica:
      'Possível topo. Como a estrela da manhã, já contém a própria confirmação na terceira vela.',
    cenarios: [
      'Depois de uma alta clara, perto de resistência ou da máxima de 52 semanas.',
      'Mais forte quando a vela do meio é um doji ou uma estrela cadente.',
      'Em preço bruto, confira se a terceira vela não é dia ex-dividendos.',
    ],
    combinaCom: ['doji', 'estrela-cadente', 'enforcado', 'engolfo-baixa', 'marubozu-baixa'],
    nestePainel:
      '1ª vela de alta com corpo grande, 2ª de corpo pequeno, 3ª de baixa fechando abaixo do meio da 1ª.',
  },
  {
    id: 'gap',
    termo: 'Gap de abertura (alerta)',
    fundamento:
      'O pregão abriu longe do fechamento anterior, sem negócios no meio. Acontece quando surge informação fora do horário de negociação — resultado, fato relevante, cenário externo — ou quando um provento sai do preço.',
    indica:
      'Que algo mudou entre um pregão e outro. Em preço bruto, um gap de baixa na data ex pode ser só o dividendo ou o desdobramento, e não venda de verdade.',
    cenarios: [
      'Gap com volume alto depois de notícia costuma marcar o início de um movimento.',
      'Gap em direção contrária à tendência, sem volume, costuma ser "fechado" nos dias seguintes.',
      'Sempre compare com o preço ajustado antes de tirar conclusão.',
    ],
    combinaCom: ['volume-anomalo', 'marubozu-alta', 'marubozu-baixa'],
    nestePainel: 'Abertura diferente do fechamento anterior em mais de 2%.',
  },
  {
    id: 'volume-anomalo',
    termo: 'Volume anômalo (alerta)',
    fundamento:
      'Volume é quantas ações trocaram de mão. Muito acima da média significa que muita gente concordou em negociar naqueles preços — o movimento teve participação.',
    indica:
      'Que o movimento daquele dia foi validado por muitos participantes. Mas volume alto também aparece por motivos mecânicos: vencimento de opções, rebalanceamento de índice, leilão de fechamento.',
    cenarios: [
      'Como confirmação de padrões de reversão (martelo, engolfo, estrelas) e de rompimentos.',
      'Confira o calendário: vencimento de opções e rebalanceamento de índices geram volume sem opinião sobre o preço.',
    ],
    combinaCom: ['engolfo-alta', 'engolfo-baixa', 'martelo', 'estrela-manha', 'estrela-noite', 'gap'],
    nestePainel: 'Volume maior que 2x a média dos 20 pregões anteriores.',
  },
  {
    id: 'liquidez-baixa',
    termo: 'Liquidez baixa (alerta)',
    fundamento:
      'Poucos negócios no dia. Com pouca gente negociando, um único comprador ou vendedor consegue mover o preço, e o desenho da vela pode refletir uma ordem isolada.',
    indica:
      'Que a vela daquele dia é pouco confiável e que o preço mostrado pode não ser executável na prática — o spread consome o movimento.',
    cenarios: [
      'Desconsidere padrões que se formam em dia de liquidez baixa.',
      'Comum em feriados de outros mercados, véspera de feriado e ativos pouco negociados.',
    ],
    combinaCom: ['doji', 'gap'],
    nestePainel: 'Volume menor que 30% da média dos 20 pregões anteriores.',
  },
];

const POR_ID = new Map(PADROES_DETALHADOS.map((p) => [p.id, p]));

export function padraoDetalhado(id) {
  return POR_ID.get(id);
}
