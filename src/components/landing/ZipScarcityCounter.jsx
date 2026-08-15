export default function ZipScarcityCounter({ territoryAvailability }) {
  if (!territoryAvailability) return null;

  const { available_zips } = territoryAvailability;
  if (available_zips <= 0) return null;

  return (
    <p className="text-amber-400 text-sm font-semibold text-center mb-4">
      Territory spots available in this county
    </p>
  );
}
