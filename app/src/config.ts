// Em dispositivos físicos, configure EXPO_PUBLIC_API_URL com o IPv4 local do computador.
import { Platform } from 'react-native';

declare const process: { env: Record<string, string | undefined> };

// Padrões locais: emulador Android enxerga o PC em 10.0.2.2; iOS/web usam localhost.
const padrao = Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';

export const API_URL = `${(process.env.EXPO_PUBLIC_API_URL ?? padrao).replace(/\/$/, '')}/api`;
