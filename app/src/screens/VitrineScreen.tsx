import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { CabecalhoLoja } from '../components/CabecalhoLoja';
import { AbaProps } from '../navigation/tipos';
import { api } from '../services/api';
import { selecionarContagem, useCarrinho } from '../store/carrinho';
import { cores, fontes, raio } from '../theme';
import { Categoria } from '../types';

const FIXAS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  açougue: 'restaurant-outline',
  bebidas: 'beer-outline',
  higiene: 'water-outline',
  hortifruti: 'leaf-outline',
  laticinios: 'cafe-outline',
  limpeza: 'sparkles-outline',
  mercearia: 'basket-outline',
  utilidades: 'home-outline',
};

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');

export function VitrineScreen({ navigation }: AbaProps<'Vitrine'>) {
  const contador = useCarrinho(selecionarContagem);
  const { width } = useWindowDimensions();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    api<{ categorias: Categoria[] }>('/categories')
      .then((r) => setCategorias(r.categorias))
      .catch(() => setCategorias([]));
  }, []);

  const filtradas = useMemo(
    () => categorias.filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase())),
    [categorias, busca],
  );
  const cardWidth = (width - 20 * 2 - 12) / 2;

  return (
    <View style={estilos.tela}>
      <CabecalhoLoja contadorCarrinho={contador} onMenu={() => navigation.navigate('Conta')} onCarrinho={() => navigation.navigate('Carrinho')} />
      <ScrollView contentContainerStyle={estilos.corpo}>
        <Text style={estilos.titulo}>Vitrine</Text>
        <Text style={estilos.subtitulo}>Tudo para sua casa, em um só lugar.</Text>
        <View style={estilos.busca}>
          <Ionicons name="search-outline" size={20} color={cores.placeholder} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Encontre uma categoria"
            placeholderTextColor={cores.placeholder}
            style={estilos.buscaInput}
          />
        </View>

        <View style={estilos.grade}>
          {filtradas.map((categoria) => (
            <Pressable
              key={categoria.id}
              onPress={() => navigation.navigate('Inicio', { categoriaId: categoria.id })}
              style={[estilos.card, { width: cardWidth }]}
            >
              <View style={estilos.icone}>
                <Ionicons name={FIXAS[normalizar(categoria.nome)] ?? 'pricetag-outline'} size={26} color={cores.texto} />
              </View>
              <Text style={estilos.nome}>{categoria.nome}</Text>
              <View style={estilos.cardLinha}>
                <Text style={estilos.descricao} numberOfLines={1}>{categoria.descricao || 'Ver produtos'}</Text>
                <Ionicons name="chevron-forward" size={16} color={cores.navInativo} />
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => navigation.navigate('Promocoes')} style={estilos.promoBar}>
          <Text style={estilos.promoTexto}>Mais economia nas promoções do dia</Text>
          <Ionicons name="chevron-forward" size={16} color={cores.primaria} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  corpo: { paddingBottom: 24 },
  titulo: { marginHorizontal: 20, marginTop: 16, fontFamily: fontes.bold, fontSize: 22, color: cores.texto },
  subtitulo: { marginHorizontal: 20, marginTop: 4, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  busca: { height: 44, marginHorizontal: 20, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, backgroundColor: cores.campo, borderRadius: raio.campo },
  buscaInput: { flex: 1, fontFamily: fontes.regular, fontSize: 13, color: cores.texto, padding: 0 },
  grade: { marginTop: 14, paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { height: 112, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card, padding: 12 },
  icone: { width: 49, height: 49, borderRadius: 17, backgroundColor: cores.atalho, alignItems: 'center', justifyContent: 'center' },
  nome: { marginTop: 8, fontFamily: fontes.bold, fontSize: 13, color: cores.texto },
  cardLinha: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
  descricao: { flex: 1, fontFamily: fontes.regular, fontSize: 9, color: cores.textoSuave },
  promoBar: { height: 44, marginHorizontal: 20, marginTop: 14, borderRadius: raio.card, backgroundColor: cores.primariaClara, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  promoTexto: { fontFamily: fontes.semibold, fontSize: 12, color: cores.primaria },
});
