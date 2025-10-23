import Dashboard from "@/features/dashboard/Dashboard";

type PageProps = {
  searchParams: Promise<{ id: string }>;
};

export default async function DashboardPage(props: PageProps) {
  const { id } = await props.searchParams;
  return <Dashboard id={id} />;
}
