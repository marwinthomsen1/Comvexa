import { PublicBookingForm } from "./public-booking-form";

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicBookingForm slug={slug} />;
}
