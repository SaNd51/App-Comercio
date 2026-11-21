import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { ProdutoCard } from '../components/ProdutoCard';
import { useAdicionarAoCarrinho } from '../hooks/useAdicionarAoCarrinho';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';
import { Produto } from '../types';

export function FavoritosScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Favoritos'>) {
  const insets = useSafeAreaInsets();
  const adicionar = useAdicionarAoCarrinho();
  const [produtos, setProdutos] = useState<Produto[]>([]);

  async function carregar() {
    const r = await api<{ produtos: Produto[] }>('/favorites');
    setProdutos(r.produtos.map((p) => ({ ...p, favorito: true })));
  }
  useEffect(() => { carregar().catch(() => {}); }, []);

  async function remover(produto: Produto) {
    await api(`/favorites/${produto.id}`, { method: 'DELETE' });
    setProdutos((atuais) => atuais.filter((p) => p.id !== produto.id));
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.icone} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>Meus Favoritos</Text>
      </View>
      {produtos.length === 0 ? (
        <EstadoMensagem icone="heart-outline" titulo="Nenhum favorito ainda" texto="Toque no coração nos produtos para salvar aqui." />
      ) : (
        <FlatList
          data={produtos}
          numColumns={2}
          keyExtractor={(produto) => produto.id}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ProdutoCard
              produto={item}
              onPress={(produto) => navigation.navigate('ProdutoDetalhe', { produto })}
              onAdicionar={(produto) => adicionar(produto, 1)}
              onFavoritar={remover}
            />
          )}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { height: 64, backgroundColor: cores.superficie, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  icone: { width: 42, height: 42, borderRadius: raio.botaoIcone, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
});
