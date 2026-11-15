import RatingReview from "@/components/marketplace/rating-review-page";

export default async function RatingReviewPage({ searchParams }) {
  const { item, total } = await searchParams;
  return <RatingReview itemName={item} totalAmount={total} />;
}
