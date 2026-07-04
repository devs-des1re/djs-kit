const DELIMITER = ':';
const ESCAPE_PLACEHOLDER = '\\:';

function encodeVar(value: string): string {
  return value.replace(/:/g, ESCAPE_PLACEHOLDER);
}

function decodeVar(encoded: string): string {
  return encoded.replace(/\\:/g, DELIMITER);
}

export type CustomIdVarValue = string | number | boolean | null | undefined;

export function buildCustomId(
  base: string,
  params: Record<string, CustomIdVarValue> = {}
): string {
  const parts = [base, ...Object.values(params).map(v => encodeVar(v == null ? '' : String(v)))];
  const result = parts.join(DELIMITER);

  if (process.env.NODE_ENV !== 'production' && result.length > 100) {
    console.warn(
      `[djskit/customId] Built customId "${result.slice(0, 30)}..." is ${result.length} chars, exceeding Discord's 100-char limit.`
    );
  }

  return result;
}

export function parseCustomId(raw: string): { base: string; params: string[] } {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === ':' && raw[i - 1] !== '\\') {
      parts.push(current);
      current = '';
    } else {
      current += raw[i];
    }
  }
  parts.push(current);

  const [base, ...rest] = parts;
  return { base, params: rest.map(decodeVar) };
}
