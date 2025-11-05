import { Context } from './context';
import { getDebugLogger } from './debug';
import { Failure, type Result, ResultPromise, Success } from './result';

export interface IUseCase<I, O> {
  execute(input?: I): Promise<Result<O>>;
}

// Classe base concreta que implementa a lógica comum
export class BaseUseCase<I, O> implements IUseCase<I, O> {
  // Método que deve ser sobrescrito
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(input?: I): Promise<Result<O>> {
    throw new Error('Method not implemented. Override this method in a subclass.');
  }

  /**
   * Executes the use case and returns a ResultPromise for chainable operations.
   *
   * @param params Input parameters for the use case
   * @returns ResultPromise<O>
   */
  call(params?: I): ResultPromise<O> {
    const resultPromise = new ResultPromise<O>(this._executeWithErrorHandling(params));
    return resultPromise;
  }

  /**
   * Internal method to execute the use case with error handling.
   * This is used by the call method to create a Promise<Result<O>>.
   */
  private async _executeWithErrorHandling(params?: I): Promise<Result<O>> {
    const debugLogger = getDebugLogger();
    const useCaseClass = this.constructor.name;

    // Start debug timing
    debugLogger.startTiming(useCaseClass, params);

    try {
      const result = await this.execute(params);

      if (result.isFailure()) {
        // Log failure
        debugLogger.logFailure(useCaseClass, result.getError(), result.getType(), result.context);

        return Failure(result.getError(), result.getType(), result.context, useCaseClass);
      }

      const successResult = Success(
        result.getValue(),
        {
          [useCaseClass]: new Context<I, O>(params as I, result.getValue()),
        },
        useCaseClass,
      );

      // Log success
      debugLogger.logSuccess(useCaseClass, result.getValue(), successResult.context);

      return successResult;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Log unexpected error
      debugLogger.logFailure(useCaseClass, errorObj, 'UNEXPECTED_ERROR', { rawError: error });

      return Failure(errorObj, 'UNEXPECTED_ERROR', { rawError: error }, useCaseClass);
    }
  }
}

// Classe abstrata para manter compatibilidade com código existente
export abstract class UseCase<I, O> extends BaseUseCase<I, O> {
  abstract execute(input?: I): Promise<Result<O>>;

  /**
   * Static method to create an instance of the use case and call it.
   * Returns a ResultPromise for chainable operations.
   *
   * @param params Input parameters for the use case
   * @returns ResultPromise<Y>
   */
  static call<X, Y>(params?: X): ResultPromise<Y> {
    // Verificar se está sendo chamado diretamente na classe abstrata
    if (this === UseCase) {
      return new ResultPromise(
        Promise.reject(new Error('Cannot call static method on abstract UseCase class')),
      );
    }

    // Usar type assertion para contornar a verificação de tipo
    const UseCaseClass = this as unknown as new () => UseCase<X, Y>;
    const instance = new UseCaseClass();
    return instance.call(params);
  }
}
