// Reject a promise if it doesn't settle within `ms`. Used to make sure page
// data loads never hang forever (e.g. on a stale auth session after idle).
export function withTimeout<T>(p: PromiseLike<T>, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms)
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}
