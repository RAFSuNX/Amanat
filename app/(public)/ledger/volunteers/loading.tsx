import { PublicNav } from "@/components/public-nav"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav donateButton />
      <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-64 mb-2" />
        <Skeleton className="h-3 w-48 mb-8" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
