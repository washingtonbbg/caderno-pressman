// Preencher com a oferta e o checkout próprios do vendedor.
// Uma URL de checkout não representa autorização de acesso aos cadernos.
export const commercialOffer = {
  name: 'Cadernos de Estudo',
  summary: 'Cadernos interativos para prática de questões e revisão.',
  checkoutUrl: '',
  priceLabel: '',
  supportEmail: '',
  deliveryDescription: '',
};

export const semaOffer = {
  name: 'SEMA-MT · Analista em TI',
  summary: 'Banco de questões, cronograma e revisão para organizar sua preparação.',
  checkoutUrl: '',
  priceLabel: '',
  supportEmail: '',
  deliveryDescription: '',
};

export function checkoutUrl(offer = commercialOffer): string | null {
  if (!offer.deliveryDescription.trim()) return null;
  try {
    const url = new URL(offer.checkoutUrl);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
