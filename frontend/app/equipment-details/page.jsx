import EquipmentDetails from "@/components/marketplace/equipment-details-page";

export default async function EquipmentDetailsPage({ searchParams }) {
  const { item } = await searchParams;
  return <EquipmentDetails itemName={item} />;
}
