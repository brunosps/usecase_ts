
async function quickDemo() {
    console.log('\n🚀 === DEMO RÁPIDO - FUNCIONALIDADES PRINCIPAIS ===\n');

    // Import das principais funcionalidades
    const {
        UseCase,
        Success,
        Failure,
        ResultWrapper,
        ResultWrapValue,
    } = await import('../src');

    // 1. Use Case básico
    console.log('1️⃣ Use Case básico:');

    class QuickDemoUseCase extends UseCase<any, any> {
        async execute(input: any) {
            if (!input?.name) {
                return Failure(new Error('Nome é obrigatório'), 'VALIDATION_ERROR');
            }
            return Success({ greeting: `Olá, ${input.name}!` });
        }
    }

    const useCaseResult = await QuickDemoUseCase.call({ name: 'João' });
    useCaseResult
        .onSuccess((data: any) => console.log('   ✅', data.greeting))
        .onFailure((error) => console.log('   ❌', error.message));

    // 2. Wrapper de função
    console.log('\n2️⃣ Wrapper de função:');

    const divide = (a: number, b: number) => {
        if (b === 0) throw new ValidationError('Divisão por zero');
        return a / b;
    };

    const wrapperResult = ResultWrapper(divide, [10, 2], {
        errorMappings: [{ errorType: ValidationError, failureType: 'MATH_ERROR' }]
    });

    wrapperResult
        .onSuccess((result) => console.log('   ✅ Divisão:', result))
        .onFailure((error) => console.log('   ❌', error.message));

    // 3. Value wrapping
    console.log('\n3️⃣ Value wrapping:');

    const userData = { id: 1, email: 'test@example.com' };
    const valueResult = ResultWrapValue(userData, {
        customValidation: (data) => {
            if (!data.email?.includes('@')) return 'Email inválido';
            return true;
        }
    });

    valueResult
        .onSuccess((data) => console.log('   ✅ Dados válidos:', data))
        .onFailure((error) => console.log('   ❌', error.message));

    // 4. Encadeamento
    console.log('\n4️⃣ Encadeamento:');

    class Step1UseCase extends UseCase<any, any> {
        async execute(input: any) {
            return Success({ processed: `Processado: ${input.input}` });
        }
    }

    class Step2UseCase extends UseCase<any, any> {
        async execute(input: any) {
            return Success({ final: `Resultado: ${input.processed}` });
        }
    }

    const chainResult = await Step1UseCase.call({ input: 'teste' })
        .and_then(async (data: any) => Step2UseCase.call({ processed: data.processed }));

    chainResult
        .onSuccess((final: any) => console.log('   ✅ Chain completo:', final.final))
        .onFailure((error) => console.log('   ❌', error.message));

    console.log('\n💡 Execute os arquivos individuais para ver exemplos detalhados!');
}

async function interactiveMenu() {
    console.log('\n🎯 === MENU INTERATIVO ===\n');

    console.log('Escolha quais exemplos executar:');
    console.log('1. 📖 Exemplos básicos');
    console.log('2. 🔄 Wrapper functions');
    console.log('3. 📦 Value wrapping');
    console.log('4. 🚀 Demo rápido');
    console.log('5. 🎪 Todos os exemplos');

    // Para este exemplo, vamos executar o demo rápido
    console.log('\n🎯 Executando demo rápido...\n');
    await quickDemo();
}

async function runAllExamples() {
    console.log('🚀 === USECASE_TS - EXEMPLOS COMPLETOS ===\n');

    await interactiveMenu();

    console.log('\n═══════════════════════════════════════════════');
    console.log('📁 Para ver exemplos específicos, execute:');
    console.log('   npx ts-node examples/01-basic-usage.ts');
    console.log('   npx ts-node examples/02-wrapper-functions.ts');
    console.log('   npx ts-node examples/03-value-wrapping.ts');
    console.log('   npx ts-node examples/value-wrapping-examples.ts');
    console.log('\n🔗 Repositório: https://github.com/brunosps/usecase_ts');
    console.log('📖 Documentação: README.md');
    console.log('✨ Happy coding with usecase_ts! ✨\n');
}

if (require.main === module) {
    runAllExamples().catch(console.error);
}

export {
    runAllExamples,
    quickDemo,
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

