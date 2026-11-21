// Atalhos fixos do Figma: Promoções, Da semana, Hortifruti e Mercearia.
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Categoria } from '../types';
import { cores, fontes, raio } from '../theme';

type Icone = React.ComponentProps<typeof Ionicons>['name'];

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const iconesCategoria: Record<string, Icone> = {
  acougue: 'restaurant-outline',
  bebidas: 'beer-outline',
  higiene: 'water-outline',
  hortifruti: 'leaf-outline',
  laticinios: 'cafe-outline',
  limpeza: 'sparkles-outline',
  mercearia: 'basket-outline',
  utilidades: 'home-outline',
};

interface Props {
  categorias: Categoria[];
  selecionada: string | null;
  onSelecionar: (id: string | null) => void;
  onPromocoes?: () => void;
  onDaSemana?: () => void;
}

export function AtalhosCategorias({ categorias, selecionada, onSelecionar, onPromocoes, onDaSemana }: Props) {
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const focada = useIsFocused();
  const atalhos: { chave: string; id: string; nome: string; icone: Icone }[] = [
    { chave: 'promocoes', id: '__promocoes', nome: 'Promoções', icone: 'pricetag-outline' },
    { chave: 'semana', id: '__semana', nome: 'Da semana', icone: 'calendar-outline' },
  ];
  const categoriasUnicas = [...new Map(categorias.map((categoria) => [categoria.id, categoria])).values()];
  const itens = [
    ...atalhos,
    ...categoriasUnicas.map((categoria) => ({
      chave: categoria.id,
      id: categoria.id,
      nome: categoria.nome,
      icone: iconesCategoria[normalizar(categoria.nome)] ?? 'pricetag-outline',
    })),
  ];

  useEffect(() => {
    if (focada) scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [focada]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.lista}
    >
      {itens.map((item) => {
        const ativo =
          item.id !== '__promocoes'
          && item.id !== '__semana'
          && item.id === selecionada;

        return (
          <Pressable
            key={item.chave}
            onPress={() => {
              if (item.id === '__promocoes') onPromocoes?.();
              else if (item.id === '__semana') onDaSemana?.();
              else if (item.id) onSelecionar(item.id);
            }}
            style={estilos.item}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`Categoria ${item.nome}`}
          >
            <View style={[estilos.circulo, ativo && estilos.circuloAtivo]}>
              <Ionicons name={item.icone} size={24} color={ativo ? cores.primaria : cores.texto} />
            </View>
            <Text style={[estilos.nome, ativo && { color: cores.primaria }]} numberOfLines={1}>
              {item.nome}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  lista: { minWidth: '100%', paddingHorizontal: 20, paddingVertical: 4, gap: 14, alignItems: 'flex-start' },
  item: { width: 66, alignItems: 'center' },
  circulo: { width: 52, height: 52, borderRadius: raio.atalho, backgroundColor: cores.atalho, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  circuloAtivo: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  nome: { marginTop: 8, fontFamily: fontes.semibold, fontSize: 11, color: cores.texto, textAlign: 'center' },
});
