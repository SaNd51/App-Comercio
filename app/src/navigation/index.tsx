// Navegação: sem sessão → pilha de login; com sessão → loja (abas).
// Redirecionamento pós-login: cliente → Início | admin → Painel Admin.
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { CarrinhoScreen } from '../screens/CarrinhoScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { ContaScreen } from '../screens/ContaScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PainelAdminScreen } from '../screens/PainelAdminScreen';
import { PedidosScreen } from '../screens/PedidosScreen';
import { ProdutoDetalheScreen } from '../screens/ProdutoDetalheScreen';
import { ProdutoFormScreen } from '../screens/ProdutoFormScreen';
import { RegistrarScreen } from '../screens/RegistrarScreen';
import { VitrineScreen } from '../screens/VitrineScreen';
import { EnderecosScreen } from '../screens/EnderecosScreen';
import { DadosPessoaisScreen } from '../screens/DadosPessoaisScreen';
import { PromocoesScreen } from '../screens/PromocoesScreen';
import { FavoritosScreen } from '../screens/FavoritosScreen';
import { PaginaTextoScreen } from '../screens/PaginaTextoScreen';
import { ContatoLocalizacaoScreen } from '../screens/ContatoLocalizacaoScreen';
import { cores, fontes } from '../theme';
import { AbaProps, AbasParams, AppStackParams, AuthStackParams } from './tipos';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const AppStack = createNativeStackNavigator<AppStackParams>();
const Tab = createBottomTabNavigator<AbasParams>();

type IconeNome = React.ComponentProps<typeof Ionicons>['name'];
const ICONES: Record<keyof AbasParams, IconeNome> = {
  Inicio: 'home-outline',
  Promocoes: 'pricetag-outline',
  Vitrine: 'bag-outline',
  Conta: 'person-outline',
};
const ROTULOS: Record<keyof AbasParams, string> = { Inicio: 'Início', Promocoes: 'Promoções', Vitrine: 'Vitrine', Conta: 'Conta' };

function Abas() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.navInativo,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.bordaNav,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
        },
        // Ícone dentro de uma "pílula" rosada quando a aba está ativa (como no Figma).
        tabBarIcon: ({ focused, color }) => (
          <View style={[estilos.pilula, focused && { backgroundColor: cores.primariaClara }]}>
            <Ionicons name={ICONES[route.name]} size={22} color={color} />
          </View>
        ),
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ fontSize: 11, color, fontFamily: focused ? fontes.bold : fontes.medium }}>{ROTULOS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen
        name="Promocoes"
        component={PromocoesScreen}
      />
      <Tab.Screen name="Vitrine" component={VitrineScreen} />
      <Tab.Screen name="Conta" component={ContaScreen} />
    </Tab.Navigator>
  );
}

export function Navegacao() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.splash}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {usuario ? (
        // key: ao trocar de usuário a pilha é recriada e o initialRouteName vale de novo.
        <AppStack.Navigator key={usuario.id} initialRouteName={usuario.role === 'admin' ? 'PainelAdmin' : 'Abas'} screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Abas" component={Abas} />
          <AppStack.Screen name="PainelAdmin" component={PainelAdminScreen} />
          <AppStack.Screen name="ProdutoDetalhe" component={ProdutoDetalheScreen} />
          <AppStack.Screen name="Carrinho" component={CarrinhoScreen} />
          <AppStack.Screen name="Checkout" component={CheckoutScreen} />
          <AppStack.Screen name="Pedidos" component={PedidosScreen} />
          <AppStack.Screen name="ProdutoForm" component={ProdutoFormScreen} />
          <AppStack.Screen name="Enderecos" component={EnderecosScreen} />
          <AppStack.Screen name="DadosPessoais" component={DadosPessoaisScreen} />
          <AppStack.Screen name="Favoritos" component={FavoritosScreen} />
          <AppStack.Screen name="PaginaTexto" component={PaginaTextoScreen} />
          <AppStack.Screen name="ContatoLocalizacao" component={ContatoLocalizacaoScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Registrar" component={RegistrarScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const estilos = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  pilula: { width: 55, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
