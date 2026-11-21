// Campo de preço com máscara: digite só números ("490" → R$ 4,90). Guarda CENTAVOS.
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { cores, fontes, raio } from '../theme';
import { centavosDeTexto, formatarPreco } from '../utils/formatar';

interface Props {
  rotulo: string;
  centavos: number;
  onChange: (centavos: number) => void;
  erro?: string;
}

export function CampoPreco({ rotulo, centavos, onChange, erro }: Props) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={[estilos.campo, !!erro && estilos.campoErro]}>
        <Text style={estilos.moeda}>R$</Text>
        <TextInput
          value={centavos > 0 ? formatarPreco(centavos) : ''}
          onChangeText={(t) => onChange(centavosDeTexto(t))}
          placeholder="0,00"
          placeholderTextColor={cores.placeholder}
          keyboardType="number-pad"
          style={estilos.input}
          accessibilityLabel={rotulo}
        />
      </View>
      {!!erro && <Text style={estilos.erro}>{erro}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: 16 },
  rotulo: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto, marginBottom: 6 },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 14, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: raio.campo },
  campoErro: { borderColor: cores.erro, backgroundColor: '#FFF5F5' },
  moeda: { fontFamily: fontes.semibold, fontSize: 14, color: cores.textoMuted },
  input: { flex: 1, fontFamily: fontes.bold, fontSize: 16, color: cores.texto },
  erro: { marginTop: 5, fontFamily: fontes.medium, fontSize: 12, color: cores.erro },
});
