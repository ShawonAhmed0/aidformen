import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') redirect('/')

    return (
        <AdminShell
            user={{
                full_name: profile.full_name,
                email: user.email,
                avatar_url: profile.avatar_url,
            }}
        >
            {children}
        </AdminShell>
    )
}
