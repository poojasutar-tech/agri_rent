import Payment from "@/components/marketplace/payment-page";

export default async function PaymentPage({ searchParams }) {
  const { item, total } = await searchParams;
  return <Payment itemName={item} totalAmount={total} />;
}
