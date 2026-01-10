export function createLogger(moduleName) {
  const prefix = `[${moduleName}]`
  const isEnabled = import.meta.env.DEV

  return {
    info: (message, data) => isEnabled && console.log(prefix, message, data ?? ''),
    warn: (message, data) => isEnabled && console.warn(prefix, message, data ?? ''),
    error: (message, data) => isEnabled && console.error(prefix, message, data ?? '')
  }
}
