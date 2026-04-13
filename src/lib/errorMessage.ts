type MaybeRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is MaybeRecord => {
  return typeof value === 'object' && value !== null;
};

const isEnglishFallback = (fallback: string): boolean => {
  return /\b(could|please|invalid|check|account|category|card|profile|save|remove|again)\b/i.test(fallback);
};

const isTechnicalMessage = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  return normalized.startsWith('generic error:')
    || normalized.includes('status text:')
    || normalized.includes('body: {')
    || normalized.includes('body: [');
};

const getFriendlyRateLimitMessage = (fallback: string): string => {
  if (isEnglishFallback(fallback)) {
    return 'Too many requests in a short time. Please wait about 1 minute and try again.';
  }

  return 'Voce fez muitas tentativas em pouco tempo. Aguarde cerca de 1 minuto e tente novamente.';
};

const getFriendlyMethodNotAllowedMessage = (fallback: string): string => {
  if (isEnglishFallback(fallback)) {
    return 'This action is temporarily unavailable. Please try again in a moment.';
  }

  return 'Esta acao esta temporariamente indisponivel. Tente novamente em instantes.';
};

const asText = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (isRecord(parsed)) {
          const parsedMessage = pickMessageFromRecord(parsed);
          if (parsedMessage) {
            return parsedMessage;
          }
        }
      } catch (parseError) {
        void parseError;
      }
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    const firstText = value
      .map(asText)
      .find((item): item is string => !!item && item.length > 0);

    return firstText ?? null;
  }

  return null;
};

const pickValidationDetail = (record: MaybeRecord): string | null => {
  const code = asText(record.code)?.toUpperCase();
  if (code !== 'VALIDATION_ERROR') {
    return null;
  }

  const detailCandidates = [record.detalhes, record.details, record.detail];
  for (const candidate of detailCandidates) {
    const text = asText(candidate);
    if (text && !isTechnicalMessage(text)) {
      return text;
    }
  }

  return null;
};

const pickMessageFromRecord = (record: MaybeRecord): string | null => {
  const validationDetail = pickValidationDetail(record);
  if (validationDetail) {
    return validationDetail;
  }

  const directCandidates = [
    record.message,
    record.mensagem,
    record.erro,
    record.error,
    record.detalhes,
    record.detail,
    record.details,
    record.title,
  ];

  for (const candidate of directCandidates) {
    const text = asText(candidate);
    if (text && !isTechnicalMessage(text)) {
      return text;
    }
  }

  return null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  let statusCode: number | null = null;

  if (isRecord(error)) {
    if (typeof error.status === 'number') {
      statusCode = error.status;
    }

    const fromTopLevel = pickMessageFromRecord(error);
    if (fromTopLevel) {
      if (statusCode === 429) {
        return getFriendlyRateLimitMessage(fallback);
      }
      return fromTopLevel;
    }

    const nestedCandidates = [error.body, error.response, error.data];
    for (const candidate of nestedCandidates) {
      if (!isRecord(candidate)) {
        continue;
      }

      const fromNested = pickMessageFromRecord(candidate);
      if (fromNested) {
        if (statusCode === 429) {
          return getFriendlyRateLimitMessage(fallback);
        }
        return fromNested;
      }

      if (isRecord(candidate.data)) {
        const fromNestedData = pickMessageFromRecord(candidate.data);
        if (fromNestedData) {
          if (statusCode === 429) {
            return getFriendlyRateLimitMessage(fallback);
          }
          return fromNestedData;
        }
      }
    }
  }

  if (statusCode === 429) {
    return getFriendlyRateLimitMessage(fallback);
  }

  if (statusCode === 405) {
    return getFriendlyMethodNotAllowedMessage(fallback);
  }

  return fallback;
};
