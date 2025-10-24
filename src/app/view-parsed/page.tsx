import ViewParsed from "@/features/viewParsed/ViewParsed";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ViewParsedPage(props: PageProps) {
  const { id } = await props.searchParams;
  return <ViewParsed id={id} />;
}

