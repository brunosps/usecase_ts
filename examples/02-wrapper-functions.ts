/**
 * Exemplos completos dos ResultWrapper functions
 * Demonstra como transformar funções existentes em funções que retornam Results
 */

import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError, ValidationError } from '.';
import { 
  ResultWrapper, 
  ResultAsyncWrapper,
} from '../src';

// =============================================================================
// 1. RESULTwrapper - FUNÇÕES SÍNCRONAS
// =============================================================================

function syncWrapperExamples() {
  console.log('🔄 === RESULTWRAPPER - FUNÇÕES SÍNCRONAS ===\n');

  // Exemplo 1: Função sem parâmetros
  console.log('📝 Função sem parâmetros:');
  const getCurrentTime = () => new Date().toISOString();
  
  const timeResult = ResultWrapper(getCurrentTime);
  timeResult.onSuccess((time) => console.log('   ✅ Hora atual:', time));

  // Exemplo 2: Função com parâmetros
  console.log('\n📝 Função com parâmetros:');
  const addNumbers = (a: number, b: number) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new ValidationError('Parâmetros devem ser números');
    }
    return a + b;
  };

  const addResult = ResultWrapper(addNumbers, [5, 10], {
    errorMappings: [
      { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
    ]
  });

  addResult
    .onSuccess((sum) => console.log('   ✅ Soma:', sum))
    .onFailure((error) => console.log('   ❌ Erro:', error.message));

  // Exemplo 3: Função que lança erro
  console.log('\n📝 Função que lança erro:');
  const validateEmail = (email: string) => {
    if (!email) throw new ValidationError('Email é obrigatório');
    if (!email.includes('@')) throw new ValidationError('Email inválido');
    return { valid: true, email };
  };

  const emailResult = ResultWrapper(validateEmail, ['email-inválido'], {
    errorMappings: [
      { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
    ],
    context: { operation: 'email_validation' }
  });

  emailResult
    .onSuccess((result) => console.log('   ✅ Email válido:', result))
    .onFailure((error) => console.log('   ❌ Email inválido:', error.message), 'VALIDATION_ERROR');

  // Exemplo 4: Múltiplos tipos de erro
  console.log('\n📝 Múltiplos tipos de erro:');
  const complexValidation = (data: any) => {
    if (!data) throw new ValidationError('Dados obrigatórios');
    if (!data.token) throw new AuthenticationError('Token necessário');
    if (data.role !== 'admin') throw new AuthorizationError('Acesso negado');
    if (data.id === 'duplicate') throw new ConflictError('ID já existe');
    return { validated: true, data };
  };

  const errorMappings = [
    { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
    { errorType: AuthenticationError, failureType: 'AUTH_ERROR' },
    { errorType: AuthorizationError, failureType: 'AUTHORIZATION_ERROR' },
    { errorType: ConflictError, failureType: 'CONFLICT_ERROR' }
  ];

  // Teste diferentes cenários
  const testCases = [
    { name: 'Dados válidos', data: { token: 'abc', role: 'admin', id: 'unique' } },
    { name: 'Dados ausentes', data: null },
    { name: 'Token ausente', data: { role: 'admin' } },
    { name: 'Não autorizado', data: { token: 'abc', role: 'user' } },
    { name: 'ID duplicado', data: { token: 'abc', role: 'admin', id: 'duplicate' } }
  ];

  testCases.forEach(testCase => {
    console.log(`\n   🔍 Testando: ${testCase.name}`);
    const result = ResultWrapper(complexValidation, [testCase.data], { errorMappings });
    
    result
      .onSuccess((data) => console.log('     ✅ Validação bem-sucedida'))
      .onFailure((error) => console.log(`     ❌ Validação: ${error.message}`), 'VALIDATION_ERROR')
      .onFailure((error) => console.log(`     ❌ Autenticação: ${error.message}`), 'AUTH_ERROR')
      .onFailure((error) => console.log(`     ❌ Autorização: ${error.message}`), 'AUTHORIZATION_ERROR')
      .onFailure((error) => console.log(`     ❌ Conflito: ${error.message}`), 'CONFLICT_ERROR')
      .onFailure((error) => console.log(`     ❌ Erro genérico: ${error.message}`));
  });
}

// =============================================================================
// 2. RESULTASYNCWRAPPER - FUNÇÕES ASSÍNCRONAS
// =============================================================================

async function asyncWrapperExamples() {
  console.log('\n\n🔄 === RESULTASYNCWRAPPER - FUNÇÕES ASSÍNCRONAS ===\n');

  // Exemplo 1: Função async sem parâmetros
  console.log('📝 Função async sem parâmetros:');
  const getServerStatus = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'online', uptime: 3600 };
  };

  const statusResult = await ResultAsyncWrapper(getServerStatus);
  statusResult.onSuccess((status) => console.log('   ✅ Status do servidor:', status));

  // Exemplo 2: Simulação de API call
  console.log('\n📝 Simulação de API call:');
  const fetchUser = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (id === 'invalid') throw new ValidationError('ID inválido');
    if (id === 'unauthorized') throw new AuthenticationError('Token expirado');
    if (id === 'notfound') throw new NotFoundError('Usuário não encontrado');
    
    return { id, name: 'João Silva', email: 'joao@exemplo.com' };
  };

  const errorMappings = [
    { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
    { errorType: AuthenticationError, failureType: 'AUTH_ERROR' },
    { errorType: NotFoundError, failureType: 'NOT_FOUND' }
  ];

  // Teste usuário válido
  const userResult = await ResultAsyncWrapper(fetchUser, ['123'], {
    errorMappings,
    context: { operation: 'fetch_user', userId: '123' }
  });

  userResult
    .onSuccess((user) => console.log('   ✅ Usuário encontrado:', user))
    .onFailure((error) => console.log('   ❌ Erro:', error.message));

  // Teste usuário não encontrado
  const notFoundResult = await ResultAsyncWrapper(fetchUser, ['notfound'], { errorMappings });
  notFoundResult
    .onSuccess((user) => console.log('   ✅ Usuário:', user))
    .onFailure((error) => console.log('   ❌ Usuário não encontrado'), 'NOT_FOUND');

  // Exemplo 3: Promise que pode rejeitar
  console.log('\n📝 Promise que pode rejeitar:');
  const riskyAsyncOperation = async (shouldFail: boolean) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (shouldFail) {
      throw new Error('Operação falhou');
    }
    
    return { success: true, data: 'Operação concluída' };
  };

  const successResult = await ResultAsyncWrapper(riskyAsyncOperation, [false]);
  successResult.onSuccess((data) => console.log('   ✅ Sucesso:', data));

  const failureResult = await ResultAsyncWrapper(riskyAsyncOperation, [true], {
    defaultFailureType: 'OPERATION_FAILED'
  });
  failureResult.onFailure((error) => console.log('   ❌ Falha:', error.message));
}

// =============================================================================
// 3. INTEGRAÇÃO COM BIBLIOTECAS EXTERNAS
// =============================================================================

async function libraryIntegrationExamples() {
  console.log('\n\n🔄 === INTEGRAÇÃO COM BIBLIOTECAS ===\n');

  // Exemplo 1: JSON.parse wrapper
  console.log('📝 JSON.parse wrapper:');
  const safeJsonParse = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ValidationError('JSON inválido');
    }
  };

  const validJsonResult = ResultWrapper(safeJsonParse, ['{"name": "João"}'], {
    errorMappings: [{ errorType: ValidationError, failureType: 'JSON_ERROR' }]
  });

  const invalidJsonResult = ResultWrapper(safeJsonParse, ['invalid json'], {
    errorMappings: [{ errorType: ValidationError, failureType: 'JSON_ERROR' }]
  });

  validJsonResult.onSuccess((data) => console.log('   ✅ JSON válido:', data));
  invalidJsonResult.onFailure((error) => console.log('   ❌ JSON inválido'), 'JSON_ERROR');

  // Exemplo 2: Database operation wrapper
  console.log('\n📝 Simulação de operação de banco:');
  const dbOperation = async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (query.includes('DROP')) {
      throw new AuthorizationError('Operação não permitida');
    }
    if (query.includes('INVALID')) {
      throw new ValidationError('Query inválida');
    }
    
    return { rows: [{ id: 1, name: 'Resultado' }], count: 1 };
  };

  const queries = [
    'SELECT * FROM users',
    'DROP TABLE users',
    'INVALID QUERY'
  ];

  for (const query of queries) {
    console.log(`\n   🔍 Executando: ${query}`);
    const result = await ResultAsyncWrapper(dbOperation, [query], {
      errorMappings: [
        { errorType: ValidationError, failureType: 'QUERY_ERROR' },
        { errorType: AuthorizationError, failureType: 'PERMISSION_ERROR' }
      ]
    });

    result
      .onSuccess((data) => console.log('     ✅ Query executada:', data))
      .onFailure((error) => console.log('     ❌ Query inválida'), 'QUERY_ERROR')
      .onFailure((error) => console.log('     ❌ Sem permissão'), 'PERMISSION_ERROR');
  }
}

// =============================================================================
// 4. PATTERNS AVANÇADOS
// =============================================================================

async function advancedPatternsExamples() {
  console.log('\n\n🔄 === PATTERNS AVANÇADOS ===\n');

  // Exemplo 1: Wrapper factory
  console.log('📝 Wrapper factory pattern:');
  
  const createSafeWrapper = <T extends any[], R>(
    fn: (...args: T) => R,
    errorMappings: Array<{ errorType: new (...args: any[]) => Error; failureType: string }> = []
  ) => {
    return (...args: T) => ResultWrapper(fn, args, { errorMappings });
  };

  const safeDivide = createSafeWrapper(
    (a: number, b: number) => {
      if (b === 0) throw new ValidationError('Divisão por zero');
      return a / b;
    },
    [{ errorType: ValidationError, failureType: 'MATH_ERROR' }]
  );

  const divisionResult = safeDivide(10, 2);
  divisionResult.onSuccess((result) => console.log('   ✅ Divisão:', result));

  const zeroDivisionResult = safeDivide(10, 0);
  zeroDivisionResult.onFailure((error) => console.log('   ❌ Erro matemático'), 'MATH_ERROR');

  // Exemplo 2: Chain de wrappers
  console.log('\n📝 Chain de operações:');
  
  const step1 = (input: string) => {
    if (!input) throw new ValidationError('Input obrigatório');
    return input.toUpperCase();
  };

  const step2 = async (input: string) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    if (input.length < 3) throw new ValidationError('Input muito curto');
    return `Processado: ${input}`;
  };

  const step3 = (input: string) => {
    return { final: input, timestamp: new Date() };
  };

  // Executar pipeline
  const pipelineResult = ResultWrapper(step1, ['test'], {
    errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }]
  });

  if (pipelineResult.isSuccess()) {
    const step2Result = await ResultAsyncWrapper(step2, [pipelineResult.getValue()], {
      errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }]
    });

    if (step2Result.isSuccess()) {
      const finalResult = ResultWrapper(step3, [step2Result.getValue()]);
      finalResult.onSuccess((data) => console.log('   ✅ Pipeline completo:', data));
    } else {
      step2Result.onFailure((error) => console.log('   ❌ Falha no step 2:', error.message));
    }
  } else {
    pipelineResult.onFailure((error) => console.log('   ❌ Falha no step 1:', error.message));
  }
}

// =============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// =============================================================================

async function runWrapperExamples() {
  console.log('🚀 Exemplos Completos dos ResultWrapper Functions\n');
  
  syncWrapperExamples();
  await asyncWrapperExamples();
  await libraryIntegrationExamples();
  await advancedPatternsExamples();
  
  console.log('\n✨ Exemplos de wrappers concluídos!\n');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runWrapperExamples().catch(console.error);
}

export { runWrapperExamples };