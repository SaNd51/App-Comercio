import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CabecalhoLoja } from '../components/CabecalhoLoja';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { ProdutoCard } from '../components/ProdutoCard';
import { useToast } from '../contexts/ToastContext';
import { useAdicionarAoCarrinho } from '../hooks/useAdicionarAoCarrinho';
import { AbaProps } from '../navigation/tipos';
import { api } from '../services/api';
import { selecionarContagem, useCarrinho } from '../store/carrinho';
import { cores, fontes } from '../theme';
import { Categoria, ListaProdutos, Produto } from '../types';

export function PromocoesScreen({ navigation }: AbaProps<'Promocoes'>) {
  const contador = useCarrinho(selecionarContagem);
  const adicionar = useAdicionarAoCarrinho();
  const { mostrar } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'desconto' | 'preco'>('desconto');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const filtrosRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  async function carregar() {
    setEstado('carregando');
    try {
      const r = await api<ListaProdutos>('/products', {
        query: { oferta: 'true', category: categoriaId, sort: ordenacao, page: 1, limit: 100 },
      });
      setProdutos(r.itens);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }

  useEffect(() => {
    api<{ categorias: Categoria[] }>('/categories').then((r) => setCategorias(r.categorias)).catch(() => {});
  }, []);
  useEffect(() => { carregar(); }, [categoriaId, ordenacao]);

  useFocusEffect(
    useCallback(() => {
      setCategoriaId(null);
      setOrdenacao('desconto');
      filtrosRef.current?.scrollTo({ x: 0, animated: false });
    }, []),
  );

  async function favoritar(produto: Produto) {
    try {
      if (produto.favorito) await api(`/favorites/${produto.id}`, { method: 'DELETE' });
      else await api(`/favorites/${produto.id}`, { method: 'PUT' });
      setProdutos((atuais) => atuais.map((p) => p.id === produto.id ? { ...p, favorito: !p.favorito } : p));
    } catch {
      mostrar('Não foi possível atualizar os favoritos.', 'erro');
    }
  }

  return (
    <View style={estilos.tela}>
      <CabecalhoLoja contadorCarrinho={contador} onMenu={() => navigation.navigate('Conta')} onCarrinho={() => navigation.navigate('Carrinho')} />
      <View style={estilos.titulo}>
        <Text style={estilos.tituloTexto}>Promoções</Text>
        <Text style={estilos.subtitulo}>Ofertas especiais para você</Text>
      </View>
      <ScrollView
        ref={filtrosRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.filtrosScroll}
        contentContainerStyle={estilos.filtros}
      >
        <Pressable onPress={() => setCategoriaId(null)} style={[estilos.filtro, !categoriaId && estilos.filtroAtivo]}>
          <Text style={[estilos.filtroTexto, !categoriaId && estilos.filtroTextoAtivo]}>Todas</Text>
        </Pressable>
        {categorias.map((categoria) => (
          <Pressable key={categoria.id} onPress={() => setCategoriaId(categoria.id)} style={[estilos.filtro, categoriaId === categoria.id && estilos.filtroAtivo]}>
            <Text style={[estilos.filtroTexto, categoriaId === categoria.id && estilos.filtroTextoAtivo]}>{categoria.nome}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={estilos.ordenacao}>
        <Pressable onPress={() => setOrdenacao('desconto')} style={[estilos.ordem, ordenacao === 'desconto' && estilos.ordemAtiva]}>
          <Text style={[estilos.ordemTexto, ordenacao === 'desconto' && estilos.ordemAtivaTexto]}>Maior desconto</Text>
        </Pressable>
        <Pressable onPress={() => setOrdenacao('preco')} style={[estilos.ordem, ordenacao === 'preco' && estilos.ordemAtiva]}>
          <Text style={[estilos.ordemTexto, ordenacao === 'preco' && estilos.ordemAtivaTexto]}>Menor preço</Text>
        </Pressable>
      </View>

      {estado === 'carregando' ? (
        <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 48 }} />
      ) : estado === 'erro' ? (
        <EstadoMensagem icone="cloud-offline-outline" titulo="Não foi possível carregar" texto="Tente novamente." acao={{ rotulo: 'Tentar de novo', onPress: carregar }} />
      ) : produtos.length === 0 ? (
        <EstadoMensagem icone="pricetag-outline" titulo="Sem promoções no momento" texto="Volte em breve para conferir novas ofertas." />
      ) : (
        <FlatList
          style={estilos.lista}
          data={produtos}
          numColumns={2}
          keyExtractor={(produto) => produto.id}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ProdutoCard
              produto={item}
              onPress={(produto) => navigation.navigate('ProdutoDetalhe', { produto })}
              onAdicionar={(produto) => adicionar(produto, 1)}
              onFavoritar={favoritar}
            />
          )}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  lista: { flex: 1 },
  titulo: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  tituloTexto: { fontFamily: fontes.bold, fontSize: 22, color: cores.texto },
  subtitulo: { marginTop: 3, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  filtrosScroll: { height: 46, flexGrow: 0, flexShrink: 0 },
  filtros: { alignItems: 'center', paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  filtro: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: cores.bordaCard, backgroundColor: cores.superficie, paddingHorizontal: 14, justifyContent: 'center' },
  filtroAtivo: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  filtroTexto: { fontFamily: fontes.semibold, fontSize: 12, color: cores.textoMuted },
  filtroTextoAtivo: { color: cores.primaria },
  ordenacao: { flexDirection: 'row', marginHorizontal: 20, marginTop: 6, marginBottom: 8, borderRadius: 12, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, overflow: 'hidden' },
  ordem: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  ordemAtiva: { backgroundColor: cores.primariaClara },
  ordemTexto: { fontFamily: fontes.medium, fontSize: 11, color: cores.textoMuted },
  ordemAtivaTexto: { color: cores.primaria, fontFamily: fontes.bold },
});
