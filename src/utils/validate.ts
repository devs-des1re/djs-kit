export function isValidSnowflake(id: string): boolean {
  return /^\d{17,19}$/.test(id.trim());
}

export function isValidNpmName(name: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name) &&
    name.length <= 214 &&
    !name.includes('..');
}

export function isValidPrefix(prefix: string): boolean {
  return prefix.length >= 1 && prefix.length <= 4;
}
