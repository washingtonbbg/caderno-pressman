// A narrow regression guard against the old generator, not an automated judge
// of conceptual correctness. Substantive review still requires source checking.
export function isGenericExplanation(value) {
  return /O gabarito do caderno indica|distrator por troca de núcleo|é compatível com o recorte geral|a combinação diverge do gabarito|mantém o formato da sequência, mas troca|amplia ou restringe a afirmação sem apoio no recorte|Ela atende ao comando porque o critério desta questão|Padrão identificado pela revisão:/i.test(String(value || ''));
}
