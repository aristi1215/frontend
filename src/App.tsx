import { useState } from 'react'
import type { FormEvent } from 'react'

interface LambdaResponse {
  access_token?: string
  error?: string
}

const App: React.FC = () => {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('Submitting...')

    try {
      const res = await fetch(
        'https://qiuwkcdanbkczhbqjsynn66ssi0wujpn.lambda-url.us-east-1.on.aws',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        }
      )

      const data: LambdaResponse = await res.json()

      if (res.ok && data.access_token) {
        // Save email in localStorage
        localStorage.setItem('userEmail', email)
        localStorage.setItem('access_token', data.access_token || "")

        setStatus(`User created successfully! Access token: ${data.access_token}`)

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/test'
        }, 1000)
      } else {
        setStatus(`Error: ${data.error ?? 'Unknown error'}`)
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        <label className="block mb-4">
          <span className="text-gray-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </label>

        <label className="block mb-6">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </button>

        {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
      </form>
    </div>
  )
}

export default App
