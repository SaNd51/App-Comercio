import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';

export function PaginaTextoScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'PaginaTexto'>) {
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  useEffect(() => {
    api<{ loja: Record<string, string> }>('/loja')
      .then((r) => setTexto(r.loja[route.params.campo] ?? ''))
      .catch(() => setTexto(''));
  }, [route.params.campo]);

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.icone} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>{route.params.titulo}</Text>
      </View>
      <ScrollView contentContainerStyle={estilos.corpo}>
        <View style={estilos.card}><Text style={estilos.texto}>{texto || 'Informação indisponível no momento.'}</Text></View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { height: 64, backgroundColor: cores.superficie, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  icone: { width: 42, height: 42, borderRadius: raio.botaoIcone, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  corpo: { padding: 20 },
  card: { backgroundColor: cores.superficie, borderRadius: raio.card, borderWidth: 1, borderColor: cores.bordaCard, padding: 16 },
  texto: { fontFamily: fontes.regular, fontSize: 14, lineHeight: 22, color: cores.texto },
});
