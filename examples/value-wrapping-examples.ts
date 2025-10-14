/**
 * Exemplos práticos de como usar ResultWrapValue e ResultWrapValueAsync
 * para envolver valores já executados em Results
 */
import { ValidationError } from '.';

import { 
  ResultWrapValue, 
  ResultWrapValueAsync, 
} from '../src';

// Exemplo 1: Validando resposta de API já executada
async function apiResponseExample() {
  console.log('=== Exemplo 1: Validação de resposta da API ===\n');
  
  // Simula uma resposta de API que já foi executada
  const apiResponse = {
    id: 1,
    name: 'João Silva',
    email: 'joao@exemplo.com',
    active: true
  };

  const result = ResultWrapValue(apiResponse, {
    customValidation: (user) => {
      if (!user.id) return 'ID é obrigatório';
      if (!user.name || user.name.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
      if (!user.email?.includes('@')) return 'Email inválido';
      if (!user.active) return 'Usuário deve estar ativo';
      return true;
    },
    context: { source: 'api_users', timestamp: new Date() },
    useCaseClass: 'ValidateUserResponse'
  });

  result
    .onSuccess((user) => {
      console.log('✅ Usuário válido:', user);
      console.log('📊 Contexto:', result.context);
    })
    .onFailure((error) => {
      console.log('❌ Erro de validação:', error.message);
    });
}

// Exemplo 2: Tratando erro capturado de try/catch
function errorHandlingExample() {
  console.log('\n=== Exemplo 2: Tratamento de erro capturado ===\n');
  
  let capturedError: Error | null = null;
  let jsonData: any = null;

  // Simula um try/catch que já foi executado
  try {
    jsonData = JSON.parse('{"invalid": json}'); // JSON inválido
  } catch (error) {
    capturedError = error as Error;
  }

  // Se houve erro, wrap o erro
  if (capturedError) {
    const errorResult = ResultWrapValue(capturedError, {
      defaultFailureType: 'JSON_PARSE_ERROR',
      context: { operation: 'parse_config', input: '{"invalid": json}' }
    });

    errorResult.onFailure((error) => {
      console.log('❌ Erro ao parsear JSON:', error.message);
      console.log('🔍 Tipo:', errorResult.getType());
      console.log('📊 Contexto:', errorResult.context);
    });
  } else {
    // Se deu certo, wrap o valor
    const successResult = ResultWrapValue(jsonData);
    successResult.onSuccess((data) => {
      console.log('✅ JSON parseado com sucesso:', data);
    });
  }
}

// Exemplo 3: Validando retorno que pode ser null
function nullableValueExample() {
  console.log('\n=== Exemplo 3: Valor que pode ser null ===\n');

  // Simula busca no banco que pode retornar null
  const findUserById = (id: string) => {
    const users = [
      { id: '1', name: 'João' },
      { id: '2', name: 'Maria' }
    ];
    return users.find(u => u.id === id) || null;
  };

  // Busca usuário que não existe
  const user = findUserById('999');

  const result = ResultWrapValue(user, {
    nullAsFailure: true,
    defaultFailureType: 'USER_NOT_FOUND',
    context: { searchId: '999', operation: 'find_user' }
  });

  result
    .onSuccess((foundUser) => {
      console.log('✅ Usuário encontrado:', foundUser);
    })
    .onFailure((error) => {
      console.log('❌ Usuário não encontrado');
      console.log('🔍 Tipo:', result.getType());
      console.log('📊 Contexto:', result.context);
    });

  // Busca usuário que existe
  const existingUser = findUserById('1');
  const successResult = ResultWrapValue(existingUser, {
    nullAsFailure: true
  });

  successResult.onSuccess((foundUser) => {
    console.log('✅ Usuário existente encontrado:', foundUser);
  });
}

// Exemplo 4: Validações complexas com Promise
async function promiseWrappingExample() {
  console.log('\n=== Exemplo 4: Wrapping de Promise com validações ===\n');

  // Simula processamento assíncrono
  const processUserData = async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simula delay
    
    if (userId === 'invalid') {
      throw new ValidationError('ID inválido');
    }
    
    if (userId === 'not-found') {
      return null; // Usuário não encontrado
    }
    
    return {
      id: userId,
      name: 'Usuário Processado',
      email: 'user@example.com',
      score: 85
    };
  };

  // Teste 1: Usuário válido
  try {
    const userPromise = processUserData('123');
    
    const result = await ResultWrapValueAsync(userPromise, {
      nullAsFailure: true,
      customValidation: (user) => {
        if (!user.email?.includes('@')) return 'Email inválido';
        if (user.score < 50) return 'Score muito baixo';
        return true;
      },
      context: { operation: 'process_user', userId: '123' }
    });

    result
      .onSuccess((user) => {
        console.log('✅ Usuário processado com sucesso:', user);
        if (user && 'score' in user) {
          console.log('📊 Score:', user.score);
        }
      })
      .onFailure((error) => {
        console.log('❌ Falha no processamento:', error.message);
      });
  } catch (error) {
    console.log('❌ Erro inesperado:', error);
  }

  // Teste 2: Usuário não encontrado
  try {
    const notFoundPromise = processUserData('not-found');
    
    const result = await ResultWrapValueAsync(notFoundPromise, {
      nullAsFailure: true,
      defaultFailureType: 'USER_NOT_FOUND'
    });

    result.onFailure((error) => {
      console.log('❌ Usuário não encontrado (via Promise)');
      console.log('🔍 Tipo:', result.getType());
    });
  } catch (error) {
    console.log('❌ Erro inesperado:', error);
  }

  // Teste 3: ID inválido (Promise rejeitada)
  try {
    const invalidPromise = processUserData('invalid');
    
    const result = await ResultWrapValueAsync(invalidPromise, {
      errorMappings: [
        { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
      ]
    });

    result.onFailure((error) => {
      console.log('❌ Erro de validação via Promise:', error.message);
      console.log('🔍 Tipo:', result.getType());
    });
  } catch (error) {
    console.log('❌ Erro inesperado:', error);
  }
}

// Exemplo 5: Pipeline de dados com validações
async function dataPipelineExample() {
  console.log('\n=== Exemplo 5: Pipeline de processamento de dados ===\n');

  // Simula dados de entrada
  const rawData = [
    { id: 1, value: 'test@example.com', type: 'email' },
    { id: 2, value: '', type: 'email' }, // Inválido
    { id: 3, value: 'valid@test.com', type: 'email' },
    { id: 4, value: null, type: 'email' }, // Null
  ];

  console.log('📥 Dados de entrada:', rawData);

  const results = rawData.map(item => 
    ResultWrapValue(item.value, {
      nullAsFailure: true,
      emptyStringAsFailure: true,
      customValidation: (value) => {
        if (typeof value !== 'string') return 'Deve ser string';
        if (item.type === 'email' && !value.includes('@')) return 'Email inválido';
        return true;
      },
      context: { itemId: item.id },
      defaultFailureType: 'INVALID_DATA'
    })
  );

  const validItems = results.filter(r => r.isSuccess());
  const invalidItems = results.filter(r => r.isFailure());

  console.log(`✅ Itens válidos: ${validItems.length}`);
  validItems.forEach(item => {
    console.log(`  - ${item.getValue()} (ID: ${item.context?.itemId})`);
  });

  console.log(`❌ Itens inválidos: ${invalidItems.length}`);
  invalidItems.forEach(item => {
    console.log(`  - ID ${item.context?.itemId}: ${item.getError().message}`);
  });
}

// Exemplo 6: Comparação com abordagem tradicional
function comparisonExample() {
  console.log('\n=== Exemplo 6: Comparação - Antes vs Depois ===\n');

  // ANTES: Abordagem tradicional com if/else e throws
  function validateUserTraditional(user: any) {
    console.log('🔸 Abordagem tradicional:');
    
    try {
      if (!user) {
        throw new Error('Usuário é obrigatório');
      }
      
      if (!user.email || !user.email.includes('@')) {
        throw new Error('Email inválido');
      }
      
      if (!user.name || user.name.length < 2) {
        throw new Error('Nome muito curto');
      }
      
      console.log('✅ Usuário válido (tradicional):', user.name);
      return user;
    } catch (error) {
      console.log('❌ Erro (tradicional):', (error as Error).message);
      throw error; // Propaga o erro
    }
  }

  // DEPOIS: Com ResultWrapValue
  function validateUserWithResult(user: any) {
    console.log('\n🔸 Abordagem com ResultWrapValue:');
    
    const result = ResultWrapValue(user, {
      nullAsFailure: true,
      undefinedAsFailure: true,
      customValidation: (u) => {
        if (!u.email || !u.email.includes('@')) return 'Email inválido';
        if (!u.name || u.name.length < 2) return 'Nome muito curto';
        return true;
      },
      defaultFailureType: 'VALIDATION_ERROR'
    });

    result
      .onSuccess((validUser) => {
        console.log('✅ Usuário válido (Result):', validUser.name);
      })
      .onFailure((error) => {
        console.log('❌ Erro (Result):', error.message);
        console.log('🔍 Tipo:', result.getType());
        // Não propaga erro - está contido no Result
      });

    return result;
  }

  // Teste com usuário inválido
  const invalidUser = { name: 'A', email: 'invalid' };

  try {
    validateUserTraditional(invalidUser);
  } catch (error) {
    console.log('💥 Exception capturada no traditional');
  }

  validateUserWithResult(invalidUser);
  console.log('🎯 Fluxo continua normalmente com Result');
}

// Executar todos os exemplos
async function runAllExamples() {
  console.log('🚀 Exemplos práticos de ResultWrapValue e ResultWrapValueAsync\n');
  
  await apiResponseExample();
  errorHandlingExample();
  nullableValueExample();
  await promiseWrappingExample();
  await dataPipelineExample();
  comparisonExample();
  
  console.log('\n✨ Todos os exemplos executados com sucesso!');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  apiResponseExample,
  errorHandlingExample,
  nullableValueExample,
  promiseWrappingExample,
  dataPipelineExample,
  comparisonExample,
  runAllExamples
};