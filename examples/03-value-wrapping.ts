/**
 * Exemplos completos das novas funções de wrapping de valores
 * ResultWrapValue e ResultWrapValueAsync
 */
import { ValidationError } from '.';
import { 
  ResultWrapValue, 
  ResultWrapValueAsync,
} from '../src';

// =============================================================================
// 1. RESULTWRAPVALUE - VALORES SÍNCRONOS
// =============================================================================

function syncValueWrappingExamples() {
  console.log('📦 === RESULTWRAPVALUE - VALORES SÍNCRONOS ===\n');

  // Exemplo 1: Valor simples válido
  console.log('📝 Valor simples válido:');
  const simpleValue = 'Hello, World!';
  const simpleResult = ResultWrapValue(simpleValue);
  
  simpleResult.onSuccess((value) => console.log('   ✅ Valor:', value));

  // Exemplo 2: Valor null com validação
  console.log('\n📝 Valor null com validação:');
  const nullValue = null;
  const nullResult = ResultWrapValue(nullValue, {
    nullAsFailure: true,
    defaultFailureType: 'NULL_VALUE_ERROR'
  });
  
  nullResult.onFailure((error) => console.log('   ❌ Valor null:', error.message));

  // Exemplo 3: Validações básicas
  console.log('\n📝 Validações básicas:');
  const testValues = [
    { name: 'String vazia', value: '', options: { emptyStringAsFailure: true } },
    { name: 'Zero', value: 0, options: { zeroAsFailure: true } },
    { name: 'Array vazio', value: [], options: { emptyArrayAsFailure: true } },
    { name: 'Objeto vazio', value: {}, options: { emptyObjectAsFailure: true } },
    { name: 'Undefined', value: undefined, options: { undefinedAsFailure: true } }
  ];

  testValues.forEach(test => {
    console.log(`\n   🔍 Testando: ${test.name}`);
    const result = ResultWrapValue(test.value, test.options);
    
    result
      .onSuccess((value) => console.log('     ✅ Valor válido:', value))
      .onFailure((error) => console.log('     ❌ Valor inválido:', error.message));
  });

  // Exemplo 4: Erro já capturado
  console.log('\n📝 Erro já capturado:');
  let capturedError: Error | null = null;
  
  try {
    JSON.parse('{"invalid": json}');
  } catch (error) {
    capturedError = error as Error;
  }

  if (capturedError) {
    const errorResult = ResultWrapValue(capturedError, {
      defaultFailureType: 'JSON_PARSE_ERROR',
      context: { operation: 'parse_config' }
    });

    errorResult.onFailure((error) => {
      console.log('   ❌ Erro capturado:', error.message);
      console.log('   📊 Contexto:', errorResult.context);
    });
  }
}

// =============================================================================
// 2. VALIDAÇÕES CUSTOMIZADAS
// =============================================================================

function customValidationExamples() {
  console.log('\n\n📋 === VALIDAÇÕES CUSTOMIZADAS ===\n');

  // Exemplo 1: Validação de email
  console.log('📝 Validação de email:');
  const emails = ['test@example.com', 'invalid-email', '', null];

  emails.forEach(email => {
    console.log(`\n   📧 Testando email: ${email || 'null'}`);
    
    const result = ResultWrapValue(email, {
      nullAsFailure: true,
      emptyStringAsFailure: true,
      customValidation: (value) => {
        if (typeof value !== 'string') return 'Deve ser string';
        if (!value.includes('@')) return 'Email deve conter @';
        if (!value.includes('.')) return 'Email deve conter .';
        return true;
      },
      defaultFailureType: 'EMAIL_VALIDATION_ERROR'
    });

    result
      .onSuccess((validEmail) => console.log('     ✅ Email válido:', validEmail))
      .onFailure((error) => console.log('     ❌ Email inválido:', error.message));
  });

  // Exemplo 2: Validação de objeto usuário
  console.log('\n📝 Validação de objeto usuário:');
  const users = [
    { id: 1, name: 'João', email: 'joao@test.com', age: 30 },
    { id: 2, name: 'A', email: 'invalid', age: -5 },
    { id: 3, name: 'Maria', email: 'maria@test.com' }, // sem age
    null,
    {}
  ];

  users.forEach((user, index) => {
    console.log(`\n   👤 Testando usuário ${index + 1}:`, user);
    
    const result = ResultWrapValue(user, {
      nullAsFailure: true,
      emptyObjectAsFailure: true,
      customValidation: (u) => {
        if (!u.id) return 'ID é obrigatório';
        if (!u.name || u.name.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (!u.email || !u.email.includes('@')) return 'Email inválido';
        if (u.age !== undefined && (u.age < 0 || u.age > 120)) return 'Idade inválida';
        return true;
      },
      defaultFailureType: 'USER_VALIDATION_ERROR',
      context: { userId: user?.id }
    });

    result
      .onSuccess((validUser) => console.log('     ✅ Usuário válido'))
      .onFailure((error) => console.log('     ❌ Usuário inválido:', error.message));
  });

  // Exemplo 3: Validação de array
  console.log('\n📝 Validação de array:');
  const arrays = [
    [1, 2, 3, 4, 5],
    [1, 2],
    [],
    null,
    ['a', 'b', 'c']
  ];

  arrays.forEach((arr, index) => {
    console.log(`\n   📋 Testando array ${index + 1}:`, arr);
    
    const result = ResultWrapValue(arr, {
      nullAsFailure: true,
      emptyArrayAsFailure: true,
      customValidation: (array) => {
        if (!Array.isArray(array)) return 'Deve ser um array';
        if (array.length < 3) return 'Array deve ter pelo menos 3 elementos';
        if (array.some(item => typeof item !== 'number')) return 'Todos elementos devem ser números';
        return true;
      },
      defaultFailureType: 'ARRAY_VALIDATION_ERROR'
    });

    result
      .onSuccess((validArray) => console.log('     ✅ Array válido, soma:', (validArray as number[]).reduce((a, b) => a + b, 0)))
      .onFailure((error) => console.log('     ❌ Array inválido:', error.message));
  });
}

// =============================================================================
// 3. RESULTWRAPVALUEASYNC - VALORES/PROMISES ASSÍNCRONOS
// =============================================================================

async function asyncValueWrappingExamples() {
  console.log('\n\n🔄 === RESULTWRAPVALUEASYNC - VALORES ASSÍNCRONOS ===\n');

  // Exemplo 1: Promise simples
  console.log('📝 Promise simples:');
  const simplePromise = Promise.resolve('Valor da Promise');
  const promiseResult = await ResultWrapValueAsync(simplePromise);
  
  promiseResult.onSuccess((value) => console.log('   ✅ Promise resolvida:', value));

  // Exemplo 2: Promise que rejeita
  console.log('\n📝 Promise que rejeita:');
  const rejectingPromise = Promise.reject(new ValidationError('Erro na Promise'));
  const rejectedResult = await ResultWrapValueAsync(rejectingPromise, {
    errorMappings: [{ errorType: ValidationError, failureType: 'PROMISE_ERROR' }]
  });
  
  rejectedResult.onFailure((error) => console.log('   ❌ Promise rejeitada:', error.message));

  // Exemplo 3: Validação após resolução da Promise
  console.log('\n📝 Validação após resolução:');
  const userDataPromise = Promise.resolve({ id: 1, name: 'João', score: 95 });
  
  const validatedResult = await ResultWrapValueAsync(userDataPromise, {
    customValidation: (user) => {
      if (!user.id) return 'ID obrigatório';
      if (!user.name) return 'Nome obrigatório';
      if (user.score < 50) return 'Score muito baixo';
      return true;
    },
    context: { operation: 'validate_user_score' }
  });

  validatedResult
    .onSuccess((user) => console.log('   ✅ Usuário com score alto:', user))
    .onFailure((error) => console.log('   ❌ Validação falhou:', error.message));

  // Exemplo 4: Promise que resolve para null
  console.log('\n📝 Promise que resolve para null:');
  const nullPromise = Promise.resolve(null);
  
  const nullAsyncResult = await ResultWrapValueAsync(nullPromise, {
    nullAsFailure: true,
    defaultFailureType: 'NULL_ASYNC_VALUE'
  });

  nullAsyncResult.onFailure((error) => console.log('   ❌ Promise resolveu para null'));
}

// =============================================================================
// 4. CENÁRIOS PRÁTICOS DO MUNDO REAL
// =============================================================================

async function realWorldScenarios() {
  console.log('\n\n🌍 === CENÁRIOS PRÁTICOS ===\n');

  // Cenário 1: Validação de resposta de API
  console.log('📝 Validação de resposta de API:');
  
  // Simula resposta de API já executada
  const apiResponses = [
    { id: 1, name: 'João', email: 'joao@test.com', active: true },
    { id: 2, name: 'Maria', email: 'maria@test.com', active: false },
    null, // API retornou null
    { id: 3, email: 'pedro@test.com' }, // sem name
    {} // objeto vazio
  ];

  for (const [index, response] of apiResponses.entries()) {
    console.log(`\n   🌐 API Response ${index + 1}:`, response);
    
    const result = ResultWrapValue(response, {
      nullAsFailure: true,
      emptyObjectAsFailure: true,
      customValidation: (data) => {
        if (!data.id) return 'ID é obrigatório na resposta';
        if (!data.name) return 'Nome é obrigatório na resposta';
        if (!data.email?.includes('@')) return 'Email inválido na resposta';
        if (!data.active) return 'Usuário deve estar ativo';
        return true;
      },
      defaultFailureType: 'API_RESPONSE_ERROR',
      context: { source: 'user_api', responseIndex: index }
    });

    result
      .onSuccess((user) => console.log('     ✅ Resposta válida para usuário:', user.name))
      .onFailure((error) => console.log('     ❌ Resposta inválida:', error.message));
  }

  // Cenário 2: Processamento de dados de formulário
  console.log('\n📝 Processamento de dados de formulário:');
  
  const formData = {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    phone: '11999999999',
    age: 30,
    terms: true
  };

  const processedForm = ResultWrapValue(formData, {
    customValidation: (data) => {
      const errors: string[] = [];
      
      if (!data.name || data.name.length < 2) errors.push('Nome inválido');
      if (!data.email?.includes('@')) errors.push('Email inválido');
      if (!data.phone || data.phone.length < 10) errors.push('Telefone inválido');
      if (data.age < 18) errors.push('Deve ser maior de idade');
      if (!data.terms) errors.push('Deve aceitar os termos');
      
      return errors.length > 0 ? errors.join(', ') : true;
    },
    context: { form: 'user_registration' }
  });

  processedForm
    .onSuccess((validData) => console.log('   ✅ Formulário válido para:', validData.name))
    .onFailure((error) => console.log('   ❌ Formulário inválido:', error.message));

  // Cenário 3: Pipeline de processamento de arquivo
  console.log('\n📝 Pipeline de processamento de arquivo:');
  
  const processFile = async (filename: string) => {
    // Simula leitura de arquivo que pode falhar ou retornar null
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (filename === 'notfound.txt') return null;
    if (filename === 'empty.txt') return '';
    if (filename === 'invalid.txt') throw new Error('Arquivo corrompido');
    
    return `Conteúdo do arquivo ${filename}`;
  };

  const files = ['config.txt', 'notfound.txt', 'empty.txt', 'invalid.txt'];

  for (const filename of files) {
    console.log(`\n   📁 Processando: ${filename}`);
    
    try {
      const fileContent = await processFile(filename);
      
      const result = await ResultWrapValueAsync(Promise.resolve(fileContent), {
        nullAsFailure: true,
        emptyStringAsFailure: true,
        customValidation: (content) => {
          if (typeof content !== 'string') return 'Conteúdo deve ser string';
          if (content.length < 10) return 'Arquivo muito pequeno';
          return true;
        },
        defaultFailureType: 'FILE_PROCESSING_ERROR',
        context: { filename, operation: 'process_file' }
      });

      result
        .onSuccess((content) => console.log('     ✅ Arquivo processado com sucesso'))
        .onFailure((error) => console.log('     ❌ Erro no processamento:', error.message));
        
    } catch (error) {
      const errorResult = ResultWrapValue(error, {
        defaultFailureType: 'FILE_READ_ERROR'
      });
      
      errorResult.onFailure((err) => console.log('     ❌ Erro ao ler arquivo:', err.message));
    }
  }
}

// =============================================================================
// 5. COMPARAÇÃO DE ABORDAGENS
// =============================================================================

function comparisonExamples() {
  console.log('\n\n⚖️ === COMPARAÇÃO DE ABORDAGENS ===\n');

  // Dados de teste
  const testData = { id: 1, name: 'João', email: 'invalid-email' };

  // ABORDAGEM TRADICIONAL
  console.log('🔸 Abordagem tradicional (try/catch):');
  try {
    if (!testData.id) throw new Error('ID obrigatório');
    if (!testData.name || testData.name.length < 2) throw new Error('Nome inválido');
    if (!testData.email.includes('@')) throw new Error('Email inválido');
    
    console.log('   ✅ Dados válidos');
  } catch (error) {
    console.log('   ❌ Erro capturado:', (error as Error).message);
    console.log('   💥 Fluxo interrompido por exception');
  }

  // ABORDAGEM COM RESULTWRAPVALUE
  console.log('\n🔸 Abordagem com ResultWrapValue:');
  const wrappedResult = ResultWrapValue(testData, {
    customValidation: (data) => {
      if (!data.id) return 'ID obrigatório';
      if (!data.name || data.name.length < 2) return 'Nome inválido';
      if (!data.email.includes('@')) return 'Email inválido';
      return true;
    },
    defaultFailureType: 'VALIDATION_ERROR'
  });

  wrappedResult
    .onSuccess((data) => console.log('   ✅ Dados válidos'))
    .onFailure((error) => console.log('   ❌ Erro contido no Result:', error.message));
  
  console.log('   🎯 Fluxo continua normalmente - erro está contido no Result');

  // MÚLTIPLAS VALIDAÇÕES
  console.log('\n🔸 Múltiplas validações sequenciais:');
  const multipleValidations = [
    { name: 'Email válido', email: 'test@example.com' },
    { name: 'Email inválido', email: 'invalid' },
    { name: 'Email null', email: null }
  ];

  console.log('   📊 Processando múltiplas validações...');
  multipleValidations.forEach((test, index) => {
    const result = ResultWrapValue(test.email, {
      nullAsFailure: true,
      customValidation: (email) => {
        if (typeof email !== 'string') return 'Deve ser string';
        if (!email.includes('@')) return 'Email deve conter @';
        return true;
      }
    });

    result
      .onSuccess((email) => console.log(`     ${index + 1}. ✅ ${test.name} - OK`))
      .onFailure((error) => console.log(`     ${index + 1}. ❌ ${test.name} - ${error.message}`));
  });

  console.log('   🎯 Todas as validações processadas sem interromper o fluxo');
}

// =============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// =============================================================================

async function runValueWrappingExamples() {
  console.log('🚀 Exemplos Completos de Value Wrapping\n');
  
  syncValueWrappingExamples();
  customValidationExamples();
  await asyncValueWrappingExamples();
  await realWorldScenarios();
  comparisonExamples();
  
  console.log('\n✨ Exemplos de value wrapping concluídos!\n');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runValueWrappingExamples().catch(console.error);
}

export { runValueWrappingExamples };