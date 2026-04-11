type MaybeRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is MaybeRecord => {
  return typeof value === 'object' && value !== null;
};

const asText = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstText = value
      .map(asText)
      .find((item): item is string => !!item && item.length > 0);

    return firstText ?? null;
  }

  return null;
};

const pickMessageFromRecord = (record: MaybeRecord): string | null => {
  const directCandidates = [
    record.message,
    record.mensagem,
    record.error,
    record.detail,
    record.details,
    record.title,
  ];

  for (const candidate of directCandidates) {
    const text = asText(candidate);
    if (text) {
      return text;
    }
  }

  return null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isRecord(error)) {
    const fromTopLevel = pickMessageFromRecord(error);
    if (fromTopLevel) {
      return fromTopLevel;
    }

    const nestedCandidates = [error.body, error.response, error.data];
    for (const candidate of nestedCandidates) {
      if (!isRecord(candidate)) {
        continue;
      }

      const fromNested = pickMessageFromRecord(candidate);
      if (fromNested) {
        return fromNested;
      }

      if (isRecord(candidate.data)) {
        const fromNestedData = pickMessageFromRecord(candidate.data);
        if (fromNestedData) {
          return fromNestedData;
        }
      }
    }
  }

  return fallback;
};
