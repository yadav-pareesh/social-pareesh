/**
 * Universal safe environment variables reader across Vite and Jest
 */
export const getEnvVar = (key: string, defaultValue = ''): string => {
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    const procEnv = globalObj?.process?.env;
    if (procEnv && procEnv[key]) {
      return procEnv[key];
    }

    const metaEnv = new Function(
      'try { return import.meta.env; } catch (e) { return undefined; }'
    )();
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch {
    // Fallback
  }
  return defaultValue;
};
