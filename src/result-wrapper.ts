import { Result, Success, Failure } from './result';

export type ErrorMapping = {
  errorType: new (...args: any[]) => Error;
  failureType: string;
}[];

export type WrapperOptions = {
  errorMappings?: ErrorMapping;
  defaultFailureType?: string;
  context?: Record<string, any>;
  useCaseClass?: string;
};

/**
 * Mapeia um erro para um tipo de falha específico baseado nas configurações
 * 
 * @param error Erro capturado
 * @param errorMappings Mapeamentos de erro
 * @param defaultFailureType Tipo de falha padrão
 * @returns Tipo de falha mapeado
 */
const mapErrorToFailureType = (
  error: any,
  errorMappings: ErrorMapping,
  defaultFailureType: string
): string => {
  for (const mapping of errorMappings) {
    if (error instanceof mapping.errorType) {
      return mapping.failureType;
    }
  }
  return defaultFailureType;
};

/**
 * Envolve uma função síncrona em um Result
 * Suporta funções com ou sem parâmetros
 * 
 * @param fn Função a ser executada (com ou sem parâmetros)
 * @param paramsOrOptions Parâmetros da função ou opções de configuração
 * @param options Opções de configuração (quando parâmetros são fornecidos)
 * @returns Result<T>
 */
export const ResultWrapper = <T>(
  fn: (...args: any[]) => T,
  paramsOrOptions?: any[] | WrapperOptions,
  options?: WrapperOptions
): Result<T> => {
  let params: any[] = [];
  let config: WrapperOptions = {};

  // Detectar se o segundo parâmetro são parâmetros ou opções
  if (Array.isArray(paramsOrOptions)) {
    params = paramsOrOptions;
    config = options || {};
  } else {
    config = paramsOrOptions || {};
  }

  const {
    errorMappings = [],
    defaultFailureType = 'FAILURE',
    context,
    useCaseClass
  } = config;

  try {
    const result = fn(...params);
    return Success(result, context, useCaseClass);
  } catch (error) {
    const mappedFailureType = mapErrorToFailureType(
      error,
      errorMappings,
      defaultFailureType
    );
    
    const wrappedError = error instanceof Error 
      ? error 
      : new Error(String(error));

    return Failure<T>(wrappedError, mappedFailureType, context, useCaseClass);
  }
};

/**
 * Envolve uma função assíncrona em um Result
 * Suporta funções com ou sem parâmetros
 * 
 * @param fn Função assíncrona a ser executada (com ou sem parâmetros)
 * @param paramsOrOptions Parâmetros da função ou opções de configuração
 * @param options Opções de configuração (quando parâmetros são fornecidos)
 * @returns Promise<Result<T>>
 */
export const ResultAsyncWrapper = async <T>(
  fn: (...args: any[]) => Promise<T>,
  paramsOrOptions?: any[] | WrapperOptions,
  options?: WrapperOptions
): Promise<Result<T>> => {
  let params: any[] = [];
  let config: WrapperOptions = {};

  // Detectar se o segundo parâmetro são parâmetros ou opções
  if (Array.isArray(paramsOrOptions)) {
    params = paramsOrOptions;
    config = options || {};
  } else {
    config = paramsOrOptions || {};
  }

  const {
    errorMappings = [],
    defaultFailureType = 'FAILURE',
    context,
    useCaseClass
  } = config;

  try {
    const result = await fn(...params);
    return Success(result, context, useCaseClass);
  } catch (error) {
    const mappedFailureType = mapErrorToFailureType(
      error,
      errorMappings,
      defaultFailureType
    );
    
    const wrappedError = error instanceof Error 
      ? error 
      : new Error(String(error));

    return Failure<T>(wrappedError, mappedFailureType, context, useCaseClass);
  }
};

