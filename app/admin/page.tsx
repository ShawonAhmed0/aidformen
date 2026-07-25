import {
    Users,
    HeartHandshake,
    FileText,
    MessagesSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Replace with your real queries
    const stats = [
        { title: 'Total Users', value: '2,847', change: 12, icon: <Users className="h-4.5 w-4.5" /> },
        { title: 'Total Donations', value: '৳ 4.2L', change: 18, icon: <HeartHandshake className="h-4.5 w-4.5" /> },
        { title: 'Blog Articles', value: '128', change: 5, icon: <FileText className="h-4.5 w-4.5" /> },
        { title: 'Forum Posts', value: '956', change: -2, icon: <MessagesSquare className="h-4.5 w-4.5" /> },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
                    Dashboard Overview
                </h1>
                <p className="mt-1 text-[13.5px] text-slate-500">
                    Key metrics and recent activity of your organization
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, i) => (
                    <StatsCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        delay={i * 0.05}
                    />
                ))}
            </div>

            {/* Charts + Activity */}
            <div className="grid gap-5 lg:grid-cols-5">
                {/* Donation Chart */}
                <div className="lg:col-span-3 rounded-xl border border-slate-200/80 bg-white p-5">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-slate-900">Donation Growth</h2>
                        <select className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-600">
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                    </div>
                    <div className="flex h-56 items-end justify-between gap-1.5">
                        {[42, 58, 51, 73, 64, 89, 71, 82, 68, 94, 78, 86].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-t-md bg-gradient-to-t from-teal-700 to-teal-400 opacity-80 hover:opacity-100 transition-opacity"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5">
                    <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Recent Activity</h2>
                    <div className="space-y-5">
                        {[
                            { title: 'New donation received', desc: '৳ 5,000 from Rahim Ahmed', time: '2h ago' },
                            { title: 'New user registered', desc: 'Fatima Begum joined', time: '4h ago' },
                            { title: 'Blog published', desc: '“Mental Health Awareness”', time: '1d ago' },
                            { title: 'Forum post reported', desc: 'Needs moderation', time: '2d ago' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                                <div>
                                    <p className="text-[13.5px] font-medium text-slate-900">{item.title}</p>
                                    <p className="text-[12.5px] text-slate-500">{item.desc}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Users + Recent Posts tables can go here later */}
        </div>
    )
}