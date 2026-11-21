import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParams = { Login: undefined; Registrar: undefined };
export type AbasParams = { Inicio: undefined; Promocoes: undefined; Vitrine: undefined; Conta: undefined };
export type AppStackParams = { Abas: NavigatorScreenParams<AbasParams> | undefined; PainelAdmin: undefined };
