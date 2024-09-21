import { createContext, useContext, useEffect } from 'react';
import { client } from '@/utils/supabaseClient';
import { useAuth } from '@clerk/clerk-expo';
import { decode } from 'base64-arraybuffer';
// Tablo ve bucket isimleri
export const BOARDS_TABLE = 'boards';
export const USER_BOARDS_TABLE = 'user_boards';
export const LISTS_TABLE = 'lists';
export const CARDS_TABLE = 'cards';
export const USERS_TABLE = 'users';
export const FILES_BUCKET = 'files';

const SupabaseContext = createContext({});

export function useSupabase() {
  return useContext(SupabaseContext);
}

export const SupabaseProvider = ({ children }) => {
  const { userId } = useAuth();

  useEffect(() => {
    setRealtimeAuth();
  }, []);

  const updateUsers = async (last_name, username, id) => {
    const { data, error } = await client
      .from(USERS_TABLE)
      .update({ last_name: last_name, username })
      .match({ id });

    if (error) {
      console.error('Error updating username:', error);
    }

    return data;
  };

  const setRealtimeAuth = async () => {
    const clerkToken = await window.Clerk.session?.getToken({
      template: 'supabase',
    });

    client.realtime.setAuth(clerkToken);
  };

  // Follow a user
  const followUser = async (followerId, followingId) => {
    try {
      // Takip eden kullanıcının mevcut "following" listesini al
      const { data: followerData, error: followerError } = await client
        .from(USERS_TABLE)
        .select('following')
        .eq('id', followerId)
        .single();

      if (followerError) {
        throw new Error(`Error fetching following list for user ${followerId}: ${followerError.message}`);
      }

      // Takip edilen kullanıcının mevcut "followers" listesini al
      const { data: followingData, error: followingError } = await client
        .from(USERS_TABLE)
        .select('followers')
        .eq('id', followingId)
        .single();

      if (followingError) {
        throw new Error(`Error fetching followers list for user ${followingId}: ${followingError.message}`);
      }

      // Mevcut verileri kontrol et ve gerekirse boş liste ile başlat
      const currentFollowing = followerData ? followerData.following || [] : [];
      const currentFollowers = followingData ? followingData.followers || [] : [];

      // Yeni listeleri oluştur
      const updatedFollowing = [...currentFollowing, followingId];
      const updatedFollowers = [...currentFollowers, followerId];

      // Takip eden kullanıcının "following" listesini güncelle
      const { data: updateFollowerData, error: updateFollowerError } = await client
        .from(USERS_TABLE)
        .update({ following: updatedFollowing })
        .eq('id', followerId);

      if (updateFollowerError) {
        throw new Error(`Error updating following list for user ${followerId}: ${updateFollowerError.message}`);
      }

      // Takip edilen kullanıcının "followers" listesini güncelle
      const { data: updateFollowingData, error: updateFollowingError } = await client
        .from(USERS_TABLE)
        .update({ followers: updatedFollowers })
        .eq('id', followingId);

      if (updateFollowingError) {
        throw new Error(`Error updating followers list for user ${followingId}: ${updateFollowingError.message}`);
      }

      return { updateFollowerData, updateFollowingData };
    } catch (error) {
      console.error('Error following user:', error);
      return null;
    }
  };

  const setNotifications = async (followerId, followingId, profilePicture, username) => {
    try {
      const { data: followingData, error: followingError } = await client
        .from(USERS_TABLE)
        .select('notifications')
        .eq('id', followingId)
        .single()

      if (followingError) {
        throw new Error(`Error fetching notifications list for user ${followingId}: ${followingError.message}`);
      }
      // Mevcut bildirimi kontrol et, eğer boş ise yeni bir dizi başlat
      const currentNotifications = followingData ? followingData.notifications || [] : [];

      // Yeni bildirimi oluştur ve listeye ekle
      const updatedNotifications = [...currentNotifications, { type: 'Takip isteği', from: followerId, date: new Date(), avatar_url: profilePicture, username: username }];

      // Takip edilen kullanıcının "notifications" listesini güncelle
      const { data: updateFollowingData, error: updateFollowingError } = await client
        .from(USERS_TABLE)
        .update({ notifications: updatedNotifications })
        .eq('id', followingId);

      if (updateFollowingError) {
        throw new Error(`Error updating notifications for user ${followingId}: ${updateFollowingError.message}`);
      }

      return updateFollowingData;

    } catch (error) {
      console.error('Error adding notification:', error);
      return null;
    }
  }

  const fetchNotifications = async (followerId, followingId) => {
    try {
      const { data: followingData, error: followingError } = await client
        .from(USERS_TABLE)
        .select('notifications')
        .eq('id', followingId)
        .single()
      if (followingError) {
        throw new Error(`Error fetching notifications for user ${followingId}: ${followingError.message}`);
      }
      // Eğer bir notification listesi varsa, kontrol et
      const notifications = followingData?.notifications || [];

      // Bildirimler arasında sizin ID'nizin olup olmadığını kontrol edin
      const requestExists = notifications.some(notification => notification.from === followerId);

      return requestExists; // Eğer istek varsa true, yoksa false döner
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return false; // Hata durumunda false döner
    }
  }
  const deleteNotifications = async (followerId, followingId) => {
    try {
      // Takip edilen kullanıcının mevcut "notifications" listesini al
      const { data: followingData, error: followingError } = await client
        .from(USERS_TABLE)
        .select('notifications')
        .eq('id', followingId)
        .single();

      if (followingError) {
        throw new Error(`Error fetching notifications for user ${followingId}: ${followingError.message}`);
      }

      // Mevcut bildirimi kontrol et, eğer boş ise yeni bir dizi başlat
      const currentNotifications = followingData?.notifications || [];

      // ID'yi listeden çıkar
      const updatedNotifications = currentNotifications.filter(
        (notification) => notification.from !== followerId
      );

      // Takip edilen kullanıcının "notifications" listesini güncelle
      const { data: updateFollowingData, error: updateFollowingError } = await client
        .from(USERS_TABLE)
        .update({ notifications: updatedNotifications })
        .eq('id', followingId);

      if (updateFollowingError) {
        throw new Error(`Error updating notifications for user ${followingId}: ${updateFollowingError.message}`);
      }

      return updateFollowingData;
    } catch (error) {
      console.error('Error removing notification:', error);
      return null;
    }
  };


  const showNotifications = async (ownId) => {
    try {
      // Kullanıcının notifications alanını alıyoruz
      const { data, error } = await client
        .from(USERS_TABLE)
        .select('notifications') // notifications kolonunu seçiyoruz
        .eq('id', ownId); // Kullanıcının kendi ID'sine göre sorgu yapıyoruz

      if (error) {
        console.error("Error fetching notifications:", error);
        return null;
      }

      return data[0]?.notifications || []; // Eğer bildirimler varsa döndür
    } catch (error) {
      console.error("Error in showNotifications:", error);
      return [];
    }
  };

  const resendNotifications = async (followerId, followingId, username, avatar, messages, title) => {
    try {
      // Takip eden kullanıcının mevcut "notifications" listesini al
      const { data: followerData, error: followerError } = await client
        .from(USERS_TABLE)
        .select('notifications')
        .eq('id', followerId)
        .single();

      if (followerError) {
        throw new Error(`Error fetching notifications list for user ${followerId}: ${followerError.message}`);
      }

      // Mevcut bildirimi kontrol et, eğer boş ise yeni bir dizi başlat
      const currentNotifications = followerData ? followerData.notifications || [] : [];

      // Yeni bildirim mesajı oluştur
      const updatedNotifications = [
        ...currentNotifications,
        {
          type: `${title}`,
          message: `${messages}`,
          date: new Date(),
          avatar_url: avatar,
          username: username,
          id: `${followingId}`,
        },
      ];

      // Takip eden kullanıcının "notifications" listesini güncelle
      const { data: updateFollowerData, error: updateFollowerError } = await client
        .from(USERS_TABLE)
        .update({ notifications: updatedNotifications })
        .eq('id', followerId);

      if (updateFollowerError) {
        throw new Error(`Error updating notifications for user ${followerId}: ${updateFollowerError.message}`);
      }

      return updateFollowerData;
    } catch (error) {
      console.error('Error resending notification:', error);
      return null;
    }
  };



  // Unfollow a user by removing your ID from their followers list
  const unfollowUser = async (followerId, followingId) => {
    try {
      // Step 1: Remove your ID from the other user's followers list
      const { data: followingUserData, error: followingUserError } = await client
        .from(USERS_TABLE)
        .select('followers') // Assuming the 'followers' field exists and is an array of user IDs
        .eq('id', followingId)
        .single(); // Fetch the user being unfollowed

      if (followingUserError) {
        console.error('Error fetching following user data:', followingUserError);
        return;
      }

      if (followingUserData && followingUserData.followers) {
        const updatedFollowers = followingUserData.followers.filter(id => id !== followerId); // Remove your ID from followers

        // Update the user's followers list in the database
        const { error: updateFollowersError } = await client
          .from(USERS_TABLE)
          .update({ followers: updatedFollowers })
          .eq('id', followingId);

        if (updateFollowersError) {
          console.error('Error updating followers list:', updateFollowersError);
        } else {
          console.log('Successfully removed your ID from their followers.');
        }
      }

      // Step 2: Remove the following user's ID from your following list
      const { data: currentUserData, error: currentUserError } = await client
        .from(USERS_TABLE)
        .select('following') // Assuming the 'following' field exists and is an array of user IDs
        .eq('id', followerId)
        .single(); // Fetch your own user data

      if (currentUserError) {
        console.error('Error fetching your user data:', currentUserError);
        return;
      }

      if (currentUserData && currentUserData.following) {
        const updatedFollowing = currentUserData.following.filter(id => id !== followingId); // Remove the other user's ID from your following list

        // Update your following list in the database
        const { error: updateFollowingError } = await client
          .from(USERS_TABLE)
          .update({ following: updatedFollowing })
          .eq('id', followerId);

        if (updateFollowingError) {
          console.error('Error updating following list:', updateFollowingError);
        } else {
          console.log('Successfully removed their ID from your following list.');
        }
      }

    } catch (err) {
      console.error('Unfollow user error:', err);
    }
  };

  // Get followers of a user
  const getFollowers = async (userId) => {
    const { data, error } = await client
      .from(USERS_TABLE)
      .select('followers')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching followers:', error);
    }

    return data?.[0]?.followers || [];
  };

  // Get following users of a user
  const getFollowing = async (userId) => {
    const { data, error } = await client
      .from(USERS_TABLE)
      .select('following')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching following users:', error);
    }

    return data?.[0]?.following || [];
  };

  const findUsers = async (search) => {
    const { data, error } = await client
      .from('users') // users tablosunu seçiyoruz
      .select('id, username, first_name, last_name, avatar_url') // avatar_url'yi de seçiyoruz
      .ilike('username', `%${search}%`); // username'i arama terimi ile filtreliyoruz

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data;
  };

  const fetchUsersData = async (userId) => {
    const { data, error } = await client
      .from(USERS_TABLE) // The table where user data is stored
      .select('username, first_name, last_name, avatar_url,followers') // Only fetch necessary fields
      .eq('id', userId) // Match the userId passed in the function

    if (error) {
      console.error('Error fetching user data:', error); // Handle errors
      return null; // Return null in case of error
    }

    if (data && data.length > 0) {
      return data; // Return the data if found
    }

    return null; // Return null if no data found
  };

  const getRealtimeCardSubscription = (id, handleRealtimeChanges) => {
    console.log('Creating a realtime connection...');

    return client
      .channel(`card-changes-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: CARDS_TABLE },
        handleRealtimeChanges
      )
      .subscribe();
  };

  const getFileFromPath = async (path) => {
    const { data } = await client.storage.from(FILES_BUCKET).createSignedUrl(path, 60 * 60, {
      transform: {
        width: 300,
        height: 200,
      },
    });
    return data?.signedUrl;
  };

  const fetchFollowData = async (userId) => {
    try {
      // Assuming you're querying a database or API for follow data
      const { data, error } = await client
        .from("users")
        .select("followers, following")
        .eq("id", userId);

      if (error) {
        console.error("Error fetching follow data:", error);
        return { followers: [], following: [] }; // Return empty arrays in case of an error
      }

      if (data && data.length > 0) {
        return {
          followers: data[0].followers || [], // Ensure followers is an array
          following: data[0].following || [], // Ensure following is an array
        };
      }

      return { followers: [], following: [] }; // Default to empty arrays if no data found
    } catch (err) {
      console.error("Error in fetchFollowData:", err);
      return { followers: [], following: [] }; // Return empty arrays in case of any error
    }
  };
  const addPosts = async (filePath,base64,contentType) => {
    try {
      const { data, error } = await client.storage
        .from('files')
        .upload(filePath, decode(base64), { contentType });
  
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error in addPosts:", err);
    }
  };
  
  const getUserImages = async (userId) => {
    try {
      // Kullanıcının klasöründe bulunan dosyaları listele
      const { data, error } = await client.storage
        .from('files')
        .list(userId, {
          limit: 100, // Bir seferde getirilecek maksimum dosya sayısı
          offset: 0,  // Başlangıç noktası
        });
  
      if (error) throw error;
  
      // Dosya URL'lerini oluştur
      const imageUrls = data.map((file) => {
        return client.storage.from('files').getPublicUrl(`${userId}/${file.name}`).data.publicUrl;
      });
  
      return imageUrls; // Resim URL'lerini döndür
    } catch (err) {
      console.error("Error in getUserImages:", err);
    }
  };
  const value = {
    userId,
    findUsers,
    getRealtimeCardSubscription,
    getFileFromPath,
    updateUsers,
    fetchUsersData,
    addPosts,
    getUserImages,
    //takipçileri yönet
    followUser, unfollowUser, getFollowers, getFollowing, fetchFollowData,
    //Bildirimleri yönet
    setNotifications, fetchNotifications, deleteNotifications, showNotifications, resendNotifications
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};
