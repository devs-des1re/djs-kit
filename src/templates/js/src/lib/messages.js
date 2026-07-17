import { config } from '../config.js';
export function formatMessage(template, values = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}
export function message(key, values = {}) {
    return formatMessage(config.messages[key], values);
}
