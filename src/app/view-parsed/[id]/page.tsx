import Navbar from "@/components/Navbar";
import ViewParsed from "@/features/viewParsed/ViewParsed";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ViewParsedPage(props: PageProps) {
  const { id } = await props.params;
  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <ViewParsed id={id} />
    </div>
  );
}
