// Carrinho: itens com quantidade editável, remover, subtotal por item, total e "Finalizar compra".
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { SeletorQuantidade } from '../components/SeletorQuantidade';
import { useToast } from '../contexts/ToastContext';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { Endereco, Pedido } from '../types';
import { mensagemDeErro } from '../utils/erros';
import { useCarrinho } from '../store/carrinho';
import { ItemCarrinho, calcularTotal, contarUnidades } from '../store/carrinhoLogica';
import { cores, fontes, raio } from '../theme';
import { formatarPreco } from '../utils/formatar';

export function CarrinhoScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Carrinho'>) {
  const insets = useSafeAreaInsets();
  const { mostrar } = useToast();
  const itens = useCarrinho((s) => s.itens);
  const definirQuantidade = useCarrinho((s) => s.definirQuantidade);
  const remover = useCarrinho((s) => s.remover);
  const sincronizar = useCarrinho((s) => s.sincronizar);
  const limpar = useCarrinho((s) => s.limpar);
  const [enviando, setEnviando] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('retirada');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoId, setEnderecoId] = useState<string | null>(null);

  useEffect(() => {
    api<{ enderecos: Endereco[] }>('/addresses')
      .then((r) => {
        setEnderecos(r.enderecos);
        setEnderecoId(r.enderecos.find((e) => e.principal)?.id ?? r.enderecos[0]?.id ?? null);
      })
      .catch(() => setEnderecos([]));
  }, []);

  // Ao abrir, confere preço/estoque atuais (o servidor ainda recalcula tudo no pedido).
  useFocusEffect(
    useCallback(() => {
      sincronizar().then((r) => {
        if (r.precoMudou) mostrar('Alguns preços foram atualizados.', 'info');
      });
    }, [sincronizar, mostrar]),
  );

  const total = useMemo(() => calcularTotal(itens), [itens]);
  const unidades = useMemo(() => contarUnidades(itens), [itens]);
  const temIndisponivel = itens.some((i) => i.indisponivel);

  // Cria o pedido na API (que recalcula o total com os preços do banco) e abre o checkout Pix.
  async function finalizar() {
    if (enviando) return;
    setEnviando(true);
    try {
      const { pedido } = await api<{ pedido: Pedido }>('/orders', {
        method: 'POST',
        body: {
          itens: itens.filter((i) => !i.indisponivel).map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
          tipoEntrega,
          enderecoId: tipoEntrega === 'entrega' ? enderecoId : undefined,
        },
      });
      limpar(); // pedido criado: o carrinho esvazia
      navigation.replace('Checkout', { pedidoId: pedido.id, pedido }); // voltar leva à loja, não ao carrinho vazio
    } catch (e) {
      mostrar(mensagemDeErro(e), 'erro');
      sincronizar(); // estoque/preço podem ter mudado: atualiza a tela
      setEnviando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.voltar} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>Carrinho</Text>
        <View style={{ width: 42 }} />
      </View>

      {itens.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EstadoMensagem
            icone="cart-outline"
            titulo="Seu carrinho está vazio"
            texto="Adicione produtos para fazer seu pedido."
            acao={{ rotulo: 'Ver produtos', onPress: () => navigation.navigate('Abas') }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={itens}
            keyExtractor={(i) => i.produtoId}
            contentContainerStyle={{ padding: 20, paddingBottom: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <LinhaItem
                item={item}
                onQuantidade={(q) => definirQuantidade(item.produtoId, q)}
                onRemover={() => {
                  remover(item.produtoId);
                  mostrar('Item removido.', 'info');
                }}
              />
            )}
          />

          <View style={[estilos.resumo, { paddingBottom: insets.bottom + 12 }]}>
            <View style={estilos.entregaOpcoes}>
              <Pressable onPress={() => setTipoEntrega('retirada')} style={[estilos.entregaOpcao, tipoEntrega === 'retirada' && estilos.entregaAtiva]}>
                <Text style={[estilos.entregaTexto, tipoEntrega === 'retirada' && estilos.entregaTextoAtivo]}>Retirada na loja</Text>
              </Pressable>
              <Pressable onPress={() => setTipoEntrega('entrega')} style={[estilos.entregaOpcao, tipoEntrega === 'entrega' && estilos.entregaAtiva]}>
                <Text style={[estilos.entregaTexto, tipoEntrega === 'entrega' && estilos.entregaTextoAtivo]}>Entrega</Text>
              </Pressable>
            </View>
            {tipoEntrega === 'entrega' && (
              <View style={estilos.enderecos}>
                {enderecos.length === 0 ? (
                  <Pressable onPress={() => navigation.navigate('Enderecos')} style={estilos.adicionarEndereco}>
                    <Text style={estilos.adicionarEnderecoTexto}>Adicionar endereço</Text>
                  </Pressable>
                ) : (
                  enderecos.map((endereco) => (
                    <Pressable
                      key={endereco.id}
                      onPress={() => setEnderecoId(endereco.id)}
                      style={[estilos.enderecoOpcao, enderecoId === endereco.id && estilos.enderecoAtivo]}
                    >
                      <Text style={estilos.enderecoNome}>{endereco.apelido}{endereco.principal ? ' · Principal' : ''}</Text>
                      <Text style={estilos.enderecoTexto}>{endereco.logradouro}, {endereco.numero} — {endereco.cidade}/{endereco.uf}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
            {temIndisponivel && (
              <Text style={estilos.aviso}>Remova os itens indisponíveis para continuar.</Text>
            )}
            <View style={estilos.linhaTotal}>
              <Text style={estilos.totalRotulo}>
                Total ({unidades} {unidades === 1 ? 'item' : 'itens'})
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={estilos.totalMoeda}>R$</Text>
                <Text style={estilos.totalValor}>{formatarPreco(total)}</Text>
              </View>
            </View>
            <Botao titulo="Finalizar compra" onPress={finalizar} carregando={enviando} desabilitado={temIndisponivel || unidades === 0 || (tipoEntrega === 'entrega' && !enderecoId)} />
          </View>
        </>
      )}
    </View>
  );
}

function LinhaItem({ item, onQuantidade, onRemover }: { item: ItemCarrinho; onQuantidade: (q: number) => void; onRemover: () => void }) {
  const subtotal = item.preco * item.quantidade;
  return (
    <View style={[estilos.item, item.indisponivel && { opacity: 0.6 }]}>
      <View style={estilos.miniatura}>
        {item.imagemUrl ? (
          <Image source={{ uri: item.imagemUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={26} color={cores.ponto} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={estilos.nome} numberOfLines={2}>{item.nome}</Text>
        <Text style={estilos.unitario}>R$ {formatarPreco(item.preco)} cada</Text>
        {item.indisponivel ? (
          <Text style={estilos.indisponivel}>Indisponível no momento</Text>
        ) : (
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <SeletorQuantidade compacto valor={item.quantidade} onChange={onQuantidade} min={1} max={item.estoque} />
          </View>
        )}
      </View>

      <View style={estilos.direita}>
        <Pressable onPress={onRemover} hitSlop={10} accessibilityLabel={`Remover ${item.nome}`}>
          <Ionicons name="trash-outline" size={20} color={cores.navInativo} />
        </Pressable>
        {!item.indisponivel && <Text style={estilos.subtotal}>R$ {formatarPreco(subtotal)}</Text>}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  entregaOpcoes: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  entregaOpcao: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, borderColor: cores.bordaCampo, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.superficie },
  entregaAtiva: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  entregaTexto: { fontFamily: fontes.semibold, fontSize: 12, color: cores.textoMuted },
  entregaTextoAtivo: { color: cores.primaria },
  enderecos: { gap: 6, marginBottom: 10 },
  enderecoOpcao: { borderWidth: 1, borderColor: cores.bordaCard, borderRadius: 12, padding: 10, backgroundColor: cores.superficie },
  enderecoAtivo: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  enderecoNome: { fontFamily: fontes.bold, fontSize: 12, color: cores.texto },
  enderecoTexto: { marginTop: 2, fontFamily: fontes.regular, fontSize: 10, color: cores.textoSuave },
  adicionarEndereco: { height: 40, borderRadius: 12, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center' },
  adicionarEnderecoTexto: { fontFamily: fontes.bold, fontSize: 12, color: cores.primaria },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: cores.superficie },
  voltar: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  item: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card },
  miniatura: { width: 68, height: 68, borderRadius: 12, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nome: { fontFamily: fontes.semibold, fontSize: 12, lineHeight: 17, color: cores.texto },
  unitario: { marginTop: 2, fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  indisponivel: { marginTop: 8, fontFamily: fontes.semibold, fontSize: 11, color: cores.erro },
  direita: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontFamily: fontes.bold, fontSize: 14, color: cores.primaria },
  resumo: { paddingHorizontal: 20, paddingTop: 14, backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.bordaNav },
  aviso: { marginBottom: 10, fontFamily: fontes.semibold, fontSize: 12, color: cores.erro },
  linhaTotal: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  totalRotulo: { fontFamily: fontes.medium, fontSize: 13, color: cores.textoSuave },
  totalMoeda: { fontFamily: fontes.medium, fontSize: 13, color: cores.primaria },
  totalValor: { fontFamily: fontes.bold, fontSize: 26, color: cores.primaria },
});
