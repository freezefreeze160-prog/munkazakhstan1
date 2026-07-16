import { Suspense } from "react"
import { UserProfileView } from "@/components/user-profile-view"

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <UserProfileView userId={userId} />
        </Suspense>
      </div>
    </div>
  )
}
