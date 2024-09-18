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

  const updateCard = async (task) => {
    return await client
      .from(CARDS_TABLE)
      .update({
        title: task.title,
        description: task.description,
        done: task.done,
      })
      .match({ id: task.id });
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
    const { data } = await client.rpc('search_users', { search });
    return data;
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
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};
