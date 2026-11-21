import { app } from './app';
import { env } from './env';
import { iniciarJobExpiracao } from './pedidoExpiracao.job';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API disponível na rede local na porta ${env.PORT}`);
  console.log(`Swagger em http://localhost:${env.PORT}/api/docs`);
});

iniciarJobExpiracao();
