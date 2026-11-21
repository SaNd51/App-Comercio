// Erro de negócio com código HTTP. Lançado nos services e tratado no middleware de erros.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
