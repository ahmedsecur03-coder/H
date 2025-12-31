import { redirect } from 'next/navigation'

export default function AboutRedirect() {
  redirect('/(public)/about')
}
