export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    // Callback OAuth Strava — intercepté par WebBrowser.openAuthSessionAsync,
    // ne doit jamais être traité comme une route par expo-router (sinon "Unmatched Route")
    if (path.includes('strava-callback')) {
      return '/'
    }
    return path
  } catch {
    return '/'
  }
}
