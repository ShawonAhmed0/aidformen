import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

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
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminSidebar />
            <div className="flex min-h-screen flex-col">
                <AdminHeader
                    user={{
                        full_name: profile.full_name,
                        email: user.email,
                        avatar_url: profile.avatar_url,
                    }}
                />
                <main className="flex-1 p-6 ml-[260px]">
                    {children}
                </main>
            </div>
        </div>
    )
}