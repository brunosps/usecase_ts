import {
  ResultWrapper,
  ResultAsyncWrapper,
  ResultWrapValue,
  ResultWrapValueAsync,
} from './result-wrapper'; /**
 * Classe de erro personalizada para validação
 */
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Classe de erro personalizada para autenticação
 */
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Classe de erro personalizada para autorização
 */
class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Classe de erro personalizada para recursos não encontrados
 */
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Classe de erro personalizada para conflitos
 */
class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

describe('ResultWrapper', () => {
  describe('ResultWrapper - função síncrona', () => {
    it('deve retornar Success quando função sem parâmetros executa com sucesso', () => {
      const fn = () => 'Hello World';

      const result = ResultWrapper(fn);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe('Hello World');
      expect(result.getType()).toBe('SUCCESS');
    });

    it('deve retornar Success quando função com parâmetros executa com sucesso', () => {
      const fn = (a: number, b: number) => a + b;

      const result = ResultWrapper(fn, [5, 3]);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(8);
    });

    it('deve retornar Failure quando função sem parâmetros lança erro', () => {
      const fn = () => {
        throw new Error('Test error');
      };

      const result = ResultWrapper(fn);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Test error');
      expect(result.getType()).toBe('FAILURE');
    });

    it('deve retornar Failure quando função com parâmetros lança erro', () => {
      const fn = (value: string) => {
        if (!value) {
          throw new ValidationError('Value is required');
        }
        return value.toUpperCase();
      };

      const result = ResultWrapper(fn, [''], {
        errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }],
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getType()).toBe('VALIDATION_ERROR');
    });

    it('deve mapear ValidationError para VALIDATION_ERROR sem parâmetros', () => {
      const fn = () => {
        throw new ValidationError('Invalid input');
      };

      const result = ResultWrapper(fn, {
        errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }],
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Invalid input');
      expect(result.getType()).toBe('VALIDATION_ERROR');
    });

    it('deve usar defaultFailureType personalizado', () => {
      const fn = () => {
        throw new Error('Test error');
      };

      const result = ResultWrapper(fn, {
        defaultFailureType: 'CUSTOM_ERROR',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getType()).toBe('CUSTOM_ERROR');
    });

    it('deve incluir context e useCaseClass sem parâmetros', () => {
      const fn = () => 'test';

      const result = ResultWrapper(fn, {
        context: { userId: '123' },
        useCaseClass: 'TestUseCase',
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.context).toEqual({ userId: '123' });
      expect(result.useCaseClass).toBe('TestUseCase');
    });

    it('deve incluir context e useCaseClass com parâmetros', () => {
      const fn = (name: string) => `Hello ${name}`;

      const result = ResultWrapper(fn, ['World'], {
        context: { userId: '123' },
        useCaseClass: 'TestUseCase',
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe('Hello World');
      expect(result.context).toEqual({ userId: '123' });
      expect(result.useCaseClass).toBe('TestUseCase');
    });
  });

  describe('ResultAsyncWrapper - função assíncrona', () => {
    it('deve retornar Success quando função assíncrona sem parâmetros executa com sucesso', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'Async result';
      };

      const result = await ResultAsyncWrapper(fn);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe('Async result');
      expect(result.getType()).toBe('SUCCESS');
    });

    it('deve retornar Success quando função assíncrona com parâmetros executa com sucesso', async () => {
      const fn = async (name: string, age: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { name, age, id: Math.random() };
      };

      const result = await ResultAsyncWrapper(fn, ['John', 30]);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().name).toBe('John');
      expect(result.getValue().age).toBe(30);
    });

    it('deve retornar Failure quando função assíncrona sem parâmetros lança erro', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new AuthenticationError('Invalid credentials');
      };

      const result = await ResultAsyncWrapper(fn, {
        errorMappings: [{ errorType: AuthenticationError, failureType: 'AUTHENTICATION_ERROR' }],
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Invalid credentials');
      expect(result.getType()).toBe('AUTHENTICATION_ERROR');
    });

    it('deve retornar Failure quando função assíncrona com parâmetros lança erro', async () => {
      const fn = async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        if (id === 'notfound') {
          throw new NotFoundError('User not found');
        }
        return { id, name: 'User' };
      };

      const result = await ResultAsyncWrapper(fn, ['notfound'], {
        errorMappings: [{ errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' }],
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getType()).toBe('NOT_FOUND_ERROR');
    });
  });

  describe('múltiplos mapeamentos de erro', () => {
    it('deve mapear diferentes tipos de erro corretamente', () => {
      const errorMappings = [
        { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
        { errorType: AuthenticationError, failureType: 'AUTHENTICATION_ERROR' },
        { errorType: AuthorizationError, failureType: 'AUTHORIZATION_ERROR' },
        { errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' },
        { errorType: ConflictError, failureType: 'CONFLICT_ERROR' },
      ];

      // Teste ValidationError
      const validationFn = () => {
        throw new ValidationError('Invalid data');
      };
      const validationResult = ResultWrapper(validationFn, { errorMappings });
      expect(validationResult.getType()).toBe('VALIDATION_ERROR');

      // Teste AuthenticationError
      const authFn = () => {
        throw new AuthenticationError('Invalid token');
      };
      const authResult = ResultWrapper(authFn, { errorMappings });
      expect(authResult.getType()).toBe('AUTHENTICATION_ERROR');

      // Teste NotFoundError
      const notFoundFn = () => {
        throw new NotFoundError('Resource not found');
      };
      const notFoundResult = ResultWrapper(notFoundFn, { errorMappings });
      expect(notFoundResult.getType()).toBe('NOT_FOUND_ERROR');

      // Teste erro não mapeado
      const genericFn = () => {
        throw new Error('Generic error');
      };
      const genericResult = ResultWrapper(genericFn, { errorMappings });
      expect(genericResult.getType()).toBe('FAILURE');
    });
  });

  describe('tratamento de não-Error', () => {
    it('deve converter string lançada em Error', () => {
      const fn = () => {
        throw 'String error';
      };

      const result = ResultWrapper(fn);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('String error');
    });

    it('deve converter objeto lançado em Error', () => {
      const fn = () => {
        throw { message: 'Object error', code: 500 };
      };

      const result = ResultWrapper(fn);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('[object Object]');
    });
  });
});

// Exemplo de uso prático
describe('Exemplos práticos de uso', () => {
  it('exemplo com função de validação', () => {
    const validateEmail = (email: string): boolean => {
      if (!email) {
        throw new ValidationError('Email is required');
      }
      if (!email.includes('@')) {
        throw new ValidationError('Invalid email format');
      }
      return true;
    };

    const result = ResultWrapper(validateEmail, ['invalid-email'], {
      errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }],
      useCaseClass: 'ValidateEmailUseCase',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getType()).toBe('VALIDATION_ERROR');
    expect(result.useCaseClass).toBe('ValidateEmailUseCase');
  });

  it('exemplo com API call', async () => {
    const fetchUser = async (id: string) => {
      // Simula chamada de API
      await new Promise(resolve => setTimeout(resolve, 10));

      if (id === 'unauthorized') {
        throw new AuthenticationError('Token expired');
      }
      if (id === 'notfound') {
        throw new NotFoundError('User not found');
      }

      return { id, name: 'John Doe', email: 'john@example.com' };
    };

    const result = await ResultAsyncWrapper(fetchUser, ['123'], {
      errorMappings: [
        { errorType: AuthenticationError, failureType: 'AUTHENTICATION_ERROR' },
        { errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' },
      ],
      context: { requestId: 'req-123' },
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('John Doe');
    expect(result.context).toEqual({ requestId: 'req-123' });
  });
});

describe('ResultWrapValue - envolver valores já executados', () => {
  it('deve retornar Success para valor válido', () => {
    const value = 'Hello World';

    const result = ResultWrapValue(value);

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe('Hello World');
    expect(result.getType()).toBe('SUCCESS');
  });

  it('deve retornar Failure para erro', () => {
    const error = new ValidationError('Validation failed');

    const result = ResultWrapValue(error, {
      errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }],
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Validation failed');
    expect(result.getType()).toBe('VALIDATION_ERROR');
  });

  it('deve retornar Failure para null quando nullAsFailure é true', () => {
    const result = ResultWrapValue(null, {
      nullAsFailure: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is null');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve retornar Failure para undefined quando undefinedAsFailure é true', () => {
    const result = ResultWrapValue(undefined, {
      undefinedAsFailure: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is undefined');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve retornar Failure para string vazia quando emptyStringAsFailure é true', () => {
    const result = ResultWrapValue('', {
      emptyStringAsFailure: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is empty string');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve retornar Failure para zero quando zeroAsFailure é true', () => {
    const result = ResultWrapValue(0, {
      zeroAsFailure: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is zero');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve retornar Failure para array vazio quando emptyArrayAsFailure é true', () => {
    const result = ResultWrapValue([], {
      emptyArrayAsFailure: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is empty array');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve retornar Failure para objeto vazio quando emptyObjectAsFailure é true', () => {
    const result = ResultWrapValue(
      {},
      {
        emptyObjectAsFailure: true,
      },
    );

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is empty object');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve usar validação customizada', () => {
    const result = ResultWrapValue(5, {
      customValidation: value => {
        if (value < 10) {
          return 'Value must be at least 10';
        }
        return true;
      },
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value must be at least 10');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve incluir context e useCaseClass', () => {
    const result = ResultWrapValue('test', {
      context: { userId: '123' },
      useCaseClass: 'TestUseCase',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.context).toEqual({ userId: '123' });
    expect(result.useCaseClass).toBe('TestUseCase');
  });
});

describe('ResultWrapValueAsync - envolver valores/promises já executados', () => {
  it('deve retornar Success para valor válido', async () => {
    const value = 'Hello World';

    const result = await ResultWrapValueAsync(value);

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe('Hello World');
    expect(result.getType()).toBe('SUCCESS');
  });

  it('deve retornar Success para Promise resolvida', async () => {
    const promise = Promise.resolve({ name: 'John', age: 30 });

    const result = await ResultWrapValueAsync(promise);

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('John');
    expect(result.getValue().age).toBe(30);
  });

  it('deve retornar Failure para Promise rejeitada', async () => {
    const promise = Promise.reject(new AuthenticationError('Token expired'));

    const result = await ResultWrapValueAsync(promise, {
      errorMappings: [{ errorType: AuthenticationError, failureType: 'AUTHENTICATION_ERROR' }],
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Token expired');
    expect(result.getType()).toBe('AUTHENTICATION_ERROR');
  });

  it('deve retornar Failure para erro direto', async () => {
    const error = new NotFoundError('Resource not found');

    const result = await ResultWrapValueAsync(error, {
      errorMappings: [{ errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' }],
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Resource not found');
    expect(result.getType()).toBe('NOT_FOUND_ERROR');
  });

  it('deve aplicar validações após resolver Promise', async () => {
    const promise = Promise.resolve(null);

    const result = await ResultWrapValueAsync(promise, {
      nullAsFailure: true,
      defaultFailureType: 'NULL_VALUE_ERROR',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value is null');
    expect(result.getType()).toBe('NULL_VALUE_ERROR');
  });

  it('deve usar validação customizada com Promise', async () => {
    const promise = Promise.resolve(3);

    const result = await ResultWrapValueAsync(promise, {
      customValidation: value => {
        if (value < 5) {
          return 'Value must be at least 5';
        }
        return true;
      },
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('Value must be at least 5');
    expect(result.getType()).toBe('FAILURE');
  });

  it('deve incluir context e useCaseClass', async () => {
    const promise = Promise.resolve('test');

    const result = await ResultWrapValueAsync(promise, {
      context: { requestId: 'req-456' },
      useCaseClass: 'AsyncTestUseCase',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.context).toEqual({ requestId: 'req-456' });
    expect(result.useCaseClass).toBe('AsyncTestUseCase');
  });
});

// Exemplos práticos com as novas funcionalidades
describe('Exemplos práticos com ResultWrapValue', () => {
  it('exemplo com resultado de API já executado', () => {
    // Simula que você já executou uma API call e tem o resultado
    const apiResponse = { id: 1, name: 'John', email: 'john@example.com' };

    const result = ResultWrapValue(apiResponse, {
      customValidation: user => {
        if (!user.email || !user.email.includes('@')) {
          return 'Invalid email format';
        }
        if (!user.name || user.name.length < 2) {
          return 'Name must have at least 2 characters';
        }
        return true;
      },
      context: { source: 'api_call' },
      useCaseClass: 'ValidateUserResponse',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('John');
    expect(result.context).toEqual({ source: 'api_call' });
  });

  it('exemplo com erro capturado de try/catch', () => {
    let capturedError: Error | null = null;

    try {
      JSON.parse('invalid json');
    } catch (error) {
      capturedError = error as Error;
    }

    const result = ResultWrapValue(capturedError, {
      defaultFailureType: 'JSON_PARSE_ERROR',
      context: { operation: 'parse_config' },
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getType()).toBe('JSON_PARSE_ERROR');
    expect(result.context).toEqual({ operation: 'parse_config' });
  });

  it('exemplo com valor que pode ser null', () => {
    const findUserById = (id: string) => {
      const users = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];
      return users.find(u => u.id === id) || null;
    };

    const user = findUserById('999'); // retorna null

    const result = ResultWrapValue(user, {
      nullAsFailure: true,
      defaultFailureType: 'USER_NOT_FOUND',
      context: { searchId: '999' },
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getType()).toBe('USER_NOT_FOUND');
    expect(result.getError().message).toBe('Value is null');
  });

  it('exemplo com combinação de validações', async () => {
    const processData = async (data: any) => {
      // Simula processamento que pode retornar dados ou null
      if (!data || !data.valid) return null;
      return { processed: true, value: data.value * 2 };
    };

    const rawData = { valid: false, value: 10 };
    const processedData = await processData(rawData);

    const result = await ResultWrapValueAsync(processedData, {
      nullAsFailure: true,
      undefinedAsFailure: true,
      customValidation: value => {
        if (value && typeof value.value !== 'number') {
          return 'Processed value must be a number';
        }
        return true;
      },
      defaultFailureType: 'PROCESSING_ERROR',
      context: { originalData: rawData },
      useCaseClass: 'DataProcessingUseCase',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getType()).toBe('PROCESSING_ERROR');
    expect(result.getError().message).toBe('Value is null');
    expect(result.context).toEqual({ originalData: rawData });
  });
});
