import { InputFieldProps } from "@/types/type";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const InputField = ({
  label,
  labelStyle,
  icon,
  secureTextEntry,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  ...props
}: InputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false); // Odak durumunu takip eder

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-neutral-100 border ${
              isFocused ? "border-[#FABC3F]" : "border-neutral-100"
            } ${containerStyle} rounded-lg`}
          >
            {icon && (
              <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
            )}
            <TextInput
              className={`p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry}
              onFocus={() => setIsFocused(true)} // Odaklanma olduğunda kenarlık rengini değiştirir
              onBlur={() => setIsFocused(false)} // Odak kaybolduğunda kenarlık rengini sıfırlar
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
