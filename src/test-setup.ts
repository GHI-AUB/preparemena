// @react-pdf/renderer accesses process.config at module load time.
// Node 22 removed process.config — patch it before any test imports run.
if (process.config === undefined) {
  Object.defineProperty(process, 'config', { value: { variables: {} }, writable: true })
}
