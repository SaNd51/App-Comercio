// Painel Admin: abas "Produtos" e "Pedidos". Só o admin chega aqui (e a API também exige o perfil).
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { AppStackParams } from '../navigation/tipos';
import { cores, fontes } from '../theme';
import { PedidosAdmin } from './admin/PedidosAdmin';
import { ProdutosAdmin } from './admin/ProdutosAdmin';

export function PainelAdminScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'PainelAdmin'>) {
  const insets = useSafeAreaInsets();
  const { sair } = useAuth();
  const [aba, setAba] = useState<'produtos' | 'pedidos'>('produtos');

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <View style={estilos.linhaTopo}>
          <Pressable onPress={() => navigation.navigate('Abas')} style={estilos.botaoIcone} accessibilityLabel="Ver a loja">
            <Ionicons name="storefront-outline" size={20} color={cores.texto} />
          </Pressable>
          <Text style={estilos.titulo}>Painel Admin</Text>
          <Pressable onPress={sair} style={estilos.botaoIcone} accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={20} color={cores.primaria} />
          </Pressable>
        </View>

        <View style={estilos.segmento}>
          {(['produtos', 'pedidos'] as const).map((id) => (
            <Pressable key={id} onPress={() => setAba(id)} style={[estilos.segmentoItem, aba === id && estilos.segmentoAtivo]} accessibilityRole="tab" accessibilityState={{ selected: aba === id }}>
              <Text style={[estilos.segmentoTexto, aba === id && { color: cores.primaria }]}>{id === 'produtos' ? 'Produtos' : 'Pedidos'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* As duas abas ficam montadas: trocar de aba não perde filtros nem rolagem. */}
      <View style={{ flex: 1, display: aba === 'produtos' ? 'flex' : 'none' }}>
        <ProdutosAdmin />
      </View>
      <View style={{ flex: 1, display: aba === 'pedidos' ? 'flex' : 'none' }}>
        <PedidosAdmin />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { backgroundColor: cores.superficie, paddingHorizontal: 20, paddingBottom: 12 },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  botaoIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  segmento: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: cores.campo },
  segmentoItem: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentoAtivo: { backgroundColor: cores.superficie },
  segmentoTexto: { fontFamily: fontes.bold, fontSize: 13, color: cores.textoMuted },
});
