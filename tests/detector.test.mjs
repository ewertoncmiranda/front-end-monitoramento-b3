// Testes do detector de padroes. Roda com `npm test` (node puro, sem
// framework - o repo nao tem bundler nem test runner, e nao vale adicionar
// um por causa de um arquivo).
//
// Faz duas coisas:
//
// 1. Casos construidos a mao: o detector acha o que deve achar e rejeita o
//    que nao deve. Inclui o par martelo/enforcado, que tem geometria
//    IDENTICA e so se distingue pelo contexto anterior.
//
// 2. Calibragem no ruido: roda o mesmo detector sobre 20 passeios
//    aleatorios de 63 candles (o tamanho da maior janela do painel) e
//    reporta quantas vezes cada padrao dispara. Os numeros daqui alimentam
//    o campo `ruidoPorJanela` de cada padrao e sao exibidos na interface.
//
//    O resultado mais util deste arquivo: em ruido puro a estrela da manha
//    exibe +12 pontos de "vantagem" sobre a taxa-base. Serve de lembrete de
//    que vantagem medida em amostra pequena e ruido com cara de estatistica.

import { PADROES, ALERTAS, detectar } from '../public/js/analise/detectorPadroes.js';
import { avaliar, taxaBase } from '../public/js/analise/taxaAcerto.js';

// --- casos construidos a mao: o detector acha o que deve achar? ---
function vela(o,h,l,c,v=1000,dia=1){return{open:o,high:h,low:l,close:c,volume:v,dataIso:`2026-01-${String(dia).padStart(2,'0')}`};}
const p = id => PADROES.find(x=>x.id===id) || ALERTAS.find(x=>x.id===id);

let falhas = 0;
function checa(nome, real, esperado){
  const ok = real === esperado;
  if(!ok){ falhas++; console.log(`  FALHOU ${nome}: esperado ${esperado}, veio ${real}`); }
  else console.log(`  ok  ${nome}`);
}

// doji: corpo minusculo
checa('doji detecta', p('doji').detectar([vela(10,11,9,10.02)],0), true);
checa('doji rejeita corpo grande', p('doji').detectar([vela(10,11,9,10.9)],0), false);

// martelo precisa de queda anterior
const queda = [vela(12,12,11.8,11.9,1000,1),vela(11.9,12,11.5,11.6,1000,2),vela(11.6,11.7,11.2,11.3,1000,3),vela(11.3,11.4,11,11.1,1000,4),vela(11.1,11.2,10.8,10.9,1000,5)];
const martelo = vela(10.9,11.0,10.0,10.95,1000,6);
checa('martelo apos queda', p('martelo').detectar([...queda, martelo],5), true);
const alta = [vela(10,10.2,9.9,10.1,1000,1),vela(10.1,10.5,10,10.4,1000,2),vela(10.4,10.8,10.3,10.7,1000,3),vela(10.7,11,10.6,11,1000,4),vela(11,11.3,10.9,11.2,1000,5)];
checa('mesma forma apos alta NAO e martelo', p('martelo').detectar([...alta, vela(11.2,11.3,10.3,11.25,1000,6)],5), false);
checa('mesma forma apos alta E enforcado', p('enforcado').detectar([...alta, vela(11.2,11.3,10.3,11.25,1000,6)],5), true);

// engolfo
checa('engolfo de alta', p('engolfo-alta').detectar([vela(10,10.1,9.4,9.5),vela(9.4,10.6,9.3,10.5)],1), true);
checa('engolfo de alta rejeita corpo menor', p('engolfo-alta').detectar([vela(10,10.1,9.4,9.5),vela(9.6,9.9,9.5,9.8)],1), false);

// gap
checa('gap > 2%', p('gap').detectar([vela(10,10,10,10),vela(10.5,10.6,10.4,10.5)],1), true);
checa('gap pequeno nao dispara', p('gap').detectar([vela(10,10,10,10),vela(10.1,10.2,10,10.1)],1), false);

// --- taxa-base e coerente? ---
const subindo = Array.from({length:30},(_,i)=>vela(10+i*0.1,10+i*0.1,10+i*0.1,10+i*0.1,1000,(i%28)+1));
checa('serie so subindo tem taxa-base de alta 100%', taxaBase(subindo,'alta',3), 100);

// --- QUANTO OS DETECTORES DISPARAM EM RUIDO PURO? ---
// E o teste que importa: se um padrao aparece o tempo todo num passeio
// aleatorio, encontra-lo num grafico real nao significa nada.
function ruido(n, seed){
  let x = seed, preco = 50, out = [];
  const rnd = () => { x = (x*1103515245+12345) & 0x7fffffff; return x/0x7fffffff; };
  for(let i=0;i<n;i++){
    const o = preco;
    const ret = (rnd()-0.5)*0.04;
    const c = o*(1+ret);
    const h = Math.max(o,c)*(1+rnd()*0.01);
    const l = Math.min(o,c)*(1-rnd()*0.01);
    out.push(vela(o,h,l,c, Math.round(1000*(0.5+rnd())), (i%28)+1));
    preco = c;
  }
  return out;
}

console.log('\n--- frequencia em 20 series aleatorias de 63 candles (o tamanho real da janela) ---');
console.log('padrao                    ocorrencias/serie   vantagem media sobre a base');
for(const def of PADROES){
  let total=0, vantagens=[];
  for(let s=1;s<=20;s++){
    const serie = ruido(63, s*7919);
    const ocor = detectar(serie, def);
    total += ocor.length;
    if(def.direcao!=='neutro'){
      const r = avaliar(serie, ocor, def.direcao, 3);
      if(r.vantagem!==null && r.julgaveis>=5) vantagens.push(r.vantagem);
    }
  }
  const media = (total/20).toFixed(1);
  const vm = vantagens.length ? (vantagens.reduce((a,b)=>a+b,0)/vantagens.length).toFixed(1)+' pts' : 'amostra insuf.';
  console.log(`${def.nome.padEnd(26)}${media.padStart(8)}${String(vm).padStart(28)}`);
}

console.log(falhas===0 ? '\nTODOS os casos construidos passaram' : `\n${falhas} FALHA(S)`);
process.exit(falhas===0?0:1);
