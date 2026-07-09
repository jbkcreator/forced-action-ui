export default function ZipScarcityCounter({ territoryAvailability }) {
  if (!territoryAvailability) return null;

  const { total_zips, available_zips } = territoryAvailability;

  return (
    <p className="text-amber-400 text-sm font-semibold text-center mb-4">
      {available_zips} of {total_zips} ZIPs still open in this county
    </p>
  );
}
