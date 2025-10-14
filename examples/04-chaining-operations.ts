/**
 * Exemplos de encadeamento de operações (and_then)
 * Demonstra como compor múltiplos Use Cases e operações
 */

import { ValidationError } from '.';

import { 
  UseCase, 
  Success, 
  Failure, 
  Result,
  ResultAsyncWrapper,
} from '../src';

// =============================================================================
// 1. USE CASES PARA ENCADEAMENTO
// =============================================================================

// Use Case para validar entrada
class ValidateInputUseCase extends UseCase<{ email: string }, { email: string }> {
  async execute(input: { email: string }): Promise<Result<{ email: string }>> {
    if (!input.email) {
      return Failure(new Error('Email é obrigatório'), 'VALIDATION_ERROR');
    }
    
    if (!input.email.includes('@')) {
      return Failure(new Error('Email inválido'), 'VALIDATION_ERROR');
    }
    
    return Success({ email: input.email });
  }
}

// Use Case para buscar usuário
class FindUserUseCase extends UseCase<{ email: string }, { id: string, name: string, email: string }> {
  async execute(input: { email: string }): Promise<Result<{ id: string, name: string, email: string }>> {
    // Simula busca no banco de dados
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (input.email === 'notfound@example.com') {
      return Failure(new Error('Usuário não encontrado'), 'NOT_FOUND');
    }
    
    if (input.email === 'inactive@example.com') {
      return Failure(new Error('Usuário inativo'), 'USER_INACTIVE');
    }
    
    return Success({ 
      id: '123', 
      name: 'João Silva', 
      email: input.email 
    });
  }
}

// Use Case para enviar email
class SendEmailUseCase extends UseCase<{ userId: string, name: string }, { sent: boolean, messageId: string }> {
  async execute(input: { userId: string, name: string }): Promise<Result<{ sent: boolean, messageId: string }>> {
    // Simula envio de email
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (input.name === 'Block Email') {
      return Failure(new Error('Email bloqueado'), 'EMAIL_BLOCKED');
    }
    
    return Success({ 
      sent: true, 
      messageId: `msg-${Date.now()}` 
    });
  }
}

// Use Case para log de atividade
class LogActivityUseCase extends UseCase<{ userId: string, activity: string }, { logged: boolean }> {
  async execute(input: { userId: string, activity: string }): Promise<Result<{ logged: boolean }>> {
    // Simula log no sistema
    await new Promise(resolve => setTimeout(resolve, 25));
    
    return Success({ logged: true });
  }
}

// =============================================================================
// 2. EXEMPLOS BÁSICOS DE ENCADEAMENTO
// =============================================================================

async function basicChainingExamples() {
  console.log('🔗 === ENCADEAMENTO BÁSICO ===\n');

  // Exemplo 1: Encadeamento simples com sucesso
  console.log('📝 Encadeamento simples - Sucesso:');
  
  const result1 = await ValidateInputUseCase.call({ email: 'joao@example.com' })
    .and_then(async (data) => {
      console.log('   🔄 Email validado, buscando usuário...');
      return FindUserUseCase.call({ email: (data as any).email });
    })
    .and_then(async (user) => {
      console.log('   🔄 Usuário encontrado, enviando email...');
      return SendEmailUseCase.call({ userId: (user as any).id, name: (user as any).name });
    });

  result1
    .onSuccess((emailResult) => {
      console.log('   ✅ Email enviado com sucesso:', emailResult);
      console.log('   📊 Contexto completo:', Object.keys(result1.context || {}));
    })
    .onFailure((error) => console.log('   ❌ Erro:', error.message));

  // Exemplo 2: Encadeamento que falha na validação
  console.log('\n📝 Encadeamento - Falha na validação:');
  
  const result2 = await ValidateInputUseCase.call({ email: 'email-inválido' })
    .and_then(async (data) => {
      console.log('   🔄 Este não será executado');
      return FindUserUseCase.call({ email: (data as any).email });
    })
    .and_then(async (user) => {
      console.log('   🔄 Este também não será executado');
      return SendEmailUseCase.call({ userId: (user as any).id, name: (user as any).name });
    });

  result2
    .onSuccess((emailResult) => console.log('   ✅ Email enviado'))
    .onFailure((error) => console.log('   ❌ Falha na validação:', error.message), 'VALIDATION_ERROR')
    .onFailure((error) => console.log('   ❌ Erro genérico:', error.message));

  // Exemplo 3: Encadeamento que falha na busca
  console.log('\n📝 Encadeamento - Usuário não encontrado:');
  
  const result3 = await ValidateInputUseCase.call({ email: 'notfound@example.com' })
    .and_then(async (data) => {
      console.log('   🔄 Email validado, buscando usuário...');
      return FindUserUseCase.call({ email: (data as any).email });
    })
    .and_then(async (user) => {
      console.log('   🔄 Este não será executado');
      return SendEmailUseCase.call({ userId: (user as any).id, name: (user as any).name });
    });

  result3
    .onSuccess((emailResult) => console.log('   ✅ Email enviado'))
    .onFailure((error) => console.log('   ❌ Usuário não encontrado'), 'NOT_FOUND')
    .onFailure((error) => console.log('   ❌ Erro genérico:', error.message));
}

// =============================================================================
// 3. ENCADEAMENTO COMPLEXO COM MÚLTIPLAS OPERAÇÕES
// =============================================================================

async function complexChainingExamples() {
  console.log('\n\n🔗 === ENCADEAMENTO COMPLEXO ===\n');

  // Exemplo 1: Pipeline completo com log
  console.log('📝 Pipeline completo com log:');
  
  const complexResult = await ValidateInputUseCase.call({ email: 'maria@example.com' })
    .and_then(async (validationData: any) => {
      console.log('   🔄 Step 1: Email validado');
      return FindUserUseCase.call({ email: validationData.email });
    })
    .and_then(async (userData: any) => {
      console.log('   🔄 Step 2: Usuário encontrado');
      return SendEmailUseCase.call({ userId: userData.id, name: userData.name });
    })
    .and_then(async (emailData: any) => {
      console.log('   🔄 Step 3: Email enviado, fazendo log');
      return LogActivityUseCase.call({ 
        userId: '123', // Poderíamos passar do contexto anterior
        activity: `Email sent: ${emailData.messageId}` 
      });
    });

  complexResult
    .onSuccess((logResult: any) => {
      console.log('   ✅ Pipeline completo! Log registrado:', logResult.logged);
      
      // Acessar contexto de todos os use cases
      if (complexResult.context) {
        console.log('   📊 Use Cases executados:');
        Object.keys(complexResult.context).forEach(useCase => {
          console.log(`     - ${useCase}`);
        });
      }
    })
    .onFailure((error) => console.log('   ❌ Pipeline falhou:', error.message));

  // Exemplo 2: Encadeamento com transformação de dados
  console.log('\n📝 Encadeamento com transformação:');
  
  const transformResult = await ValidateInputUseCase.call({ email: 'pedro@example.com' })
    .and_then(async (data: any) => {
      // Transformar dados entre use cases
      const upperEmail = data.email.toUpperCase();
      return FindUserUseCase.call({ email: data.email });
    })
    .and_then(async (user: any) => {
      // Adicionar dados extras
      const enrichedData = {
        ...user,
        fullName: `Sr. ${user.name}`,
        timestamp: new Date().toISOString()
      };
      
      return SendEmailUseCase.call({ userId: user.id, name: enrichedData.fullName });
    });

  transformResult
    .onSuccess((result) => console.log('   ✅ Email enviado com dados transformados'))
    .onFailure((error) => console.log('   ❌ Erro na transformação:', error.message));
}

// =============================================================================
// 4. TRATAMENTO DE ERROS EM DIFERENTES PONTOS
// =============================================================================

async function errorHandlingInChains() {
  console.log('\n\n🚨 === TRATAMENTO DE ERROS EM CHAINS ===\n');

  // Teste diferentes pontos de falha
  const testCases = [
    { 
      name: 'Email inválido', 
      email: 'invalid', 
      expectedError: 'VALIDATION_ERROR' 
    },
    { 
      name: 'Usuário não encontrado', 
      email: 'notfound@example.com', 
      expectedError: 'NOT_FOUND' 
    },
    { 
      name: 'Usuário inativo', 
      email: 'inactive@example.com', 
      expectedError: 'USER_INACTIVE' 
    },
    { 
      name: 'Sucesso completo', 
      email: 'success@example.com', 
      expectedError: null 
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testando: ${testCase.name}`);
    
    const result = await ValidateInputUseCase.call({ email: testCase.email })
      .and_then(async (data: any) => FindUserUseCase.call({ email: data.email }))
      .and_then(async (user: any) => SendEmailUseCase.call({ userId: user.id, name: user.name }));

    result
      .onSuccess((emailResult) => {
        console.log('   ✅ Sucesso completo!');
        if (testCase.expectedError) {
          console.log('   ⚠️  Esperava erro, mas teve sucesso');
        }
      })
      .onFailure((error) => {
        console.log(`   ❌ Erro (${result.getType()}): ${error.message}`);
        if (result.getType() === testCase.expectedError) {
          console.log('   ✅ Erro esperado capturado corretamente');
        }
      }, 'VALIDATION_ERROR')
      .onFailure((error) => {
        console.log(`   ❌ Usuário não encontrado: ${error.message}`);
      }, 'NOT_FOUND')
      .onFailure((error) => {
        console.log(`   ❌ Usuário inativo: ${error.message}`);
      }, 'USER_INACTIVE')
      .onFailure((error) => {
        console.log(`   ❌ Erro não esperado: ${error.message}`);
      });
  }
}

// =============================================================================
// 5. ENCADEAMENTO COM OPERAÇÕES CONDICIONAIS
// =============================================================================

async function conditionalChainingExamples() {
  console.log('\n\n🔀 === ENCADEAMENTO CONDICIONAL ===\n');

  // Use Case condicional
  class ConditionalProcessUseCase extends UseCase<{ user: any, sendEmail: boolean }, { processed: boolean }> {
    async execute(input: { user: any, sendEmail: boolean }): Promise<Result<{ processed: boolean }>> {
      return Success({ processed: true });
    }
  }

  console.log('📝 Encadeamento com condições:');
  
  const conditionalResult = await ValidateInputUseCase.call({ email: 'condicional@example.com' })
    .and_then(async (data: any) => FindUserUseCase.call({ email: data.email }))
    .and_then(async (user: any) => {
      // Decisão condicional baseada nos dados
      const shouldSendEmail = user.name !== 'No Email User';
      
      if (shouldSendEmail) {
        console.log('   🔄 Enviando email...');
        return SendEmailUseCase.call({ userId: user.id, name: user.name });
      } else {
        console.log('   🔄 Pulando envio de email...');
        return Success({ sent: false, messageId: 'skipped' });
      }
    })
    .and_then(async (emailResult: any) => {
      return LogActivityUseCase.call({ 
        userId: '123', 
        activity: emailResult.sent ? 'Email sent' : 'Email skipped' 
      });
    });

  conditionalResult
    .onSuccess((result) => console.log('   ✅ Processamento condicional completo'))
    .onFailure((error) => console.log('   ❌ Erro no processamento:', error.message));
}

// =============================================================================
// 6. ENCADEAMENTO COM WRAPPER FUNCTIONS
// =============================================================================

async function chainingWithWrappers() {
  console.log('\n\n🔧 === ENCADEAMENTO COM WRAPPERS ===\n');

  // Função externa que pode falhar
  const externalApiCall = async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (userId === 'api-error') {
      throw new Error('API externa falhou');
    }
    
    return { externalData: `External data for ${userId}` };
  };

  // Função de processamento
  const processExternalData = (data: any) => {
    if (!data.externalData) {
      throw new ValidationError('Dados externos inválidos');
    }
    
    return { processed: data.externalData.toUpperCase() };
  };

  console.log('📝 Encadeamento Use Case + Wrappers:');
  
  const wrapperChainResult = await ValidateInputUseCase.call({ email: 'wrapper@example.com' })
    .and_then(async (data: any) => FindUserUseCase.call({ email: data.email }))
    .and_then(async (user: any) => {
      // Usar wrapper para chamada externa
      console.log('   🔄 Chamando API externa...');
      return ResultAsyncWrapper(externalApiCall, [user.id], {
        defaultFailureType: 'EXTERNAL_API_ERROR'
      });
    })
    .and_then(async (externalResult) => {
      // Usar wrapper para processamento
      console.log('   🔄 Processando dados externos...');
      return ResultAsyncWrapper(
        async () => processExternalData(externalResult),
        [],
        {
          errorMappings: [{ errorType: ValidationError, failureType: 'PROCESSING_ERROR' }]
        }
      );
    })
    .and_then(async (processedData) => {
      return LogActivityUseCase.call({ 
        userId: '123', 
        activity: 'External data processed' 
      });
    });

  wrapperChainResult
    .onSuccess((result) => console.log('   ✅ Chain com wrappers completo!'))
    .onFailure((error) => console.log('   ❌ Erro na API externa'), 'EXTERNAL_API_ERROR')
    .onFailure((error) => console.log('   ❌ Erro no processamento'), 'PROCESSING_ERROR')
    .onFailure((error) => console.log('   ❌ Erro genérico:', error.message));
}

// =============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// =============================================================================

async function runChainingExamples() {
  console.log('🚀 Exemplos de Encadeamento de Operações\n');
  
  await basicChainingExamples();
  await complexChainingExamples();
  await errorHandlingInChains();
  await conditionalChainingExamples();
  await chainingWithWrappers();
  
  console.log('\n✨ Exemplos de encadeamento concluídos!\n');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runChainingExamples().catch(console.error);
}

export { runChainingExamples };