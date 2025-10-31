import { Suspense } from "react";
import ViewSaved from "@/features/viewSaved/ViewSaved";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<{ id?: string }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-xl font-semibold text-red-600">Error</h1>
            <p className="mt-2 text-gray-600">Statement ID is required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="animate-pulse bg-white rounded-lg shadow p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          }
        >
          <ViewSaved id={id} />
        </Suspense>
      </div>
    </main>
  );
}
