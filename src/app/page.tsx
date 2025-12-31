import { redirect } from 'next/navigation'

// This is now the main entry point.
// We will redirect to the (client) route group which handles the public homepage.
export default function Home() {
  redirect('/(client)')
}
