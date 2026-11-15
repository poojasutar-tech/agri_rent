import ServiceBooking from "@/components/marketplace/service-booking-page";

export default async function ServiceBookingPage({ searchParams }) {
  const { item } = await searchParams;
  return <ServiceBooking itemName={item} />;
}
