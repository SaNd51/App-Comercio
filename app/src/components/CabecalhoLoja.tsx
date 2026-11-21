// Cabeçalho da loja (Figma): menu, logo, carrinho com contador, "Retire na loja" e busca.
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes, raio } from '../theme';
import { Logo } from './Logo';

interface Props {
  contadorCarrinho: number;
  onMenu: () => void;
  onCarrinho: () => void;
  busca?: string;
  onBusca?: (texto: string) => void;
  placeholderBusca?: string;
}

export function CabecalhoLoja({ contadorCarrinho, onMenu, onCarrinho, busca, onBusca, placeholderBusca }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[estilos.cabecalho, { paddingTop: insets.top }]}>
      <View style={estilos.linhaTopo}>
        <Pressable onPress={onMenu} hitSlop={12} style={estilos.menu} accessibilityLabel="Abrir menu">
          <Ionicons name="menu-outline" size={26} color={cores.texto} />
        </Pressable>
        <Logo />
        <Pressable onPress={onCarrinho} style={estilos.carrinho} accessibilityLabel={`Carrinho, ${contadorCarrinho} itens`}>
          <Ionicons name="cart-outline" size={22} color={cores.texto} />
          {contadorCarrinho > 0 && (
            <View style={estilos.selo}>
              <Text style={estilos.seloTexto}>{contadorCarrinho > 99 ? '99+' : contadorCarrinho}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={estilos.retirada}>
        <Ionicons name="location-outline" size={14} color={cores.textoMuted} />
        <Text style={estilos.retiradaNegrito}>Retire na loja</Text>
        <Text style={estilos.retiradaTexto}>{'•  Praticidade perto de você'}</Text>
      </View>

      {onBusca && (
        <View style={estilos.busca}>
          <Ionicons name="search-outline" size={20} color={cores.placeholder} />
          <TextInput
            value={busca}
            onChangeText={onBusca}
            placeholder={placeholderBusca ?? 'O que você procura hoje?'}
            placeholderTextColor={cores.placeholder}
            style={estilos.buscaInput}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar produtos"
          />
          {!!busca && (
            <Pressable onPress={() => onBusca('')} hitSlop={10} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color={cores.placeholder} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { backgroundColor: cores.superficie, paddingHorizontal: 20, paddingBottom: 16 },
  linhaTopo: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menu: { width: 42, height: 42, justifyContent: 'center' },
  carrinho: { width: 42, height: 42, borderRadius: raio.botaoIcone, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -1, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  seloTexto: { color: '#fff', fontFamily: fontes.bold, fontSize: 10 },
  retirada: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  retiradaNegrito: { fontFamily: fontes.semibold, fontSize: 11, color: cores.textoMuted },
  retiradaTexto: { fontFamily: fontes.regular, fontSize: 11, color: cores.textoMuted },
  busca: { marginTop: 14, height: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: raio.campo },
  buscaInput: { flex: 1, fontFamily: fontes.regular, fontSize: 13, color: cores.texto, padding: 0 },
});
