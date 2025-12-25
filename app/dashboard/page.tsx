import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your account
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value="1,234"
            change="+12%"
            changeType="positive"
          />
          <StatCard
            title="Active Projects"
            value="56"
            change="+5%"
            changeType="positive"
          />
          <StatCard
            title="Revenue"
            value="$12,345"
            change="-3%"
            changeType="negative"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem
                title="New user signed up"
                time="2 hours ago"
              />
              <ActivityItem
                title="Project created"
                time="5 hours ago"
              />
              <ActivityItem
                title="Payment received"
                time="1 day ago"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Create New Project
              </button>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Invite Team Member
              </button>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  changeType
}: {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className={`text-sm mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
        {change} from last month
      </p>
    </div>
  )
}

function ActivityItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <p className="text-gray-900">{title}</p>
      <p className="text-gray-500 text-sm">{time}</p>
    </div>
  )
}
