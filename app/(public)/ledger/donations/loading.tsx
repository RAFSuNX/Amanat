import { PublicNav } from "@/components/public-nav"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav donateButton />
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border rounded-lg overflow-hidden border mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card px-5 py-4 flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </main>
    </div>
  )
}
