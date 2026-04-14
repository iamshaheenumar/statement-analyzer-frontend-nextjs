import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ViewSaved from "@/features/viewSaved/ViewSaved";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<{ id?: string }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const { id } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!id ? (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Missing ID</p>
              <p className="text-xs text-red-600 mt-0.5">Statement ID is required</p>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-200 rounded-2xl" />
                <div className="h-64 bg-slate-200 rounded-2xl" />
              </div>
            }
          >
            <ViewSaved id={id} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
