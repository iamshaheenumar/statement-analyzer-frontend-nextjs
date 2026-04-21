import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ViewSaved from "@/features/viewSaved/ViewSaved";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-elevated rounded-2xl" />
              <div className="h-64 bg-elevated rounded-2xl" />
            </div>
          }
        >
          <ViewSaved id={id} />
        </Suspense>
      </main>
    </div>
  );
}
