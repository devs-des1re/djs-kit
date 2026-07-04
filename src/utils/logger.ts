import pc from 'picocolors';

export const log = {
  success: (msg: string) => console.log(pc.green(msg)),
  warn: (msg: string) => console.log(pc.yellow(msg)),
  error: (msg: string) => console.error(pc.red(msg)),
  info: (msg: string) => console.log(pc.cyan(msg)),
  step: (msg: string) => console.log(pc.dim('→ ') + msg),
};
