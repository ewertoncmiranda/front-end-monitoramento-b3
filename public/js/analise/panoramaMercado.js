// Unica responsabilidade: funcoes puras (sem DOM) para o card de setores x
// empresas do carrossel de mercado (MERC-PAI-2). Testavel diretamente com node.

/** Texto legivel do selo de coesao do setor (JUNTO | MISTO | DISPERSO). */
export function textoSelo(selo) {
  if (selo === 'JUNTO') return 'andou junto';
  if (selo === 'DISPERSO') return 'disperso';
  return 'misto';
}

/**
 * Valor maximo absoluto entre os itens para normalizar a barra; retorna 1 se
 * a lista for vazia ou todos os valores forem zero (evita divisao por zero).
 */
export function escalaBarras(itens, fnValor) {
  if (!itens || !itens.length) return 1;
  const max = itens.reduce((m, item) => Math.max(m, Math.abs(fnValor(item) ?? 0)), 0);
  return max || 1;
}

/** true se nomeBloco esta em indisponivel (array). */
export function estadoVazioBloco(indisponivel, nomeBloco) {
  return Array.isArray(indisponivel) && indisponivel.includes(nomeBloco);
}

/**
 * Ordena setores por variacaoMediana decrescente.
 * "Outros" sempre por ultimo, independente do valor.
 * Nao reordena dentro de melhores/piores (essas listas chegam prontas do gestor).
 */
export function setoresOrdenados(setores) {
  if (!Array.isArray(setores) || !setores.length) return [];
  const outros = setores.filter((s) => s.nome === 'Outros');
  const resto = setores.filter((s) => s.nome !== 'Outros');
  resto.sort((a, b) => (b.variacaoMediana ?? 0) - (a.variacaoMediana ?? 0));
  return [...resto, ...outros];
}

/**
 * Formata desvio (racio, ex.: 0.0123) como '+1,23 pp' ou '-0,45 pp'.
 * O sufixo "pp" indica pontos percentuais.
 */
export function formatarDesvio(desvio) {
  if (desvio === null || desvio === undefined) return '+0,00 pp';
  const v = Number(desvio) * 100;
  const sinal = v >= 0 ? '+' : '';
  return `${sinal}${v.toFixed(2).replace('.', ',')} pp`;
}

/**
 * Formata variacaoMediana (racio) como percentual com sinal: '+2,30%'.
 */
export function formatarVariacaoSetor(v) {
  if (v === null || v === undefined) return '+0,00%';
  const num = Number(v) * 100;
  const sinal = num >= 0 ? '+' : '';
  return `${sinal}${num.toFixed(2).replace('.', ',')}%`;
}

/** Adapta o DTO real do gestor, mantendo compatibilidade com o formato antigo. */
export function normalizarSetor(setor) {
  return { ...setor, nome: setor.setor || setor.nome || 'Setor não informado',
    quantidade: setor.empresas ?? setor.universo?.liquidos ?? null };
}

export function explicacaoSelo(setor) {
  const percentual = Number.isFinite(setor.coesao) ? `${(setor.coesao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% das ações desta amostra seguiram a direção da mediana. ` : '';
  const regra = { JUNTO: 'Andou junto: pelo menos 70% seguiram a mesma direção do resumo do setor (alta, queda ou estabilidade).', MISTO: 'Misto: de 50% a menos de 70% seguiram a direção do resumo do setor; as demais tiveram outra direção.', DISPERSO: 'Disperso: menos de 50% seguiram a direção do resumo do setor.' }[setor.selo];
  return `${percentual}${regra || 'Sem classificação de direção disponível.'} Não significa que variaram o mesmo tanto. Um setor pode cair e ainda assim ter o selo “andou junto”.`;
}

const ATIVIDADES = {
  'Telecomunicações': 'Telefonia, conexão à internet e outros serviços de telecomunicação.',
  'Petróleo e Gás': 'Atividades ligadas à produção, exploração ou serviços de petróleo e gás.',
  'Educação': 'Empresas de ensino e serviços educacionais.',
  'Máquinas, Equipamentos, Veículos e Peças': 'Fabricantes e fornecedores de máquinas, veículos, equipamentos e componentes.',
  'Serviços médicos': 'Prestadores de atendimento médico, hospitais, diagnósticos e serviços de saúde.',
  'Têxtil e Vestuário': 'Produção e comercialização de tecidos, roupas, calçados e produtos relacionados.',
  'Agricultura (Açúcar, Álcool e Cana)': 'Atividades agrícolas e cadeias de açúcar, etanol e cana.',
  'Farmacêutico e Higiene': 'Medicamentos, produtos de higiene e atividades relacionadas.',
  'Comércio (Atacado e Varejo)': 'Venda de mercadorias para outras empresas ou para o consumidor final.',
  'Energia Elétrica': 'Geração, transmissão, distribuição ou comercialização de energia elétrica.',
  'Seguradoras e Corretoras': 'Seguros, intermediação e serviços relacionados.',
  'Comunicação e Informática': 'Tecnologia, informática e comunicação, conforme a classificação cadastral.',
  'Alimentos': 'Produção e processamento de alimentos.',
  'Bancos': 'Instituições que oferecem crédito, contas e outros serviços financeiros.',
  'Saneamento, Serv. Água e Gás': 'Serviços de água, saneamento e distribuição de gás.',
  'Metalurgia e Siderurgia': 'Produção e transformação de metais, como aço e ferro.',
  'Serviços Transporte e Logística': 'Transporte de pessoas ou cargas, armazenagem e organização de entregas.',
  'Construção Civil, Mat. Constr. e Decoração': 'Construção e atividades ligadas a materiais e decoração.',
  'Emp. Adm. Part. - Const. Civil, Mat. Const. e Decoração': 'Empresas que administram participações em negócios ligados à construção e ao setor imobiliário.',
};
export function explicacaoSetor(nome) {
  if (nome === 'Outros') return 'Reúne classificações sem setor definido ou com poucas ações elegíveis para formar um grupo próprio. Não representa um único ramo de atividade; a comparação deve ser feita com mais cuidado.';
  return `${ATIVIDADES[nome] || `Grupo cadastral “${nome}”: reúne empresas classificadas nesse ramo de atividade.`} A amostra inclui apenas ações com dados e negociação suficientes para o panorama, e não todas as empresas desse mercado. Empresas de um mesmo setor podem ter negócios diferentes.`;
}
