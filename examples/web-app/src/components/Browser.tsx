import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BrowserProps {
  url: string
  onClose: () => void
}

export const Browser = ({ url, onClose }: BrowserProps) => {
  const [currentUrl, setCurrentUrl] = useState(url)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentUrl(url)
    setError(null)
  }, [url])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(e.target.value)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
      setCurrentUrl(`https://${currentUrl}`)
    }
  }

  const handleIframeError = () => {
    setError('can not load page, please check the url')
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Button>
        <form onSubmit={handleSubmit} className="flex-1">
          <Input
            value={currentUrl}
            onChange={handleUrlChange}
            placeholder="Enter URL"
            className="w-full"
          />
        </form>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(currentUrl, '_blank')}
          title="Open in new tab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Button>
      </div>
      <div className="flex-1 relative">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <iframe
            src={currentUrl}
            className="w-full h-full"
            onLoad={() => setIsLoading(false)}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Browser"
          />
        )}
      </div>
    </div>
  )
}
