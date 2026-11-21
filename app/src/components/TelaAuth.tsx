// Moldura das telas de login/cadastro: logo, título e rolagem com teclado aberto.
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../theme';
import { Logo } from './Logo';

export function TelaAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.logo}>
          <Logo largura={150} altura={90} />
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.subtitulo}>{subtitulo}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, flexGrow: 1 },
  logo: { alignItems: 'center', marginBottom: 20 },
  titulo: { fontFamily: fontes.bold, fontSize: 26, color: cores.texto },
  subtitulo: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave, marginTop: 4, marginBottom: 24 },
});
