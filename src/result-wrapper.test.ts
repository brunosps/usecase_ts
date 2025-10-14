import { 
  ResultWrapper,
  ResultAsyncWrapper,
} from './result-wrapper';

/**
 * Classe de erro personalizada para validação
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Classe de erro personalizada para autenticação
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Classe de erro personalizada para autorização
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Classe de erro personalizada para recursos não encontrados
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Classe de erro personalizada para conflitos
 */
export class ConflictError extends Error {
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
        errorMappings: [
          { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
        ]
      });
      
      expect(result.isFailure()).toBe(true);
      expect(result.getType()).toBe('VALIDATION_ERROR');
    });

    it('deve mapear ValidationError para VALIDATION_ERROR sem parâmetros', () => {
      const fn = () => {
        throw new ValidationError('Invalid input');
      };
      
      const result = ResultWrapper(fn, {
        errorMappings: [
          { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
        ]
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
        defaultFailureType: 'CUSTOM_ERROR'
      });
      
      expect(result.isFailure()).toBe(true);
      expect(result.getType()).toBe('CUSTOM_ERROR');
    });

    it('deve incluir context e useCaseClass sem parâmetros', () => {
      const fn = () => 'test';
      
      const result = ResultWrapper(fn, {
        context: { userId: '123' },
        useCaseClass: 'TestUseCase'
      });
      
      expect(result.isSuccess()).toBe(true);
      expect(result.context).toEqual({ userId: '123' });
      expect(result.useCaseClass).toBe('TestUseCase');
    });

    it('deve incluir context e useCaseClass com parâmetros', () => {
      const fn = (name: string) => `Hello ${name}`;
      
      const result = ResultWrapper(fn, ['World'], {
        context: { userId: '123' },
        useCaseClass: 'TestUseCase'
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
        errorMappings: [
          { errorType: AuthenticationError, failureType: 'AUTHENTICATION_ERROR' }
        ]
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
        errorMappings: [
          { errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' }
        ]
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
        { errorType: ConflictError, failureType: 'CONFLICT_ERROR' }
      ];

      // Teste ValidationError
      const validationFn = () => { throw new ValidationError('Invalid data'); };
      const validationResult = ResultWrapper(validationFn, { errorMappings });
      expect(validationResult.getType()).toBe('VALIDATION_ERROR');

      // Teste AuthenticationError
      const authFn = () => { throw new AuthenticationError('Invalid token'); };
      const authResult = ResultWrapper(authFn, { errorMappings });
      expect(authResult.getType()).toBe('AUTHENTICATION_ERROR');

      // Teste NotFoundError
      const notFoundFn = () => { throw new NotFoundError('Resource not found'); };
      const notFoundResult = ResultWrapper(notFoundFn, { errorMappings });
      expect(notFoundResult.getType()).toBe('NOT_FOUND_ERROR');

      // Teste erro não mapeado
      const genericFn = () => { throw new Error('Generic error'); };
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
      errorMappings: [
        { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
      ],
      useCaseClass: 'ValidateEmailUseCase'
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
        { errorType: NotFoundError, failureType: 'NOT_FOUND_ERROR' }
      ],
      context: { requestId: 'req-123' }
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('John Doe');
    expect(result.context).toEqual({ requestId: 'req-123' });
  });
});
