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

export type ValueWrapperOptions = WrapperOptions & {
  nullAsFailure?: boolean;
  undefinedAsFailure?: boolean;
  emptyStringAsFailure?: boolean;
  zeroAsFailure?: boolean;
  emptyArrayAsFailure?: boolean;
  emptyObjectAsFailure?: boolean;
  customValidation?: (value: any) => boolean | string;
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
 * Valida um valor baseado nas opções fornecidas
 * 
 * @param value Valor a ser validado
 * @param options Opções de validação
 * @returns true se válido, string com mensagem de erro se inválido
 */
const validateValue = (value: any, options: ValueWrapperOptions): boolean | string => {
  // Verificações básicas
  if (options.nullAsFailure && value === null) {
    return 'Value is null';
  }
  
  if (options.undefinedAsFailure && value === undefined) {
    return 'Value is undefined';
  }
  
  if (options.emptyStringAsFailure && value === '') {
    return 'Value is empty string';
  }
  
  if (options.zeroAsFailure && value === 0) {
    return 'Value is zero';
  }
  
  if (options.emptyArrayAsFailure && Array.isArray(value) && value.length === 0) {
    return 'Value is empty array';
  }
  
  if (options.emptyObjectAsFailure && 
      value !== null && 
      typeof value === 'object' && 
      !Array.isArray(value) && 
      Object.keys(value).length === 0) {
    return 'Value is empty object';
  }
  
  // Validação customizada
  if (options.customValidation) {
    const customResult = options.customValidation(value);
    if (customResult !== true) {
      return typeof customResult === 'string' ? customResult : 'Custom validation failed';
    }
  }
  
  return true;
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

/**
 * Envolve um valor já executado em um Result
 * Útil para transformar valores, erros, null, undefined em Results
 * 
 * @param value Valor a ser envolvido (pode ser qualquer coisa)
 * @param options Opções de configuração e validação
 * @returns Result<T>
 */
export const ResultWrapValue = <T>(
  value: T | Error | null | undefined,
  options: ValueWrapperOptions = {}
): Result<T> => {
  const {
    errorMappings = [],
    defaultFailureType = 'FAILURE',
    context,
    useCaseClass
  } = options;

  // Se o valor é um Error, retorna Failure
  if (value instanceof Error) {
    const mappedFailureType = mapErrorToFailureType(
      value,
      errorMappings,
      defaultFailureType
    );
    return Failure<T>(value, mappedFailureType, context, useCaseClass);
  }

  // Validar o valor
  const validationResult = validateValue(value, options);
  if (validationResult !== true) {
    const error = new Error(typeof validationResult === 'string' ? validationResult : 'Validation failed');
    const mappedFailureType = mapErrorToFailureType(
      error,
      errorMappings,
      defaultFailureType
    );
    return Failure<T>(error, mappedFailureType, context, useCaseClass);
  }

  return Success(value as T, context, useCaseClass);
};

/**
 * Envolve um valor/Promise já executado em um Result
 * Útil para transformar valores assíncronos, erros, null, undefined em Results
 * 
 * @param value Valor/Promise a ser envolvido
 * @param options Opções de configuração e validação
 * @returns Promise<Result<T>>
 */
export const ResultWrapValueAsync = async <T>(
  value: T | Promise<T> | Error | null | undefined,
  options: ValueWrapperOptions = {}
): Promise<Result<T>> => {
  const {
    errorMappings = [],
    defaultFailureType = 'FAILURE',
    context,
    useCaseClass
  } = options;

  try {
    // Se o valor é um Error, retorna Failure
    if (value instanceof Error) {
      const mappedFailureType = mapErrorToFailureType(
        value,
        errorMappings,
        defaultFailureType
      );
      return Failure<T>(value, mappedFailureType, context, useCaseClass);
    }

    // Resolve a Promise se necessário
    const resolvedValue = await Promise.resolve(value);

    // Validar o valor resolvido
    const validationResult = validateValue(resolvedValue, options);
    if (validationResult !== true) {
      const error = new Error(typeof validationResult === 'string' ? validationResult : 'Validation failed');
      const mappedFailureType = mapErrorToFailureType(
        error,
        errorMappings,
        defaultFailureType
      );
      return Failure<T>(error, mappedFailureType, context, useCaseClass);
    }

    return Success(resolvedValue as T, context, useCaseClass);
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

// Classe de erro para validação
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Classe de erro para autenticação
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Classe de erro para autorização
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Classe de erro para recursos não encontrados
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Classe de erro para conflitos de dados
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

