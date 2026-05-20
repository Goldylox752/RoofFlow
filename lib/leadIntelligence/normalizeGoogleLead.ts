export function normalizeGoogleLead(place, keyword, location) {
  return {
    name: place?.name || null,
    address: place?.formatted_address || null,
    phone: place?.formatted_phone_number || null,

    rating: place?.rating || 0,
    reviews: place?.user_ratings_total || 0,
    place_id: place?.place_id || null,

    keyword: keyword || null,
    location: location || null,

    source: "google",
    created_at: new Date().toISOString(),
  };
}