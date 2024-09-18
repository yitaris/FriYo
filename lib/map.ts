import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// Google Places API ile mekan verilerini çekmek için yardımcı fonksiyon
export const fetchPlaces = async (latitude: number, longitude: number, type: string) => {
    const radius = 10000; // 10 km radius
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`
        );
        const data = await response.json();
        return data.results; // Mekan verilerini döndür
    } catch (error) {
        console.error("Error fetching places:", error);
        return [];
    }
};

export const fetchPlacePhoto = async (photoReference: string) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`
        );
        return response.url; // Fotoğraf URL'sini döndür
    } catch (error) {
        console.error("Error fetching place photo:", error);
        return null;
    }
};
// Mekan verilerini işlemek ve haritada göstermek için fonksiyon
export const generateMarkersFromData = ({
    data,
    userLatitude,
    userLongitude,
}: {
    data: any[];
    userLatitude: number;
    userLongitude: number;
}): MarkerData[] => {
    return data.map((place) => {
        return {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            title: place.name,
            id: place.place_id, // Google Places ID
        };
    });
};

// Bölgeyi hesaplama fonksiyonu (değişiklik gerekebilir)
export const calculateRegion = ({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
}: {
    userLatitude: number | null;
    userLongitude: number | null;
    destinationLatitude?: number | null;
    destinationLongitude?: number | null;
}) => {
    if (!userLatitude || !userLongitude) {
        return {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    }

    if (!destinationLatitude || !destinationLongitude) {
        return {
            latitude: userLatitude,
            longitude: userLongitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    }

    const minLat = Math.min(userLatitude, destinationLatitude);
    const maxLat = Math.max(userLatitude, destinationLatitude);
    const minLng = Math.min(userLongitude, destinationLongitude);
    const maxLng = Math.min(userLongitude, destinationLongitude);

    const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
    const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

    const latitude = (userLatitude + destinationLatitude) / 2;
    const longitude = (userLongitude + destinationLongitude) / 2;

    return {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
    };
};

// Şoförlerin sürelerini hesaplamak için fonksiyon (şu anda kullanılmıyor)
export const calculateDriverTimes = async ({
    markers,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
}: {
    markers: MarkerData[];
    userLatitude: number | null;
    userLongitude: number | null;
    destinationLatitude: number | null;
    destinationLongitude: number | null;
}) => {
    if (!userLatitude || !userLongitude || !destinationLatitude || !destinationLongitude) return;

    try {
        const timesPromises = markers.map(async (marker) => {
            const responseToUser = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`
            );
            const dataToUser = await responseToUser.json();
            const timeToUser = dataToUser.routes[0].legs[0].duration.value; // Time in seconds

            const responseToDestination = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`
            );
            const dataToDestination = await responseToDestination.json();
            const timeToDestination = dataToDestination.routes[0].legs[0].duration.value; // Time in seconds

            const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
            const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

            return { ...marker, time: totalTime, price };
        });

        return await Promise.all(timesPromises);
    } catch (error) {
        console.error("Error calculating driver times:", error);
    }
};
