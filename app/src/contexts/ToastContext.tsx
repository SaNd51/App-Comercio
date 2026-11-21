// Toasts de sucesso/erro/info. Uso: const { mostrar } = useToast(); mostrar('Salvo!', 'sucesso');
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../theme';

type Tipo = 'sucesso' | 'erro' | 'info';
const Ctx = createContext<{ mostrar: (mensagem: string, tipo?: Tipo) => void }>({ mostrar: () => {} });
export const useToast = () => useContext(Ctx);

const fundo: Record<Tipo, string> = { sucesso: cores.sucesso, erro: cores.erro, info: cores.marinho };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ mensagem: string; tipo: Tipo } | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrar = useCallback(
    (mensagem: string, tipo: Tipo = 'info') => {
      clearTimeout(timer.current);
      setToast({ mensagem, tipo });
      Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacidade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 3000);
    },
    [opacidade],
  );

  return (
    <Ctx.Provider value={{ mostrar }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[estilos.toast, { top: insets.top + 8, opacity: opacidade, backgroundColor: fundo[toast.tipo] }]}
        >
          <Text style={estilos.texto}>{toast.mensagem}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const estilos = StyleSheet.create({
  toast: { position: 'absolute', left: 20, right: 20, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 16, zIndex: 999, elevation: 10 },
  texto: { color: '#fff', fontFamily: fontes.semibold, fontSize: 13 },
});
