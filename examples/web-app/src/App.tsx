import './App.css'
import { Chat } from './components/Chat'

function App() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
        <Chat />
      </div>
    </div>
  )
}

export default App
