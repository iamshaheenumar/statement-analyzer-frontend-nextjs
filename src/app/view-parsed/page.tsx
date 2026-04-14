import Navbar from "@/components/Navbar";
import ViewParsed from "@/features/viewParsed/ViewParsed";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ViewParsedPage(props: PageProps) {
  const { id } = await props.searchParams;
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <ViewParsed id={id} />
    </div>
  );
}
