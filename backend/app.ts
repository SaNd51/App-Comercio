// Monta a aplicação Express (sem abrir porta — isso facilita os testes).
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';
import { openapi } from './openapi';
import { rotaNaoEncontrada, tratarErros } from './erros';
import { authRoutes } from './auth.routes';
import { categoriesRoutes } from './categories.routes';
import { productsRoutes } from './products.routes';
import { ordersRoutes } from './orders.routes';
import { bannersRoutes } from './banners.routes';
import { lojaRoutes } from './loja.routes';
import { addressesRoutes } from './addresses.routes';
import { cepRoutes } from './cep.routes';
import { favoritesRoutes } from './favorites.routes';

export const app = express();

const origens = env.CORS_ORIGINS.split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: origens.includes('*') ? true : origens }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/loja', lojaRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/favorites', favoritesRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);
