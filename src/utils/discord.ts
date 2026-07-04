import { REST, Routes } from 'discord.js';

export type TokenValidationResult =
  | { valid: true; username: string }
  | { valid: false; error: string };

export async function validateToken(
  token: string
): Promise<TokenValidationResult> {
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    const user = await rest.get(Routes.user()) as {
      username: string;
      discriminator: string;
      id: string;
    };
    const tag =
      user.discriminator === '0'
        ? user.username
        : `${user.username}#${user.discriminator}`;
    return { valid: true, username: tag };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('401') || message.includes('Unauthorized')) {
      return { valid: false, error: 'Invalid token (401 Unauthorized)' };
    }
    return { valid: false, error: message };
  }
}
