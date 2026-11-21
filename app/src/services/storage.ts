// Guarda o token JWT de forma segura: SecureStore (Keychain/Keystore) no celular.
// No navegador (Expo web) o SecureStore não existe, então usamos localStorage.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE = 'mercadinho_token';

export async function salvarToken(token: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(CHAVE, token);
    } catch {
      /* armazenamento indisponível */
    }
    return;
  }
  await SecureStore.setItemAsync(CHAVE, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(CHAVE);
}

export async function removerToken() {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* ignora */
    }
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
