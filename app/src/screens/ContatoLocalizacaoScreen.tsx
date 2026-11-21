import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';

export function ContatoLocalizacaoScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'ContatoLocalizacao'>) {
  const insets = useSafeAreaInsets();
  const [loja, setLoja] = useState<Record<string, string>>({});
  useEffect(() => { api<{ loja: Record<string, string> }>('/loja').then((r) => setLoja(r.loja)).catch(() => {}); }, []);

  const contato = route.params.tipo === 'contato';
  async function abrir(url: string) { await Linking.openURL(url); }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.icone} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>{contato ? 'Fale Conosco' : 'Localização'}</Text>
      </View>
      <View style={estilos.corpo}>
        {contato ? (
          <>
            <Pressable onPress={() => abrir(`https://wa.me/${loja.whatsapp ?? ''}`)} style={estilos.card}>
              <Ionicons name="logo-whatsapp" size={22} color={cores.sucesso} /><Text style={estilos.texto}>WhatsApp</Text>
            </Pressable>
            <Pressable onPress={() => abrir(`tel:${loja.telefone ?? ''}`)} style={estilos.card}>
              <Ionicons name="call-outline" size={22} color={cores.texto} /><Text style={estilos.texto}>{loja.telefone || 'Telefone'}</Text>
            </Pressable>
            <Pressable onPress={() => abrir(`mailto:${loja.email ?? ''}`)} style={estilos.card}>
              <Ionicons name="mail-outline" size={22} color={cores.texto} /><Text style={estilos.texto}>{loja.email || 'E-mail'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={estilos.cardInfo}><Text style={estilos.label}>Endereço</Text><Text style={estilos.texto}>{loja.endereco || 'Indisponível'}</Text></View>
            <View style={estilos.cardInfo}><Text style={estilos.label}>Horário</Text><Text style={estilos.texto}>{loja.horarios || 'Indisponível'}</Text></View>
            <Pressable onPress={() => abrir(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loja.endereco ?? '')}`)} style={[estilos.card, { justifyContent: 'center', backgroundColor: cores.primaria }]}>
              <Text style={[estilos.texto, { color: '#fff' }]}>Abrir no mapa</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { height: 64, backgroundColor: cores.superficie, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  icone: { width: 42, height: 42, borderRadius: raio.botaoIcone, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  corpo: { padding: 20, gap: 10 },
  card: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: cores.superficie, borderRadius: raio.card, borderWidth: 1, borderColor: cores.bordaCard, paddingHorizontal: 14 },
  cardInfo: { backgroundColor: cores.superficie, borderRadius: raio.card, borderWidth: 1, borderColor: cores.bordaCard, padding: 14, gap: 4 },
  label: { fontFamily: fontes.bold, fontSize: 12, color: cores.textoSuave },
  texto: { flex: 1, fontFamily: fontes.semibold, fontSize: 13, color: cores.texto },
});
