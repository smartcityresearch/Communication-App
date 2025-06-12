//File to create user context to persist user data across screens without needing to fetch from local storage

import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start(if already exists)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // if by chance data not stored in async storage, stores it from context
  const setUserWithPersistence = async (userData) => {
    try {
      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem('user');
      }
      setUser(userData);
    } catch (error) {
      console.error('Error persisting user:', error);
      setUser(userData); // Set anyway, just log the storage error
    }
  };
  //wrap context around all screens
  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: setUserWithPersistence, 
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

//exporting context to be used in different files
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

