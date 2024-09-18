import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { calculateDriverTimes, calculateRegion, generateMarkersFromData, fetchPlaces } from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const Map = () => {
    // Şoför verilerini al
    const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");

    // Kullanıcının ve hedefin koordinatları
    const { 
        userLongitude, 
        userLatitude, 
        destinationLongitude, 
        destinationLatitude, 
    } = useLocationStore();

    // Sürücü ve marker verilerini tutacak state'ler
    const { selectedDriver, setDrivers } = useDriverStore();
    const [restaurantMarkers, setRestaurantMarkers] = useState<MarkerData[]>([]);
    const [hotelMarkers, setHotelMarkers] = useState<MarkerData[]>([]);
    const [shoppingMallMarkers, setShoppingMallMarkers] = useState<MarkerData[]>([]);
    const [storeMarkers, setStoreMarkers] = useState<MarkerData[]>([]);

    // Bölgeyi hesapla (kullanıcı ve destinasyon arası)
    const region = calculateRegion({
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
    });

    // Farklı mekan türlerini teker teker çekmek ve marker'ları oluşturmak
    useEffect(() => {
        if (userLatitude && userLongitude) {
            // Mekanları farklı türler için ayrı ayrı çekiyoruz ve marker'larını oluşturuyoruz
            const fetchPlacesByType = async (type: string, setMarkers: Function) => {
                const places = await fetchPlaces(userLatitude, userLongitude, type);
                const newMarkers = generateMarkersFromData({
                    data: places,
                    userLatitude,
                    userLongitude,
                    type,  // Mekan türünü işaretle
                });
                setMarkers(newMarkers);
            };

            // Restoranlar
            fetchPlacesByType("restaurant", setRestaurantMarkers);
            // Oteller
            fetchPlacesByType("hotel", setHotelMarkers);
            // Alışveriş merkezleri
            fetchPlacesByType("shopping_mall", setShoppingMallMarkers);
            // Marketler
            fetchPlacesByType("convenience_store", setStoreMarkers);
        }
    }, [userLatitude, userLongitude]);

    // Sürücülerin sürelerini ve fiyatlarını hesapla
    useEffect(() => {
        const allMarkers = [...restaurantMarkers, ...hotelMarkers, ...shoppingMallMarkers, ...storeMarkers];
        if (allMarkers.length > 0 && destinationLatitude && destinationLongitude) {
            calculateDriverTimes({
                markers: allMarkers, 
                userLatitude,
                userLongitude,
                destinationLatitude,
                destinationLongitude
            }).then((driver) => {
                setDrivers(driver as MarkerData[]);
            });
        }
    }, [restaurantMarkers, hotelMarkers, shoppingMallMarkers, storeMarkers, destinationLatitude, destinationLongitude]);

    // Eğer yükleniyorsa
    if (loading || !userLatitude || !userLongitude) {
        return (
            <View className="flex justify-between items-center w-full">
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    }

    // Eğer hata oluşursa
    if (error) {
        return (
            <View className="flex justify-between items-center w-full">
                <Text>Error: {error}</Text>
            </View>
        );
    }

    // Her mekan türüne göre farklı simgeyi seç
    const getIconForPlaceType = (type: string) => {
        switch (type) {
            case "restaurant":
                return icons.restaurantIcon;
            case "hotel":
                return icons.hotelIcon;
            case "shopping_mall":
                return icons.shoppingMallIcon;
            case "convenience_store":
                return icons.storeIcon;
            default:
                return icons.marker;
        }
    };

    // Harita ve marker'ları render et
    return (
        <MapView
            provider={PROVIDER_DEFAULT}
            className="w-full h-full"
            tintColor="#FABC3F"
            mapType="mutedStandard"
            showsPointsOfInterest={false}
            initialRegion={region}
            showsUserLocation={true}
            userInterfaceStyle="dark"
        >
            {/* Restoran Marker'larını haritada göster */}
            {restaurantMarkers.map((marker) => (
                <Marker 
                    key={marker.id}
                    coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                    }}
                    title={marker.title}
                    image={getIconForPlaceType("restaurant")}  // Restoran simgesi
                />
            ))}

            {/* Otel Marker'larını haritada göster */}
            {hotelMarkers.map((marker) => (
                <Marker 
                    key={marker.id}
                    coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                    }}
                    title={marker.title}
                    image={getIconForPlaceType("hotel")}  // Otel simgesi
                />
            ))}

            {/* Alışveriş Merkezi Marker'larını haritada göster */}
            {shoppingMallMarkers.map((marker) => (
                <Marker 
                    key={marker.id}
                    coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                    }}
                    title={marker.title}
                    image={getIconForPlaceType("shopping_mall")}  // AVM simgesi
                />
            ))}

            {/* Market Marker'larını haritada göster */}
            {storeMarkers.map((marker) => (
                <Marker 
                    key={marker.id}
                    coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                    }}
                    title={marker.title}
                    image={getIconForPlaceType("convenience_store")}  // Market simgesi
                />
            ))}

            {/* Destinasyon marker ve rota */}
            {destinationLatitude && destinationLongitude && (
                <>
                    <Marker 
                        key="destination"
                        coordinate={{
                            latitude: destinationLatitude,
                            longitude: destinationLongitude
                        }}
                        title="Destination"
                        image={icons.pin}
                    />

                    <MapViewDirections 
                        origin={{
                            latitude: userLatitude!,
                            longitude: userLongitude!,
                        }}
                        destination={{
                            latitude: destinationLatitude,
                            longitude: destinationLongitude
                        }}
                        apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY}
                        strokeColor="#FABC3F"
                        strokeWidth={3}
                    />
                </>
            )}
        </MapView>
    );
};

export default Map;