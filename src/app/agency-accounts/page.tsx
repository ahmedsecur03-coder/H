import { redirect } from 'next/navigation';

export default function OldAgencyAccountsPage() {
    // This page is now obsolete.
    // The new interactive page is in the dashboard.
    redirect('/dashboard/agency-accounts');
}

    