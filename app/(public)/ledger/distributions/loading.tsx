import { PublicNav } from "@/components/public-nav"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav donateButton />
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
