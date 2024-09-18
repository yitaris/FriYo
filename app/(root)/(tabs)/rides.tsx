import { Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSupabase } from '@/context/SupabaseContext'; // Supabase bağlamını içe aktar
import { useAuth, useUser } from '@clerk/clerk-expo';

const Rides = () => {
  const { userId } = useAuth(); // Clerk'ten kullanıcı ID'sini al
  const { user } = useUser();
  const { updateUsers } = useSupabase(); // Supabase bağlamından updateUsers fonksiyonunu al
  const username = user?.username; // Use firstName or email instead of username
  const last_name = user?.lastName;
  const id = userId;

  const onUpdateSign = async () => {
    if (username && id) {
      try {
        const result = await updateUsers!(last_name,username, id); // Kullanıcı adı ve ID ile güncelleme yap
        console.log('User updated successfully:', result);
      } catch (error) {
        console.error('Error updating user:', error); // Hata durumunda hata mesajı yazdır
      }
    }
  };

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <TouchableOpacity onPress={onUpdateSign}>
        <Text>Update User</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Rides;
