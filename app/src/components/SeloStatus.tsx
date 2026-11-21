import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontes } from '../theme';
import { StatusPedido } from '../types';
import { CORES_STATUS, ROTULO_STATUS } from '../utils/pedido';

export function SeloStatus({ status }: { status: StatusPedido }) {
  const c = CORES_STATUS[status];
  return (
    <View style={[estilos.selo, { backgroundColor: c.fundo }]}>
      <Text style={[estilos.texto, { color: c.texto }]}>{ROTULO_STATUS[status]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  texto: { fontFamily: fontes.bold, fontSize: 11 },
});
