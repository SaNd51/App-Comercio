// Chips de filtro com rolagem horizontal (categoria, status...).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { cores, fontes } from '../theme';

interface Opcao<T> {
  valor: T;
  rotulo: string;
}
interface Props<T> {
  opcoes: Opcao<T>[];
  valor: T;
  onChange: (valor: T) => void;
}

export function ChipsFiltro<T extends string | null>({ opcoes, valor, onChange }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.filtroScroll}
      contentContainerStyle={estilos.filtroItens}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={String(o.valor)}
            onPress={() => onChange(o.valor)}
            style={[estilos.filtroItem, ativo && estilos.filtroItemAtivo]}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
          >
            <Text style={[estilos.texto, ativo && estilos.textoAtivo]}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  filtroScroll: {
    width: '100%',
    height: 42,
    flexGrow: 0,
    flexShrink: 0,
  },
  filtroItens: {
    minHeight: 42,
    paddingHorizontal: 20,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtroItem: {
    height: 34,
    marginRight: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.bordaCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtroItemAtivo: {
    backgroundColor: cores.primariaClara,
    borderColor: cores.primaria,
  },
  texto: { fontFamily: fontes.semibold, fontSize: 12, color: cores.textoMuted },
  textoAtivo: { color: cores.primaria },
});
