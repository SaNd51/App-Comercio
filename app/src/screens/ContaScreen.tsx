// Aba "Conta" (baseada no Menu do Figma): dados do usuário, Painel Admin (só admin) e Sair.
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { AppStackParams } from '../navigation/tipos';
import { cores, fontes, raio } from '../theme';

export function ContaScreen() {
  const { usuario, sair } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();

  return (
    <View style={[estilos.tela, { paddingTop: insets.top + 24 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[estilos.conteudo, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={estilos.titulo}>Seu mercado. Do seu jeito.</Text>
        <Text style={estilos.subtitulo}>Praticidade e economia sempre por perto.</Text>

        <View style={estilos.cartao}>
          <View style={estilos.avatar}>
            <Ionicons name="person-outline" size={18} color={cores.texto} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.nome} numberOfLines={1}>{usuario?.nome}</Text>
            <Text style={estilos.email} numberOfLines={1}>{usuario?.email}</Text>
          </View>
        </View>

        <Text style={estilos.secao}>ÁREA DO CLIENTE</Text>
        <View style={estilos.grupo}>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('Pedidos')} accessibilityRole="button">
        <Ionicons name="receipt-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Meus Pedidos</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>

      <Pressable style={estilos.linha} onPress={() => navigation.navigate('Enderecos')} accessibilityRole="button">
        <Ionicons name="location-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Meus Endereços</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>

      <Pressable style={estilos.linha} onPress={() => navigation.navigate('DadosPessoais')} accessibilityRole="button">
        <Ionicons name="person-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Dados Pessoais</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>

      <Pressable style={estilos.linha} onPress={() => navigation.navigate('Favoritos')} accessibilityRole="button">
        <Ionicons name="heart-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Meus Favoritos</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>

      <Pressable style={estilos.linha} onPress={() => navigation.navigate('Abas', { screen: 'Promocoes' })} accessibilityRole="button">
        <Ionicons name="pricetag-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Promoções</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('Abas', { screen: 'Vitrine' })} accessibilityRole="button">
        <Ionicons name="bag-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Vitrine</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('PaginaTexto', { titulo: 'Quem Somos', campo: 'quemSomos' })} accessibilityRole="button">
        <Ionicons name="storefront-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Quem Somos</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('ContatoLocalizacao', { tipo: 'contato' })} accessibilityRole="button">
        <Ionicons name="chatbubbles-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Fale Conosco</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('ContatoLocalizacao', { tipo: 'localizacao' })} accessibilityRole="button">
        <Ionicons name="location-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Localização</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('PaginaTexto', { titulo: 'Termos do Pedido', campo: 'termosPedido' })} accessibilityRole="button">
        <Ionicons name="document-text-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Termos do Pedido</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>
      <Pressable style={estilos.linha} onPress={() => navigation.navigate('PaginaTexto', { titulo: 'Aviso Legal', campo: 'avisoLegal' })} accessibilityRole="button">
        <Ionicons name="shield-checkmark-outline" size={19} color={cores.texto} />
        <Text style={estilos.linhaTexto}>Aviso Legal</Text>
        <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
      </Pressable>

      {usuario?.role === 'admin' && (
        <Pressable style={estilos.linha} onPress={() => navigation.navigate('PainelAdmin')} accessibilityRole="button">
          <Ionicons name="shield-outline" size={19} color={cores.texto} />
          <Text style={estilos.linhaTexto}>Painel Admin</Text>
          <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
        </Pressable>
      )}

      <Pressable style={[estilos.linha, estilos.sair]} onPress={sair} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={19} color={cores.primaria} />
        <Text style={[estilos.linhaTexto, { color: cores.primaria }]}>Sair da Conta</Text>
      </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, paddingHorizontal: 20 },
  conteudo: { paddingTop: 0 },
  secao: { marginTop: 8, marginBottom: 8, fontFamily: fontes.bold, fontSize: 10, letterSpacing: 0.8, color: cores.textoSuave },
  grupo: { backgroundColor: cores.superficie, borderRadius: raio.card, paddingTop: 8, paddingHorizontal: 8, overflow: 'hidden' },
  titulo: { fontFamily: fontes.bold, fontSize: 22, color: cores.texto },
  subtitulo: { marginTop: 4, marginBottom: 20, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: cores.superficie, borderRadius: 16, marginBottom: 16 },
  avatar: { width: 35, height: 35, borderRadius: 12, backgroundColor: cores.atalho, alignItems: 'center', justifyContent: 'center' },
  nome: { fontFamily: fontes.semibold, fontSize: 14, color: cores.texto },
  email: { marginTop: 2, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 48, paddingHorizontal: 14, backgroundColor: cores.superficie, borderRadius: raio.campo, marginBottom: 12 },
  linhaTexto: { flex: 1, fontFamily: fontes.medium, fontSize: 13, color: cores.texto },
  sair: { backgroundColor: cores.primariaClara },
});
