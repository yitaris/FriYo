import { createContext, useContext, useEffect } from 'react';
import { client } from '@/utils/supabaseClient';
import { useAuth } from '@clerk/clerk-expo';

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

  const updateUsers = async (last_name,username, id) => {
    const { data, error } = await client
      .from(USERS_TABLE)
      .update({ last_name:last_name,username })
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

  const createBoard = async (title, background) => {
    const { data, error } = await client
      .from(BOARDS_TABLE)
      .insert({ title, creator: userId, background });

    if (error) {
      console.error('Error creating board:', error);
    }

    return data;
  };

  const getBoards = async () => {
    const { data } = await client
      .from(USER_BOARDS_TABLE)
      .select(`boards ( title, id, background )`)
      .eq('user_id', userId);
    const boards = data?.map(b => b.boards);

    return boards || [];
  };

  const getBoardInfo = async (boardId) => {
    const { data } = await client
      .from(BOARDS_TABLE)
      .select(`*, users (first_name)`)
      .match({ id: boardId })
      .single();
    return data;
  };

  const updateBoard = async (board) => {
    const { data } = await client
      .from(BOARDS_TABLE)
      .update({ title: board.title })
      .match({ id: board.id })
      .select('*')
      .single();

    return data;
  };

  const deleteBoard = async (id) => {
    return await client.from(BOARDS_TABLE).delete().match({ id });
  };

  // CRUD Lists
  const getBoardLists = async (boardId) => {
    const lists = await client
      .from(LISTS_TABLE)
      .select('*')
      .eq('board_id', boardId)
      .order('position');

    return lists.data || [];
  };
  
  const addBoardList = async (boardId, title, position = 0) => {
    return await client
      .from(LISTS_TABLE)
      .insert({ board_id: boardId, position, title })
      .select('*')
      .single();
  };

  const updateBoardList = async (list, newname) => {
    return await client
      .from(LISTS_TABLE)
      .update({
        title: newname,
      })
      .match({ id: list.id })
      .select('*')
      .single();
  };

  const deleteBoardList = async (id) => {
    return await client.from(LISTS_TABLE).delete().match({ id });
  };

  // CRUD Cards
  const addListCard = async (listId, boardId, title, position = 0, image_url = null) => {
    return await client
      .from(CARDS_TABLE)
      .insert({ board_id: boardId, list_id: listId, title, position, image_url })
      .select('*')
      .single();
  };

  const getListCards = async (listId) => {
    const lists = await client
      .from(CARDS_TABLE)
      .select('*')
      .eq('list_id', listId)
      .eq('done', false)
      .order('position');

    return lists.data || [];
  };

  const updateCard = async (profileUrl,id) => {
    const { data, error } = await client
      .from(USERS_TABLE) // Assuming you're updating in the USERS_TABLE
      .update({
        avatar_url: profileUrl, // Update the avatar_url field with the new image URL
      })
      .match({ id: id }); // Update the specific user based on their userId
  
    if (error) {
      console.error("Error updating avatar_url in Supabase:", error);
    }
  
    return data;
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

  const setNotifications = async (followerId,followingId,profilePicture,username) => {
    try{
      const {data: followingData, error: followingError} = await client
      .from(USERS_TABLE)
      .select('notifications')
      .eq('id',followingId)
      .single()

      if (followingError) {
        throw new Error(`Error fetching notifications list for user ${followingId}: ${followingError.message}`);
      }
       // Mevcut bildirimi kontrol et, eğer boş ise yeni bir dizi başlat
    const currentNotifications = followingData ? followingData.notifications || [] : [];

    // Yeni bildirimi oluştur ve listeye ekle
    const updatedNotifications = [...currentNotifications, { type: 'Takip isteği', from: followerId, date: new Date(),avatar_url:profilePicture,username:username }];

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
  
  const fetchNotifications = async(followerId,followingId) => {
    try{
      const {data: followingData, error: followingError} = await client
      .from(USERS_TABLE)
      .select('notifications')
      .eq('id',followingId)
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

  const resendNotifications = async (followerId, followingId,username,avatar,messages,title) => {
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
          id:`${followingId}`,
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

  const assignCard = async (cardId, userId) => {
    return await client
      .from(CARDS_TABLE)
      .update({ assigned_to: userId })
      .match({ id: cardId })
      .select('*, users (first_name, email, avatar_url)')
      .single();
  };

  const deleteCard = async (id) => {
    return await client.from(CARDS_TABLE).delete().match({ id });
  };

  const getCardInfo = async (id) => {
    const { data } = await client
      .from(CARDS_TABLE)
      .select(`*, users (*), boards(*)`)
      .match({ id })
      .single();
    return data;
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

  const addUserToBoard = async (boardId, userId) => {
    return await client.from(USER_BOARDS_TABLE).insert({
      user_id: userId,
      board_id: boardId,
    });
  };

  const getBoardMember = async (boardId) => {
    const { data } = await client
      .from(USER_BOARDS_TABLE)
      .select('users(*)')
      .eq('board_id', boardId);

    const members = data?.map(b => b.users);
    return members;
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

  const setUserPushToken = async (token) => {
    const { data, error } = await client
      .from(USERS_TABLE)
      .upsert({ id: userId, push_token: token });

    if (error) {
      console.error('Error setting push token:', error);
    }

    return data;
  };

  const value = {
    userId,
    createBoard,
    getBoards,
    getBoardInfo,
    updateBoard,
    deleteBoard,
    getBoardLists,
    addBoardList,
    updateBoardList,
    deleteBoardList,
    getListCards,
    addListCard,
    updateCard,
    assignCard,
    deleteCard,
    getCardInfo,
    findUsers,
    addUserToBoard,
    getBoardMember,
    getRealtimeCardSubscription,
    getFileFromPath,
    setUserPushToken,
    updateUsers,
    fetchUsersData,
    //takipçileri yönet
    followUser, unfollowUser, getFollowers,getFollowing,
    //Bildirimleri yönet
    setNotifications, fetchNotifications, deleteNotifications,showNotifications,resendNotifications
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};
