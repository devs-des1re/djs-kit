import { config } from '../config.js';

type MessageKey = keyof typeof config.messages;
type MessageValue = string | number | boolean | null | undefined;

export function formatMessage(template: string, values: Record<string, MessageValue> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function message(key: MessageKey, values: Record<string, MessageValue> = {}): string {
  return formatMessage(config.messages[key], values);
}
