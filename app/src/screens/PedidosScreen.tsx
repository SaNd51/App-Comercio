// "Meus pedidos": lista os pedidos do usuário; toque para reabrir o Pix ou ver o resumo.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { SeloStatus } from '../components/SeloStatus';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';
import { ListaPedidos, Pedido } from '../types';
import { mensagemDeErro } from '../utils/erros';
import { formatarData, formatarPreco } from '../utils/formatar';
import { codigoPedido } from '../utils/pedido';

export function PedidosScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Pedidos'>) {
  const insets = useSafeAreaInsets();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [mensagem, setMensagem] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async (refresh = false) => {
    if (refresh) setAtualizando(true);
    try {
      const r = await api<ListaPedidos>('/orders', { query: { limit: 50 } }); // últimos 50
      setPedidos(r.pedidos);
      setEstado('ok');
    } catch (e) {
      setMensagem(mensagemDeErro(e));
      setEstado('erro');
    } finally {
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.voltar} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>Meus pedidos</Text>
        <View style={{ width: 42 }} />
      </View>

      <FlatList
        data={estado === 'ok' ? pedidos : []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} tintColor={cores.primaria} colors={[cores.primaria]} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('Checkout', { pedidoId: item.id, pedido: item })}
            style={estilos.cartao}
            accessibilityRole="button"
            accessibilityLabel={`Pedido ${codigoPedido(item.id)}, R$ ${formatarPreco(item.total)}`}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={estilos.codigo}>Pedido {codigoPedido(item.id)}</Text>
              <Text style={estilos.detalhe}>
                {formatarData(item.criadoEm)} · {item.itens.length} {item.itens.length === 1 ? 'produto' : 'produtos'}
              </Text>
              <View style={{ marginTop: 6 }}>
                <SeloStatus status={item.status} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text style={estilos.total}>R$ {formatarPreco(item.total)}</Text>
              <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          estado === 'carregando' ? (
            <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 48 }} />
          ) : estado === 'erro' ? (
            <EstadoMensagem icone="cloud-offline-outline" titulo="Não foi possível carregar" texto={mensagem} acao={{ rotulo: 'Tentar de novo', onPress: () => carregar() }} />
          ) : (
            <EstadoMensagem icone="receipt-outline" titulo="Nenhum pedido ainda" texto="Quando você fizer um pedido, ele aparece aqui." acao={{ rotulo: 'Ver produtos', onPress: () => navigation.navigate('Abas') }} />
          )
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: cores.superficie },
  voltar: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  cartao: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card },
  codigo: { fontFamily: fontes.bold, fontSize: 14, color: cores.texto },
  detalhe: { fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  total: { fontFamily: fontes.bold, fontSize: 15, color: cores.primaria },
});
