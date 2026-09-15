export type MemoryLocus = {
  questionId: string;
  position: number;
  locus: string;
  scene: string;
  recallCue: string;
  retrieval: string;
  imageUrl?: string;
};

export const MEMORY_PALACE_LOCI = [
  'Portão de entrada',
  'Capacho da porta',
  'Hall de entrada',
  'Sofá da sala',
  'Mesa de jantar',
  'Pia da cozinha',
  'Geladeira',
  'Corredor',
  'Espelho do banheiro',
  'Cama do quarto',
  'Guarda-roupa',
  'Escrivaninha',
  'Janela',
  'Varanda',
  'Jardim',
  'Garagem',
  'Portão dos fundos',
  'Calçada',
  'Árvore da esquina',
  'Banco da praça',
] as const;

export function locusFor(position: number) {
  const lap = Math.floor(position / MEMORY_PALACE_LOCI.length) + 1;
  const base = MEMORY_PALACE_LOCI[position % MEMORY_PALACE_LOCI.length];
  return lap === 1 ? base : `${base} · percurso ${lap}`;
}
