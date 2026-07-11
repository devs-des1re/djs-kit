import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config.js';
const LEGACY_DELIMITER = ':';
const LEGACY_ESCAPE_PLACEHOLDER = '\\:';
const SIGNATURE_LENGTH = 11;
const MAX_CUSTOM_ID_LENGTH = 100;
function encodeBase64Url(value) {
    return Buffer.from(value, 'utf-8').toString('base64url');
}
function decodeBase64Url(value) {
    return Buffer.from(value, 'base64url').toString('utf-8');
}
function sign(value) {
    return createHmac('sha256', config.componentStateSecret)
        .update(value)
        .digest('base64url')
        .slice(0, SIGNATURE_LENGTH);
}
function signaturesMatch(actual, expected) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
function encodeLegacyVar(value) {
    return value.replace(/:/g, LEGACY_ESCAPE_PLACEHOLDER);
}
function decodeLegacyVar(encoded) {
    return encoded.replace(/\\:/g, LEGACY_DELIMITER);
}
function parseLegacyCustomId(raw) {
    const parts = [];
    let current = '';
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] === LEGACY_DELIMITER && raw[i - 1] !== '\\') {
            parts.push(current);
            current = '';
        }
        else {
            current += raw[i];
        }
    }
    parts.push(current);
    const [base, ...rest] = parts;
    return { base, params: rest.map(decodeLegacyVar), valid: true, legacy: true };
}
function warnIfTooLong(customId) {
    if (process.env.NODE_ENV !== 'production' && customId.length > MAX_CUSTOM_ID_LENGTH) {
        console.warn(`[djskit/customId] Built customId "${customId.slice(0, 30)}..." is ${customId.length} chars, exceeding Discord's 100-char limit.`);
    }
}
export function buildCustomId(base, params = {}, options = {}) {
    const payload = {};
    const paramValues = Object.values(params).map(value => value == null ? '' : String(value));
    if (paramValues.length > 0)
        payload.p = paramValues;
    if (options.expiresIn !== undefined)
        payload.e = Math.floor(Date.now() / 1000) + options.expiresIn;
    if (options.userId)
        payload.u = options.userId;
    if (options.guildId)
        payload.g = options.guildId;
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signedValue = `${base}.${encodedPayload}`;
    const result = `${signedValue}.${sign(signedValue)}`;
    warnIfTooLong(result);
    return result;
}
/** Build an old-style unsigned custom ID for migration/testing only. */
export function buildLegacyCustomId(base, params = {}) {
    const result = [base, ...Object.values(params).map(value => encodeLegacyVar(value == null ? '' : String(value)))].join(LEGACY_DELIMITER);
    warnIfTooLong(result);
    return result;
}
export function parseCustomId(raw, context = {}) {
    const parts = raw.split('.');
    if (parts.length !== 3) {
        return parseLegacyCustomId(raw);
    }
    const [base, encodedPayload, actualSignature] = parts;
    const signedValue = `${base}.${encodedPayload}`;
    const expectedSignature = sign(signedValue);
    if (!signaturesMatch(actualSignature, expectedSignature)) {
        return { base, params: [], valid: false, legacy: false, reason: 'Component state signature is invalid.' };
    }
    let payload;
    try {
        payload = JSON.parse(decodeBase64Url(encodedPayload));
    }
    catch {
        return { base, params: [], valid: false, legacy: false, reason: 'Component state payload is invalid.' };
    }
    if (payload.e !== undefined && Math.floor(Date.now() / 1000) > payload.e) {
        return { base, params: payload.p ?? [], valid: false, legacy: false, reason: 'This component has expired.' };
    }
    if (payload.u && context.userId && payload.u !== context.userId) {
        return { base, params: payload.p ?? [], valid: false, legacy: false, reason: 'This component belongs to another user.' };
    }
    if (payload.g && context.guildId && payload.g !== context.guildId) {
        return { base, params: payload.p ?? [], valid: false, legacy: false, reason: 'This component belongs to another server.' };
    }
    return { base, params: payload.p ?? [], valid: true, legacy: false };
}
