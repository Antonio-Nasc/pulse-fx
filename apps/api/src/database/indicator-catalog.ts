import type { Prisma } from '../generated/prisma/client.js';

export const indicatorCatalog = [
  {
    slug: 'usd-brl-ptax',
    name: 'USD/BRL PTAX venda',
    source: 'BCB',
    externalCode: 'USD',
    frequency: 'DAILY',
    unit: 'BRL/USD',
    description:
      'Referência do valor do dólar em reais. Permite acompanhar a evolução ' +
      'do câmbio e contextualizar custos de compras e operações internacionais.',
    limitationText:
      'A PTAX de fechamento é uma taxa de referência calculada pelo BCB. ' +
      'Não é uma cotação em tempo real nem o preço final cobrado ao consumidor. ' +
      'Dias sem publicação permanecem sem observação, sem interpolação.',
    sourceUrl:
      'https://dadosabertos.bcb.gov.br/dataset/taxas-de-cambio-todos-os-boletins-diarios',
    variationStrategy: 'PREVIOUS_OBSERVATIONS',
    variationPeriods: 5,
    historyMonths: 3,
    ttlMinutes: 360,
  },
  {
    slug: 'selic-target',
    name: 'Meta Selic',
    source: 'BCB',
    externalCode: '432',
    frequency: 'DAILY',
    unit: '% a.a.',
    description:
      'Meta da taxa básica de juros brasileira definida pelo Copom. ' +
      'Ajuda a contextualizar a política monetária e o ambiente de juros no Brasil.',
    limitationText:
      'Representa a meta Selic, não a taxa efetiva de cada operação. ' +
      'O valor pode permanecer constante entre decisões do Copom. ' +
      'A comparação usa o último dado disponível em ou antes de 30 dias atrás.',
    sourceUrl:
      'https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom',
    variationStrategy: 'PREVIOUS_CALENDAR_DAYS',
    variationPeriods: 30,
    historyMonths: 3,
    ttlMinutes: 360,
  },
  {
    slug: 'fed-funds',
    name: 'Federal Funds Effective Rate',
    source: 'FRED',
    externalCode: 'FEDFUNDS',
    frequency: 'MONTHLY',
    unit: '% a.a.',
    description:
      'Taxa efetiva de juros interbancários dos Estados Unidos, em média mensal. ' +
      'Complementa a Selic na leitura do ambiente de juros brasileiro e americano.',
    limitationText:
      'A série mensal é uma média de valores diários, sem ajuste sazonal. ' +
      'Não representa a meta do Federal Reserve nem uma taxa em tempo real. ' +
      'Os dados podem ser revisados; sem o mês anterior, a variação fica indisponível.',
    sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS',
    variationStrategy: 'PREVIOUS_CALENDAR_MONTH',
    variationPeriods: 1,
    historyMonths: 24,
    ttlMinutes: 1440,
  },
] satisfies Prisma.IndicatorCreateInput[];