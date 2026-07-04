const DELIMITER = ':';
const ESCAPE_PLACEHOLDER = '\\:';
function encodeVar(value) {
    return value.replace(/:/g, ESCAPE_PLACEHOLDER);
}
function decodeVar(encoded) {
    return encoded.replace(/\\:/g, DELIMITER);
}
export function buildCustomId(base, params = {}) {
    const parts = [base, ...Object.values(params).map(v => encodeVar(v == null ? '' : String(v)))];
    const result = parts.join(DELIMITER);
    if (process.env.NODE_ENV !== 'production' && result.length > 100) {
        console.warn(`[djskit/customId] Built customId "${result.slice(0, 30)}..." is ${result.length} chars, exceeding Discord's 100-char limit.`);
    }
    return result;
}
export function parseCustomId(raw) {
    const parts = [];
    let current = '';
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] === ':' && raw[i - 1] !== '\\') {
            parts.push(current);
            current = '';
        }
        else {
            current += raw[i];
        }
    }
    parts.push(current);
    const [base, ...rest] = parts;
    return { base, params: rest.map(decodeVar) };
}
