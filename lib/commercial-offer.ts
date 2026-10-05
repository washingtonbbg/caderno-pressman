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

export function checkoutUrl(): string | null {
  if (!commercialOffer.deliveryDescription.trim()) return null;
  try {
    const url = new URL(commercialOffer.checkoutUrl);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
