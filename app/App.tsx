import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { Navegacao } from './src/navigation';

export default function App() {
  const [fontesProntas, erroFontes] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontesProntas && !erroFontes) return null; // aguarda a fonte Inter

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Navegacao />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
