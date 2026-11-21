// Tela Inicial: busca com debounce, atalhos de categoria, grade de produtos ATIVOS (2 colunas),
// paginação por rolagem infinita, "puxar para atualizar" e estados de carregando/vazio/erro.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AtalhosCategorias } from '../components/AtalhosCategorias';
import { CabecalhoLoja } from '../components/CabecalhoLoja';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { ProdutoCard } from '../components/ProdutoCard';
import { useToast } from '../contexts/ToastContext';
import { useAdicionarAoCarrinho } from '../hooks/useAdicionarAoCarrinho';
import { useDebounce } from '../hooks/useDebounce';
import { AbaProps } from '../navigation/tipos';
import { api } from '../services/api';
import { selecionarContagem, useCarrinho } from '../store/carrinho';
import { cores, fontes, raio } from '../theme';
import { Banner, Categoria, ListaProdutos, Produto } from '../types';
import { mensagemDeErro } from '../utils/erros';

const POR_PAGINA = 10;
type Modo = 'reset' | 'mais' | 'refresh';

export function HomeScreen({ navigation, route }: AbaProps<'Inicio'>) {
  const { mostrar } = useToast();
  const adicionar = useAdicionarAoCarrinho();
  const contador = useCarrinho(selecionarContagem);

  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca.trim(), 400);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerAtivo, setBannerAtivo] = useState(0);
  const [categoriaId, setCategoriaId] = useState<string | null>(route.params?.categoriaId ?? null);

  const [itens, setItens] = useState<Produto[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  // Descarta respostas atrasadas (ex.: o usuário digitou de novo antes da resposta anterior chegar).
  const requisicao = useRef(0);

  const buscar = useCallback(
    async (pag: number, modo: Modo) => {
      const id = ++requisicao.current;
      if (modo === 'reset') setEstado('carregando');
      if (modo === 'mais') setCarregandoMais(true);
      if (modo === 'refresh') setAtualizando(true);
      try {
        const r = await api<ListaProdutos>('/products', {
          query: { search: buscaDebounced, category: categoriaId, page: pag, limit: POR_PAGINA },
        });
        if (id !== requisicao.current) return;
        setItens((anterior) => (pag === 1 ? r.itens : [...anterior, ...r.itens]));
        setPagina(pag);
        setTotalPaginas(r.paginacao.totalPaginas);
        setEstado('ok');
      } catch (e) {
        if (id !== requisicao.current) return;
        if (modo === 'mais') mostrar(mensagemDeErro(e), 'erro');
        else {
          setMensagemErro(mensagemDeErro(e));
          setEstado('erro');
        }
      } finally {
        if (id === requisicao.current) {
          setCarregandoMais(false);
          setAtualizando(false);
        }
      }
    },
    [buscaDebounced, categoriaId, mostrar],
  );

  // Recarrega do início sempre que a busca (já com debounce) ou a categoria mudam.
  useEffect(() => {
    buscar(1, 'reset');
  }, [buscar]);

  useFocusEffect(
    useCallback(() => {
      setCategoriaId(route.params?.categoriaId ?? null);
      if (route.params?.categoriaId) navigation.setParams({ categoriaId: undefined });
    }, [navigation, route.params?.categoriaId]),
  );

  useEffect(() => {
    api<{ categorias: Categoria[] }>('/categories')
      .then((r) => setCategorias(r.categorias))
      .catch(() => {}); // sem categorias, restam só o "Todos" e a busca
  }, []);

  useEffect(() => {
    api<{ banners: Banner[] }>('/banners')
      .then((r) => setBanners(r.banners))
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setBannerAtivo((atual) => (atual + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const carregarMais = () => {
    if (estado === 'ok' && !carregandoMais && pagina < totalPaginas) buscar(pagina + 1, 'mais');
  };

  const nomeCategoria = categorias.find((c) => c.id === categoriaId)?.nome;

  const cabecalhoLista = (
    <View>
      {banners.length > 0 && (
        <View style={{ paddingTop: 12 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(evento) => {
              const largura = evento.nativeEvent.layoutMeasurement.width;
              if (largura > 0) setBannerAtivo(Math.round(evento.nativeEvent.contentOffset.x / (largura - 40)));
            }}
            scrollEventThrottle={16}
            contentContainerStyle={estilos.banners}
          >
            {banners.map((banner) => (
              <Pressable
                key={banner.id}
                onPress={() => navigation.navigate('Promocoes')}
                style={[estilos.banner, { backgroundColor: banner.cor }]}
              >
                {banner.imagemUrl ? (
                  <Image source={{ uri: banner.imagemUrl }} style={estilos.bannerImagem} resizeMode="cover" />
                ) : null}
                <View style={estilos.bannerTexto}>
                  <Text style={estilos.bannerTitulo}>{banner.titulo}</Text>
                  <Text style={estilos.bannerSubtitulo}>{banner.subtitulo}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <View style={estilos.paginacao}>
            {banners.map((_, index) => (
              <View key={index} style={[estilos.ponto, bannerAtivo === index && estilos.pontoAtivo]} />
            ))}
          </View>
        </View>
      )}
      <View style={{ paddingTop: 20 }}>
        <AtalhosCategorias
          categorias={categorias}
          selecionada={categoriaId}
          onSelecionar={setCategoriaId}
          onPromocoes={() => navigation.navigate('Promocoes')}
          onDaSemana={() => navigation.navigate('Promocoes')}
        />
      </View>
      <View style={estilos.tituloLinha}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>{buscaDebounced ? 'Resultados da busca' : (nomeCategoria ?? 'Ofertas do dia')}</Text>
          <Text style={estilos.subtitulo}>Preços baixos para encher sua cesta.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Promocoes')}>
          <Text style={estilos.verTodas}>Ver todas</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={estilos.tela}>
      <CabecalhoLoja
        contadorCarrinho={contador}
        onMenu={() => navigation.navigate('Conta')}
        onCarrinho={() => navigation.navigate('Carrinho')}
        busca={busca}
        onBusca={setBusca}
      />

      <FlatList
        data={estado === 'ok' ? itens : []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={estilos.colunas}
        renderItem={({ item }) => (
          <ProdutoCard
            produto={item}
            onPress={() => navigation.navigate('ProdutoDetalhe', { produto: item })}
            onAdicionar={() => adicionar(item, 1)}
          />
        )}
        ListHeaderComponent={cabecalhoLista}
        ListEmptyComponent={
          estado === 'carregando' ? (
            <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 48 }} />
          ) : estado === 'erro' ? (
            <EstadoMensagem
              icone="cloud-offline-outline"
              titulo="Não foi possível carregar"
              texto={mensagemErro}
              acao={{ rotulo: 'Tentar de novo', onPress: () => buscar(1, 'reset') }}
            />
          ) : (
            <EstadoMensagem
              icone="search-outline"
              titulo="Nenhum produto encontrado"
              texto="Tente outro nome ou escolha outra categoria."
              acao={
                busca || categoriaId
                  ? {
                      rotulo: 'Limpar filtros',
                      onPress: () => {
                        setBusca('');
                        setCategoriaId(null);
                      },
                    }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={carregandoMais ? <ActivityIndicator color={cores.primaria} style={{ marginVertical: 16 }} /> : undefined}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => buscar(1, 'refresh')} tintColor={cores.primaria} colors={[cores.primaria]} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  colunas: { paddingHorizontal: 20, gap: 12 },
  banners: { paddingHorizontal: 20, gap: 12 },
  banner: { width: 320, height: 108, borderRadius: raio.card, overflow: 'hidden', justifyContent: 'center' },
  bannerImagem: { position: 'absolute', width: '100%', height: '100%' },
  bannerTexto: { paddingHorizontal: 16 },
  bannerTitulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  bannerSubtitulo: { marginTop: 4, fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  paginacao: { height: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  ponto: { width: 6, height: 4, borderRadius: 2, backgroundColor: cores.ponto },
  pontoAtivo: { width: 24, backgroundColor: cores.primaria },
  tituloLinha: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14 },
  titulo: { fontFamily: fontes.bold, fontSize: 22, color: cores.texto },
  subtitulo: { marginTop: 4, fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  verTodas: { marginBottom: 3, fontFamily: fontes.bold, fontSize: 12, color: cores.marinho },
});
