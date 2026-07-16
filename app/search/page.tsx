import { Suspense } from "react"
import { SearchUsers } from "@/components/search-users"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SearchUsers />
        </Suspense>
      </div>
    </div>
  )
}
