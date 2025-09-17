export const toUrl = (urlOrDomain: string): URL => {
  if (!urlOrDomain) throw new Error('urlOrDomain must not be empty')
  return urlOrDomain.startsWith('http')
    ? new URL(urlOrDomain)
    : new URL(`http://${urlOrDomain}`)
}
export default { toUrl }
