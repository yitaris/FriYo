import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';
import { SupabaseProvider } from './context/SupabaseContext'; // Adjust the path as needed

const Root = () => (
  <SupabaseProvider>
    <App />
  </SupabaseProvider>
);

registerRootComponent(Root);
