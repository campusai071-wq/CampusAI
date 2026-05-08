const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export const getReverseGeocoding = async (lat: number, lng: number): Promise<string> => {
  if (!MAPTILER_API_KEY) {
    console.error("MapTiler API Key missing");
    return "Location details unavailable.";
  }
  
  try {
    const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return "Location details unavailable.";
  } catch (error) {
    console.error("MapTiler Geocoding error:", error);
    return "Location details unavailable.";
  }
};

export const searchPlaces = async (query: string, lat: number, lng: number): Promise<any[]> => {
  if (!MAPTILER_API_KEY) {
    console.error("MapTiler API Key missing");
    return [];
  }
  
  try {
    // Add country=ng to restrict results to Nigeria and improve relevance
    const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}&proximity=${lng},${lat}&country=ng`);
    const data = await response.json();
    
    if (data.features) {
      // Filter results to ensure they are relevant to Nigeria
      return data.features
        .filter((f: any) => f.context?.some((c: any) => c.id.startsWith('country.') && c.short_code === 'ng'))
        .map((f: any) => ({
          title: f.place_name,
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.place_name)}`
        }));
    }
    return [];
  } catch (error) {
    console.error("MapTiler Search error:", error);
    return [];
  }
};
