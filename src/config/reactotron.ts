import Constants from 'expo-constants'

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reactotron = require('reactotron-react-native').default

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants.manifest as { debuggerHost?: string })?.debuggerHost

  const host = debuggerHost?.split(':')[0] ?? 'localhost'

  Reactotron.configure({ name: 'aliz', host }).useReactNative({ log: true }).connect()

  // Intercepte les erreurs JS avant le crash natif
  const originalGlobalHandler = ErrorUtils.getGlobalHandler()
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    Reactotron.error(`${isFatal ? '💥 FATAL' : '❌ ERROR'}: ${error.message}`, error.stack)
    originalGlobalHandler(error, isFatal)
  })

  console.log = (...args: unknown[]) => Reactotron.log(...args)
  console.warn = (...args: unknown[]) => Reactotron.warn(...args)
  console.error = (...args: unknown[]) => Reactotron.error(...args)
}
