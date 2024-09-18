import { View, Image } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  return (
    <View
      className={`flex flex-row items-center justify-center relative z-50 rounded-xl `}
      style={{ backgroundColor: '#FABC3F' }}
    >
      <GooglePlacesAutocomplete
        fetchDetails={true}
        placeholder="Aramak"
        debounce={200}
        styles={{
          textInputContainer: {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            marginHorizontal: 20,
            position: "relative",
            shadowColor: "#d4d4d4",
            backgroundColor: '#FABC3F',
            height:50
          },
          textInput: {
            backgroundColor: "#FABC3F",
            fontSize: 16,
            fontWeight: "600",
            marginTop: 5,
            width: "100%",
            borderRadius: 200,
            color: '#1E201E',
          },
          listView: {
            backgroundColor: 'rgba(255,255,255,0)',
            position: "relative",
            top: 0,
            width: "100%",
            borderRadius: 10,
            zIndex: 99,
          },
          row: {
            backgroundColor: 'rgba(0,0,0,0)',
            padding: 13,
            height: 44,
            flexDirection: 'row',
            borderBottomColor: 'black', // Liste öğeleri arasında siyah çizgi
            borderBottomWidth: 0.2,
          },
          description: {
            color: '#1E201E',  // Liste öğesi metin rengi
            fontWeight:'600'
          },
          poweredContainer: {
            backgroundColor: 'rgba(0,0,0,0)', // "Powered by Google" arkaplan rengi
          },
          powered: {
            color: 'white', // "Powered by Google" metin rengi
          },
        }}
        onPress={(data, details = null) => {
          handlePress({
            latitude: details?.geometry.location.lat!,
            longitude: details?.geometry.location.lng!,
            address: data.description,
          });
        }}
        query={{
          key: googlePlacesApiKey,
          language: "en",
        }}
        renderLeftButton={() => (
          <View className="justify-center items-center w-6 h-6">
            <Image
              source={icon ? icon : icons.search}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </View>
        )}
        textInputProps={{
          placeholderTextColor: "#1E201E",
          placeholder: initialLocation ?? "Nereye Gitmek İstersiniz?",
        }}
      />
    </View>
  );
};

export default GoogleTextInput;