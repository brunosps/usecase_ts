/**
 * Exemplos básicos de uso do usecase_ts
 * Demonstra os conceitos fundamentais: Result, Success, Failure, UseCase
 */

import { Result, Success, Failure, UseCase } from '../src';

// =============================================================================
// 1. CONCEITOS BÁSICOS - Result, Success e Failure
// =============================================================================

function basicResultExamples() {
  console.log('🎯 === CONCEITOS BÁSICOS ===\n');

  // Criando um Success
  const successResult = Success('Hello World!');
  console.log('✅ Success criado:', successResult.getValue());
  console.log('   É sucesso?', successResult.isSuccess());
  console.log('   É falha?', successResult.isFailure());
  console.log('   Tipo:', successResult.getType());

  // Criando um Failure
  const failureResult = Failure(new Error('Algo deu errado'), 'CUSTOM_ERROR');
  console.log('\n❌ Failure criado:', failureResult.getError().message);
  console.log('   É sucesso?', failureResult.isSuccess());
  console.log('   É falha?', failureResult.isFailure());
  console.log('   Tipo:', failureResult.getType());

  // Usando callbacks onSuccess e onFailure
  console.log('\n🔄 Usando callbacks:');
  
  successResult
    .onSuccess((value) => console.log('   Callback de sucesso:', value))
    .onFailure((error) => console.log('   Este não será chamado'));

  failureResult
    .onSuccess((value) => console.log('   Este não será chamado'))
    .onFailure((error) => console.log('   Callback de falha:', error.message));
}

// =============================================================================
// 2. USE CASES BÁSICOS
// =============================================================================

// Use Case simples - Calculadora
class CalculatorUseCase extends UseCase<{ a: number, b: number, operation: string }, { result: number }> {
  async execute(input: { a: number, b: number, operation: string }): Promise<Result<{ result: number }>> {
    // Validação de entrada
    if (typeof input.a !== 'number' || typeof input.b !== 'number') {
      return Failure(new Error('Os valores devem ser números'), 'VALIDATION_ERROR');
    }

    // Operações
    switch (input.operation) {
      case 'add':
        return Success({ result: input.a + input.b });
      case 'subtract':
        return Success({ result: input.a - input.b });
      case 'multiply':
        return Success({ result: input.a * input.b });
      case 'divide':
        if (input.b === 0) {
          return Failure(new Error('Divisão por zero não é permitida'), 'DIVISION_BY_ZERO');
        }
        return Success({ result: input.a / input.b });
      default:
        return Failure(new Error('Operação não suportada'), 'UNSUPPORTED_OPERATION');
    }
  }
}

// Use Case de validação de dados
class ValidateUserUseCase extends UseCase<{ name: string, email: string, age: number }, { valid: boolean, user: any }> {
  async execute(input: { name: string, email: string, age: number }): Promise<Result<{ valid: boolean, user: any }>> {
    const errors: string[] = [];

    // Validações
    if (!input.name || input.name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!input.email || !input.email.includes('@')) {
      errors.push('Email deve ser válido');
    }

    if (input.age < 0 || input.age > 120) {
      errors.push('Idade deve estar entre 0 e 120 anos');
    }

    if (errors.length > 0) {
      return Failure(new Error(errors.join(', ')), 'VALIDATION_ERROR');
    }

    return Success({ 
      valid: true, 
      user: { name: input.name, email: input.email, age: input.age }
    });
  }
}

async function useCaseExamples() {
  console.log('\n🏗️ === USE CASES ===\n');

  // Exemplo 1: Calculadora - Sucesso
  console.log('🧮 Calculadora - Operação válida:');
  const calcResult1 = await CalculatorUseCase.call({ a: 10, b: 5, operation: 'add' });
  
  calcResult1
    .onSuccess((data) => console.log(`   ✅ 10 + 5 = ${(data as { result: number }).result}`))
    .onFailure((error) => console.log(`   ❌ Erro: ${error.message}`));

  // Exemplo 2: Calculadora - Divisão por zero
  console.log('\n🧮 Calculadora - Divisão por zero:');
  const calcResult2 = await CalculatorUseCase.call({ a: 10, b: 0, operation: 'divide' });
  
  calcResult2
    .onSuccess((data) => console.log(`   ✅ Resultado: ${(data as { result: number }).result}`))
    .onFailure((error) => console.log(`   ❌ Erro: ${error.message}`), 'DIVISION_BY_ZERO')
    .onFailure((error) => console.log(`   ❌ Erro genérico: ${error.message}`));

  // Exemplo 3: Validação - Dados válidos
  console.log('\n👤 Validação de usuário - Dados válidos:');
  const validationResult1 = await ValidateUserUseCase.call({
    name: 'João Silva',
    email: 'joao@exemplo.com',
    age: 30
  });

  validationResult1
    .onSuccess((data) => console.log('   ✅ Usuário válido:', (data as any).user))
    .onFailure((error) => console.log(`   ❌ Erro: ${error.message}`));

  // Exemplo 4: Validação - Dados inválidos
  console.log('\n👤 Validação de usuário - Dados inválidos:');
  const validationResult2 = await ValidateUserUseCase.call({
    name: 'A',
    email: 'email-inválido',
    age: -5
  });

  validationResult2
    .onSuccess((data) => console.log('   ✅ Usuário válido:', (data as any).user))
    .onFailure((error) => console.log(`   ❌ Erros de validação: ${error.message}`), 'VALIDATION_ERROR');
}

// =============================================================================
// 3. CONTEXT TRACKING
// =============================================================================

class UserProcessingUseCase extends UseCase<{ userId: string }, { processed: boolean, userData: any }> {
  async execute(input: { userId: string }) {
    return Success({ 
      processed: true, 
      userData: { id: input.userId, name: 'Usuário Processado' }
    });
  }
}

class NotificationUseCase extends UseCase<{ userId: string, message: string }, { sent: boolean }> {
  async execute(input: { userId: string, message: string }) {
    // Simula envio de notificação
    return Success({ sent: true });
  }
}

async function contextTrackingExample() {
  console.log('\n📊 === CONTEXT TRACKING ===\n');

  const result = await UserProcessingUseCase.call({ userId: '123' })
    .and_then(async (data) => {
      console.log('   🔄 Processamento concluído, enviando notificação...');
      return NotificationUseCase.call({ 
        userId: (data as { userData: { id: string, name: string } }).userData.id, 
        message: `Olá ${(data as { userData: { id: string, name: string } }).userData.name}!` 
      });
    });

  result
    .onSuccess((notificationData) => {
      console.log('   ✅ Notificação enviada:', (notificationData as { sent: boolean }).sent);
      
      // Acessar contexto de use cases anteriores
      if (result.context) {
        console.log('   📋 Contexto UserProcessing:', result.context.UserProcessingUseCase);
        console.log('   📋 Contexto Notification:', result.context.NotificationUseCase);
      }
    })
    .onFailure((error) => console.log(`   ❌ Erro: ${error.message}`));
}

// =============================================================================
// 4. TRATAMENTO AVANÇADO DE ERROS
// =============================================================================

class AdvancedValidationUseCase extends UseCase<{ data: any }, { validated: any }> {
  async execute(input: { data: any }): Promise<Result<{ validated: any }>> {
    if (!input.data) {
      return Failure(new Error('Dados são obrigatórios'), 'MISSING_DATA');
    }

    if (typeof input.data !== 'object') {
      return Failure(new Error('Dados devem ser um objeto'), 'INVALID_TYPE');
    }

    if (!input.data.id) {
      return Failure(new Error('ID é obrigatório'), 'MISSING_ID');
    }

    return Success({ validated: input.data });
  }
}

async function advancedErrorHandling() {
  console.log('\n🚨 === TRATAMENTO AVANÇADO DE ERROS ===\n');

  // Teste diferentes tipos de erro
  const testCases = [
    { name: 'Dados válidos', data: { id: 1, name: 'Teste' } },
    { name: 'Dados ausentes', data: null },
    { name: 'Tipo inválido', data: 'string' },
    { name: 'ID ausente', data: { name: 'Sem ID' } }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testando: ${testCase.name}`);
    
    const result = await AdvancedValidationUseCase.call({ data: testCase.data });
    
    result
      .onSuccess((data) => console.log('   ✅ Validação bem-sucedida'))
      .onFailure((error) => console.log(`   ❌ Dados ausentes: ${error.message}`), 'MISSING_DATA')
      .onFailure((error) => console.log(`   ❌ Tipo inválido: ${error.message}`), 'INVALID_TYPE')
      .onFailure((error) => console.log(`   ❌ ID ausente: ${error.message}`), 'MISSING_ID')
      .onFailure((error) => console.log(`   ❌ Erro genérico: ${error.message}`));
    
    console.log('');
  }
}

// =============================================================================
// 5. MÉTODOS ESTÁTICOS VS INSTÂNCIA
// =============================================================================

async function staticVsInstanceExample() {
  console.log('\n⚖️ === MÉTODOS ESTÁTICOS VS INSTÂNCIA ===\n');

  // Método estático
  console.log('🔸 Usando método estático:');
  const staticResult = await CalculatorUseCase.call({ a: 5, b: 3, operation: 'multiply' });
  staticResult.onSuccess((data) => console.log(`   Resultado estático: ${(data as { result: number }).result}`));

  // Método de instância
  console.log('\n🔸 Usando instância:');
  const calculator = new CalculatorUseCase();
  const instanceResult = await calculator.call({ a: 5, b: 3, operation: 'multiply' });
  instanceResult.onSuccess((data) => console.log(`   Resultado instância: ${data.result}`));
}

// =============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// =============================================================================

async function runBasicExamples() {
  console.log('🚀 Exemplos Básicos do usecase_ts\n');
  
  basicResultExamples();
  await useCaseExamples();
  await contextTrackingExample();
  await advancedErrorHandling();
  await staticVsInstanceExample();
  
  console.log('\n✨ Exemplos básicos concluídos!\n');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runBasicExamples().catch(console.error);
}

export { runBasicExamples };