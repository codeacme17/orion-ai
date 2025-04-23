import { useEffect } from 'react'
import { apis } from './apis'
import { Chat } from './components/chat'

function App() {
  const fetchApi = async () => {
    const res = await apis.agent()
    console.log(res)
  }

  useEffect(() => {
    fetchApi()
  }, [])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container">
        <Chat />
      </div>
    </div>
  )
}

export default App
