// Painel Admin → Pedidos recebidos: filtro por status, detalhes e ações (marcar como pago / cancelar).
// Ações que mexem em dinheiro/estoque pedem confirmação em dois toques.
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ChipsFiltro } from '../../components/ChipsFiltro';
import { EstadoMensagem } from '../../components/EstadoMensagem';
import { SeloStatus } from '../../components/SeloStatus';
import { useToast } from '../../contexts/ToastContext';
import { useListaPaginada } from '../../hooks/useListaPaginada';
import { api } from '../../services/api';
import { cores, fontes, raio } from '../../theme';
import { ListaPedidos, Pedido, StatusPedido } from '../../types';
import { mensagemDeErro } from '../../utils/erros';
import { formatarData, formatarPreco } from '../../utils/formatar';
import { codigoPedido } from '../../utils/pedido';

type Filtro = 'todos' | StatusPedido;
const OPCOES: { valor: Filtro; rotulo: string }[] = [
  { valor: 'aguardando_pagamento', rotulo: 'Aguardando' },
  { valor: 'pago', rotulo: 'Pagos' },
  { valor: 'cancelado', rotulo: 'Cancelados' },
  { valor: 'todos', rotulo: 'Todos' },
];

export function PedidosAdmin() {
  const { mostrar } = useToast();
  const [filtro, setFiltro] = useState<Filtro>('aguardando_pagamento'); // o que o admin mais precisa ver

  const buscarPagina = useCallback(
    async (pagina: number) => {
      const r = await api<ListaPedidos>('/orders', {
        query: { status: filtro === 'todos' ? undefined : filtro, page: pagina, limit: 20 },
      });
      return { itens: r.pedidos, totalPaginas: r.paginacao.totalPaginas };
    },
    [filtro],
  );
  const lista = useListaPaginada<Pedido>(buscarPagina);

  async function alterar(id: string, status: 'pago' | 'cancelado') {
    try {
      const r = await api<{ pedido: Pedido }>(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
      lista.setItens((prev) => prev.map((p) => (p.id === id ? r.pedido : p)));
      mostrar(status === 'pago' ? 'Pagamento confirmado.' : 'Pedido cancelado e estoque devolvido.', 'sucesso');
    } catch (e) {
      mostrar(mensagemDeErro(e), 'erro');
      lista.recarregar('silencioso'); // o status pode já ter mudado
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 14, paddingBottom: 4 }}>
        <ChipsFiltro<Filtro> opcoes={OPCOES} valor={filtro} onChange={setFiltro} />
      </View>

      <FlatList
        data={lista.estado === 'ok' ? lista.itens : []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={lista.atualizando} onRefresh={() => lista.recarregar('refresh')} tintColor={cores.primaria} colors={[cores.primaria]} />}
        onEndReached={lista.carregarMais}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <CartaoPedido pedido={item} onAlterar={alterar} />}
        ListEmptyComponent={
          lista.estado === 'carregando' ? (
            <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 40 }} />
          ) : lista.estado === 'erro' ? (
            <EstadoMensagem icone="cloud-offline-outline" titulo="Não foi possível carregar" texto={lista.mensagemErro} acao={{ rotulo: 'Tentar de novo', onPress: () => lista.recarregar() }} />
          ) : (
            <EstadoMensagem icone="receipt-outline" titulo="Nenhum pedido aqui" texto={filtro === 'aguardando_pagamento' ? 'Nenhum pedido aguardando pagamento.' : 'Nada com este filtro.'} />
          )
        }
        ListFooterComponent={lista.carregandoMais ? <ActivityIndicator color={cores.primaria} style={{ marginVertical: 16 }} /> : undefined}
      />
    </View>
  );
}

function CartaoPedido({ pedido, onAlterar }: { pedido: Pedido; onAlterar: (id: string, status: 'pago' | 'cancelado') => Promise<void> }) {
  const { mostrar } = useToast();
  const [aberto, setAberto] = useState(false);
  const [acao, setAcao] = useState<'pago' | 'cancelado' | null>(null);
  const [processando, setProcessando] = useState(false);
  const aguardando = pedido.status === 'aguardando_pagamento';

  async function confirmar() {
    if (!acao) return;
    setProcessando(true);
    await onAlterar(pedido.id, acao);
    setProcessando(false);
    setAcao(null);
  }

  async function avancarEntrega() {
    if (!pedido.statusEntrega) return;
    setProcessando(true);
    try {
      const r = await api<{ pedido: Pedido }>(`/orders/${pedido.id}/entrega`, { method: 'PATCH', body: {} });
      pedido.statusEntrega = r.pedido.statusEntrega;
      mostrar('Estado da entrega atualizado.', 'sucesso');
    } catch (e) {
      mostrar(mensagemDeErro(e), 'erro');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <View style={estilos.cartao}>
      <Pressable onPress={() => setAberto((a) => !a)} style={estilos.topo} accessibilityRole="button" accessibilityState={{ expanded: aberto }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={estilos.codigo}>Pedido {codigoPedido(pedido.id)}</Text>
          <Text style={estilos.cliente} numberOfLines={1}>{pedido.cliente?.nome ?? 'Cliente'}</Text>
          <Text style={estilos.data}>{formatarData(pedido.criadoEm)}</Text>
          <View style={{ marginTop: 6 }}>
            <SeloStatus status={pedido.status} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 10 }}>
          <Text style={estilos.total}>R$ {formatarPreco(pedido.total)}</Text>
          <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={cores.navInativo} />
        </View>
      </Pressable>

      {aberto && (
        <View style={estilos.detalhes}>
          {!!pedido.cliente?.email && <Text style={estilos.email}>{pedido.cliente.email}</Text>}
          {pedido.enderecoEntrega && (
            <Text style={estilos.email}>
              Entrega: {pedido.enderecoEntrega.logradouro}, {pedido.enderecoEntrega.numero} — {pedido.enderecoEntrega.bairro}, {pedido.enderecoEntrega.cidade}/{pedido.enderecoEntrega.uf}
            </Text>
          )}
          {pedido.itens.map((i) => (
            <View key={i.id} style={estilos.item}>
              <Text style={estilos.itemNome} numberOfLines={2}>{i.quantidade}× {i.nome}</Text>
              <Text style={estilos.itemValor}>R$ {formatarPreco(i.subtotal)}</Text>
            </View>
          ))}

          {pedido.status === 'pago' && pedido.statusEntrega && (
            <Pressable onPress={avancarEntrega} disabled={processando} style={[estilos.botao, { marginTop: 10, backgroundColor: cores.primaria }]}>
              {processando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.botaoTexto}>Avançar entrega</Text>}
            </Pressable>
          )}

          {aguardando &&
            (acao ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Text style={estilos.pergunta}>
                  {acao === 'pago'
                    ? `Confirmar o recebimento de R$ ${formatarPreco(pedido.total)} no Pix?`
                    : 'Cancelar este pedido e devolver os itens ao estoque?'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => setAcao(null)} disabled={processando} style={[estilos.botao, estilos.botaoSec, { flex: 1 }]}>
                    <Text style={estilos.botaoSecTexto}>Voltar</Text>
                  </Pressable>
                  <Pressable onPress={confirmar} disabled={processando} style={[estilos.botao, { flex: 1, backgroundColor: acao === 'pago' ? cores.sucesso : cores.erro }]}>
                    {processando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.botaoTexto}>{acao === 'pago' ? 'Sim, recebi' : 'Sim, cancelar'}</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Pressable onPress={() => setAcao('cancelado')} style={[estilos.botao, estilos.botaoSec, { flex: 1 }]}>
                  <Text style={estilos.botaoSecTexto}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={() => setAcao('pago')} style={[estilos.botao, { flex: 1.4, backgroundColor: cores.sucesso }]}>
                  <Text style={estilos.botaoTexto}>Marcar como pago</Text>
                </Pressable>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card },
  topo: { flexDirection: 'row', gap: 12, padding: 14 },
  codigo: { fontFamily: fontes.bold, fontSize: 14, color: cores.texto },
  cliente: { fontFamily: fontes.medium, fontSize: 13, color: cores.texto },
  data: { fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  total: { fontFamily: fontes.bold, fontSize: 15, color: cores.primaria },
  detalhes: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: cores.bordaNav },
  email: { paddingTop: 10, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  item: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  itemNome: { flex: 1, fontFamily: fontes.medium, fontSize: 12, color: cores.texto },
  itemValor: { fontFamily: fontes.semibold, fontSize: 12, color: cores.texto },
  pergunta: { fontFamily: fontes.semibold, fontSize: 12, color: cores.texto },
  botao: { height: 44, borderRadius: raio.campo, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontFamily: fontes.bold, fontSize: 13, color: '#fff' },
  botaoSec: { borderWidth: 1.5, borderColor: cores.bordaCampo, backgroundColor: cores.superficie },
  botaoSecTexto: { fontFamily: fontes.bold, fontSize: 13, color: cores.textoMuted },
});
