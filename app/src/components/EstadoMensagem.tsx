// Estados de tela: lista vazia e erro (com botão "Tentar de novo").
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, fontes, raio } from '../theme';

type Icone = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  icone: Icone;
  titulo: string;
  texto?: string;
  acao?: { rotulo: string; onPress: () => void };
}

export function EstadoMensagem({ icone, titulo, texto, acao }: Props) {
  return (
    <View style={estilos.caixa}>
      <View style={estilos.circulo}>
        <Ionicons name={icone} size={28} color={cores.texto} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      {!!texto && <Text style={estilos.texto}>{texto}</Text>}
      {acao && (
        <Pressable onPress={acao.onPress} style={estilos.botao} accessibilityRole="button">
          <Text style={estilos.botaoTexto}>{acao.rotulo}</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  circulo: { width: 60, height: 60, borderRadius: 20, backgroundColor: cores.atalho, alignItems: 'center', justifyContent: 'center' },
  titulo: { marginTop: 16, fontFamily: fontes.bold, fontSize: 16, color: cores.texto, textAlign: 'center' },
  texto: { marginTop: 6, fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave, textAlign: 'center' },
  botao: { marginTop: 18, paddingHorizontal: 22, height: 42, borderRadius: raio.campo, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontFamily: fontes.bold, fontSize: 13 },
});
