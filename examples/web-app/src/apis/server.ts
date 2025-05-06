export const server = {
  test: async () => {
    const res = await fetch('/api/test')
    const data = await res.json()
    return data
  },

  agent: async () => {
    const res = await fetch('/api/agent')
    const data = await res.json()
    return data
  },
}
