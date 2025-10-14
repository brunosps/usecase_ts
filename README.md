[![CI](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/usecase_ts.svg)](https://badge.fury.io/js/usecase_ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen.svg)](https://github.com/brunosps/usecase_ts)

# usecase_ts

Uma implementação robusta do **Result Pattern** para TypeScript, projetada para gerenciar fluxos de erro de forma elegante e previsível. Inspirado em [u-case](https://github.com/serradura/u-case) e otimizado para desenvolvimento moderno.

## 🎯 Por que usar usecase_ts?

- ✅ **Zero Exceptions**: Elimine try/catch desnecessários e erros não tratados
- ✅ **Type Safety**: Tipagem completa com generics TypeScript
- ✅ **Fluent API**: Encadeamento elegante de operações com `and_then`
- ✅ **Legacy Integration**: Transforme qualquer função/valor em Result
- ✅ **Framework Agnostic**: Funciona com qualquer framework (NestJS, Express, etc.)
- ✅ **Rich Error Handling**: Mapeamento customizado de tipos de erro
- ✅ **Context Tracking**: Rastreamento automático de contexto

## 📦 Instalação

```bash
npm install usecase_ts
```

## 🚀 Quick Start

```typescript
import { UseCase, Success, Failure, ResultWrapValue } from 'usecase_ts';

// Use Case simples
class GetUserUseCase extends UseCase<{ id: string }, { name: string, email: string }> {
  async execute(input: { id: string }) {
    if (!input.id) {
      return Failure(new Error('ID é obrigatório'), 'VALIDATION_ERROR');
    }
    
    return Success({ name: 'João Silva', email: 'joao@exemplo.com' });
  }
}

// Uso básico
const result = await GetUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('Usuário:', user))
  .onFailure((error) => console.error('Erro:', error.message));

// Transformar valores existentes em Results
const existingValue = "Hello World";
const wrappedResult = ResultWrapValue(existingValue);
// → Success<string>

const errorValue = new Error("Algo deu errado");
const wrappedError = ResultWrapValue(errorValue);
// → Failure<any>
```

## 🎨 Conceitos Fundamentais

### 1. Result Pattern

Toda operação retorna um `Result<T>` que pode ser:

```typescript
// Sucesso - contém os dados
Success(data)

// Falha - contém erro e tipo
Failure(error, type)
```

### 2. Use Cases

Encapsule lógica de negócio em classes que estendem `UseCase<Input, Output>`:

```typescript
class CalculateUseCase extends UseCase<{ a: number, b: number }, { result: number }> {
  async execute(input: { a: number, b: number }) {
    if (typeof input.a !== 'number' || typeof input.b !== 'number') {
      return Failure(new Error('Entrada inválida'), 'VALIDATION_ERROR');
    }
    
    return Success({ result: input.a + input.b });
  }
}
```

### 3. Wrappers - A Grande Inovação

#### 3.1 ResultWrapper - Para Funções

Transforme qualquer função em uma que retorna Result:

```typescript
import { ResultWrapper, ValidationError } from 'usecase_ts';

// Função existente que pode lançar erro
const validateEmail = (email: string) => {
  if (!email.includes('@')) throw new ValidationError('Email inválido');
  return true;
};

// Wrapped - nunca mais vai lançar exception
const result = ResultWrapper(validateEmail, ['email@teste.com'], {
  errorMappings: [
    { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
  ]
});

result
  .onSuccess(() => console.log('Email válido!'))
  .onFailure((error) => console.log('Email inválido:', error.message), 'VALIDATION_ERROR');
```

#### 3.2 ResultWrapValue - Para Valores Executados

**NOVO!** Transforme valores já executados (incluindo erros, null, undefined) em Results:

```typescript
import { ResultWrapValue } from 'usecase_ts';

// Cenário 1: Valor válido
const data = { id: 1, name: 'João' };
const result1 = ResultWrapValue(data);
// → Success<{id: number, name: string}>

// Cenário 2: Erro capturado
let capturedError: Error | null = null;
try {
  JSON.parse('invalid json');
} catch (error) {
  capturedError = error as Error;
}
const result2 = ResultWrapValue(capturedError);
// → Failure<any>

// Cenário 3: Valor que pode ser null/undefined
const user = findUserById('999'); // pode retornar null
const result3 = ResultWrapValue(user, {
  nullAsFailure: true,
  defaultFailureType: 'USER_NOT_FOUND'
});
// → Failure se user for null

// Cenário 4: Validações customizadas
const result4 = ResultWrapValue(someValue, {
  customValidation: (value) => {
    if (value < 0) return 'Valor deve ser positivo';
    return true;
  }
});
```

## 🔧 Funcionalidades Avançadas

### 1. Mapeamento de Erros

```typescript
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  ConflictError,
  AuthorizationError 
} from 'usecase_ts';

const errorMappings = [
  { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
  { errorType: AuthenticationError, failureType: 'AUTH_ERROR' },
  { errorType: NotFoundError, failureType: 'NOT_FOUND' },
  { errorType: ConflictError, failureType: 'CONFLICT' },
  { errorType: AuthorizationError, failureType: 'FORBIDDEN' }
];

// Use em qualquer wrapper
const result = ResultWrapper(riskyFunction, [params], { errorMappings });
```

### 2. Encadeamento de Operações

```typescript
const result = await ValidateInputUseCase.call({ email: 'user@test.com' })
  .and_then(async (data) => FindUserUseCase.call({ email: data.email }))
  .and_then(async (user) => SendEmailUseCase.call({ userId: user.id }))
  .and_then(async (emailResult) => LogActivityUseCase.call({ 
    action: 'email_sent', 
    success: emailResult.sent 
  }));

result
  .onSuccess((log) => console.log('Processo completo:', log))
  .onFailure((error) => console.error('Validação falhou'), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('Usuário não encontrado'), 'NOT_FOUND')
  .onFailure((error) => console.error('Falha geral'));
```

### 3. Validações Avançadas com ResultWrapValue

```typescript
// Exemplo: API response validation
const apiResponse = await fetch('/api/user/123').then(r => r.json());

const validatedResponse = ResultWrapValue(apiResponse, {
  // Validações básicas
  nullAsFailure: true,
  undefinedAsFailure: true,
  emptyObjectAsFailure: true,
  
  // Validação customizada
  customValidation: (user) => {
    if (!user.id) return 'ID é obrigatório';
    if (!user.email?.includes('@')) return 'Email inválido';
    if (!user.name || user.name.length < 2) return 'Nome muito curto';
    return true;
  },
  
  // Contexto para debugging
  context: { source: 'api_user_fetch' },
  useCaseClass: 'UserValidation'
});

validatedResponse
  .onSuccess((user) => console.log('Usuário válido:', user))
  .onFailure((error) => console.error('Usuário inválido:', error.message));
```

### 4. Integração com Async/Await

```typescript
import { ResultWrapValueAsync } from 'usecase_ts';

// Para Promises ou valores assíncronos
const processUser = async (userId: string) => {
  const userPromise = fetch(`/api/users/${userId}`).then(r => r.json());
  
  const result = await ResultWrapValueAsync(userPromise, {
    customValidation: (user) => {
      if (!user || !user.active) return 'Usuário inativo';
      return true;
    },
    errorMappings: [
      { errorType: Error, failureType: 'API_ERROR' }
    ]
  });
  
  return result;
};
```

## 🏗️ Exemplos do Mundo Real

### 1. Service Layer com Error Handling

```typescript
class UserService {
  async fetchUser(id: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (response.status === 404) return null;
      if (response.status === 401) throw new AuthenticationError('Token expirado');
      if (!response.ok) throw new Error('Erro na API');
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  validateUser(user: User): boolean {
    if (!user.email) throw new ValidationError('Email obrigatório');
    if (!user.name) throw new ValidationError('Nome obrigatório');
    return true;
  }
}

class GetValidatedUserUseCase extends UseCase<{ id: string }, User> {
  constructor(private userService: UserService) {
    super();
  }

  async execute(input: { id: string }) {
    const errorMappings = [
      { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
      { errorType: AuthenticationError, failureType: 'AUTH_ERROR' },
      { errorType: NotFoundError, failureType: 'NOT_FOUND' }
    ];

    // 1. Buscar usuário (pode retornar null)
    const user = await this.userService.fetchUser(input.id);
    
    // 2. Validar se existe usando ResultWrapValue
    const userExistsResult = ResultWrapValue(user, {
      nullAsFailure: true,
      defaultFailureType: 'NOT_FOUND'
    });
    
    if (userExistsResult.isFailure()) {
      return Failure(new Error('Usuário não encontrado'), 'NOT_FOUND');
    }

    // 3. Validar dados do usuário usando ResultWrapper
    const validationResult = ResultWrapper(
      this.userService.validateUser.bind(this.userService),
      [user],
      { errorMappings }
    );

    if (validationResult.isFailure()) {
      return Failure(validationResult.getError(), validationResult.getType());
    }

    return Success(user);
  }
}

// Uso
const result = await GetValidatedUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('Usuário válido:', user))
  .onFailure((error) => console.error('Validação falhou'), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('Usuário não encontrado'), 'NOT_FOUND')
  .onFailure((error) => console.error('Token inválido'), 'AUTH_ERROR');
```

### 2. NestJS Integration Completa

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UseCase, Success, Failure, ResultWrapValue, ValidationError } from 'usecase_ts';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class CreateUserUseCase extends UseCase<CreateUserInput, CreateUserOutput> {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService
  ) {
    super();
  }

  async execute(input: CreateUserInput) {
    // 1. Validar input usando ResultWrapValue
    const inputValidation = ResultWrapValue(input, {
      customValidation: (data) => {
        if (!data.name || data.name.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (!data.email?.includes('@')) return 'Email inválido';
        if (!data.password || data.password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
        return true;
      },
      defaultFailureType: 'VALIDATION_ERROR'
    });

    if (inputValidation.isFailure()) {
      return Failure(inputValidation.getError(), inputValidation.getType());
    }

    // 2. Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    const emailCheck = ResultWrapValue(existingUser, {
      customValidation: (user) => {
        if (user !== null) return 'Email já está em uso';
        return true;
      },
      defaultFailureType: 'CONFLICT_ERROR'
    });

    if (emailCheck.isFailure()) {
      return Failure(emailCheck.getError(), emailCheck.getType());
    }

    // 3. Hash da senha usando ResultAsyncWrapper
    const hashResult = await ResultAsyncWrapper(
      this.passwordService.hash.bind(this.passwordService),
      [input.password],
      { defaultFailureType: 'HASH_ERROR' }
    );

    if (hashResult.isFailure()) {
      return Failure(hashResult.getError(), hashResult.getType());
    }

    // 4. Criar usuário
    const createResult = await ResultAsyncWrapper(
      this.userRepository.create.bind(this.userRepository),
      [{
        name: input.name,
        email: input.email,
        passwordHash: hashResult.getValue()
      }],
      { defaultFailureType: 'DATABASE_ERROR' }
    );

    if (createResult.isFailure()) {
      return Failure(createResult.getError(), createResult.getType());
    }

    // 5. Enviar email de boas-vindas (não-blocking)
    ResultAsyncWrapper(
      this.emailService.sendWelcome.bind(this.emailService),
      [input.email, input.name]
    ).then(emailResult => {
      if (emailResult.isFailure()) {
        console.warn('Falha ao enviar email:', emailResult.getError().message);
      }
    });

    return Success(createResult.getValue());
  }
}

// Controller
@Controller('users')
export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  @Post()
  async createUser(@Body() body: CreateUserInput) {
    const result = await this.createUserUseCase.call(body);
    
    return result
      .onSuccess((user) => ({ success: true, data: user }))
      .onFailure((error) => {
        throw new BadRequestException(error.message);
      }, 'VALIDATION_ERROR')
      .onFailure((error) => {
        throw new ConflictException(error.message);
      }, 'CONFLICT_ERROR')
      .onFailure((error) => {
        throw new InternalServerErrorException('Erro interno');
      });
  }
}
```

### 3. Data Processing Pipeline

```typescript
// Pipeline de processamento de dados com error handling robusto
class DataProcessingPipeline {
  async processCSVFile(file: File) {
    return ProcessFileUseCase.call({ file })
      .and_then(async (data) => {
        // Validar cada linha do CSV
        const validatedRows = data.rows.map(row => 
          ResultWrapValue(row, {
            customValidation: (row) => {
              if (!row.email?.includes('@')) return `Linha ${row.line}: Email inválido`;
              if (!row.name) return `Linha ${row.line}: Nome obrigatório`;
              return true;
            }
          })
        );

        const errors = validatedRows.filter(r => r.isFailure());
        if (errors.length > 0) {
          return Failure(
            new Error(`${errors.length} linhas inválidas`),
            'VALIDATION_ERROR'
          );
        }

        return Success({ validRows: validatedRows.map(r => r.getValue()) });
      })
      .and_then(async (data) => SaveDataUseCase.call({ rows: data.validRows }))
      .and_then(async (result) => SendNotificationUseCase.call({ 
        message: `${result.saved} registros processados` 
      }));
  }
}
```

## 📊 Comparação: Antes vs Depois

### ❌ Antes (com try/catch tradicional)

```typescript
class UserService {
  async getUser(id: string) {
    try {
      const user = await this.repository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.email?.includes('@')) {
        throw new Error('Invalid email');
      }
      
      return user;
    } catch (error) {
      // Erro pode ser qualquer coisa
      console.error(error);
      throw error; // Propaga erro
    }
  }
}

// Uso - sempre precisar de try/catch
try {
  const user = await userService.getUser('123');
  console.log(user);
} catch (error) {
  // Não sei que tipo de erro é
  console.error(error);
}
```

### ✅ Depois (com usecase_ts)

```typescript
class GetUserUseCase extends UseCase<{ id: string }, User> {
  async execute(input: { id: string }) {
    const user = await this.repository.findById(input.id);
    
    // Usar ResultWrapValue para validar
    return ResultWrapValue(user, {
      nullAsFailure: true,
      customValidation: (u) => {
        if (!u.email?.includes('@')) return 'Email inválido';
        return true;
      },
      defaultFailureType: 'USER_NOT_FOUND'
    });
  }
}

// Uso - sem try/catch, error handling tipado
const result = await GetUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('Usuário:', user))
  .onFailure((error) => console.error('Usuário não encontrado'), 'USER_NOT_FOUND')
  .onFailure((error) => console.error('Erro de validação'), 'VALIDATION_ERROR');
```

## 📚 API Reference Completa

### Core Classes

#### `Result<T>`
```typescript
interface Result<T> {
  getValue(): T;                          // Obter valor de sucesso
  getError(): Error;                      // Obter erro
  getType(): string;                      // Obter tipo ('SUCCESS', 'FAILURE', custom)
  isSuccess(): boolean;                   // Verificar se é sucesso
  isFailure(): boolean;                   // Verificar se é falha
  and_then<U>(fn): Promise<Result<U>>;    // Encadear operações
  onSuccess(fn): Result<T>;               // Callback para sucesso
  onFailure(fn, type?): Result<T>;        // Callback para falha
  context?: Record<string, any>;          // Contexto opcional
  useCaseClass?: string;                  // Nome da classe do use case
}
```

#### `UseCase<I, O>`
```typescript
abstract class UseCase<I, O> {
  abstract execute(input: I): Promise<Result<O>>;
  call(input: I): ResultPromise<O>;
  static call<I, O>(input: I): ResultPromise<O>;
}
```

### Factory Functions

#### `Success<T>(value, context?, useCaseClass?): Result<T>`
Criar um resultado de sucesso.

#### `Failure<T>(error, type?, context?, useCaseClass?): Result<T>`
Criar um resultado de falha.

### Wrapper Functions

#### `ResultWrapper<T>(fn, params?, options?): Result<T>`
Envolver funções síncronas para retornar Results.

```typescript
// Sem parâmetros
const result1 = ResultWrapper(() => getCurrentTime());

// Com parâmetros
const result2 = ResultWrapper(addNumbers, [5, 3]);

// Com options
const result3 = ResultWrapper(validateEmail, ['test@example.com'], {
  errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }]
});
```

#### `ResultAsyncWrapper<T>(fn, params?, options?): Promise<Result<T>>`
Envolver funções assíncronas para retornar Results.

#### `ResultWrapValue<T>(value, options?): Result<T>`
**NOVO!** Envolver valores já executados em Results.

```typescript
// Valor simples
const result1 = ResultWrapValue("hello");

// Com validações
const result2 = ResultWrapValue(user, {
  nullAsFailure: true,
  customValidation: (u) => u.email ? true : 'Email obrigatório'
});

// Erro capturado
const result3 = ResultWrapValue(caughtError);
```

#### `ResultWrapValueAsync<T>(value, options?): Promise<Result<T>>`
**NOVO!** Envolver valores/Promises assíncronos em Results.

```typescript
// Promise
const result1 = await ResultWrapValueAsync(fetchUser());

// Valor com validação async
const result2 = await ResultWrapValueAsync(someValue, {
  customValidation: async (val) => await validateWithAPI(val)
});
```

### Error Classes Pré-definidas

```typescript
ValidationError     // Para erros de validação
AuthenticationError // Para erros de autenticação  
AuthorizationError  // Para erros de autorização
NotFoundError      // Para recursos não encontrados
ConflictError      // Para conflitos de dados
```

### Configuration Types

```typescript
interface WrapperOptions {
  errorMappings?: Array<{
    errorType: new (...args: any[]) => Error;
    failureType: string;
  }>;
  defaultFailureType?: string;
  context?: Record<string, any>;
  useCaseClass?: string;
}

interface ValueWrapperOptions extends WrapperOptions {
  nullAsFailure?: boolean;           // null → Failure
  undefinedAsFailure?: boolean;      // undefined → Failure  
  emptyStringAsFailure?: boolean;    // "" → Failure
  zeroAsFailure?: boolean;           // 0 → Failure
  emptyArrayAsFailure?: boolean;     // [] → Failure
  emptyObjectAsFailure?: boolean;    // {} → Failure
  customValidation?: (value: any) => boolean | string;
}
```

## 🎯 Melhores Práticas

### 1. **Sempre retorne Results** 
```typescript
// ❌ Não faça
async execute(input) {
  if (!input.valid) throw new Error('Invalid');
  return data;
}

// ✅ Faça
async execute(input) {
  if (!input.valid) return Failure(new Error('Invalid'), 'VALIDATION_ERROR');
  return Success(data);
}
```

### 2. **Use wrappers para legacy code**
```typescript
// ❌ Não mude funções existentes
const user = await legacyFetchUser(id); // pode lançar exception

// ✅ Wrapper para segurança
const result = await ResultAsyncWrapper(legacyFetchUser, [id], {
  errorMappings: [{ errorType: NotFoundError, failureType: 'NOT_FOUND' }]
});
```

### 3. **Use ResultWrapValue para valores já processados**
```typescript
// ❌ Verificações manuais
if (user === null) {
  throw new Error('User not found');
}
if (!user.email) {
  throw new Error('Email required');
}

// ✅ Validação com ResultWrapValue
const result = ResultWrapValue(user, {
  nullAsFailure: true,
  customValidation: (u) => u.email ? true : 'Email obrigatório',
  defaultFailureType: 'USER_INVALID'
});
```

### 4. **Encadeie operações**
```typescript
// ✅ Encadeamento fluido
const result = await FirstUseCase.call(input)
  .and_then(async (data) => SecondUseCase.call(data))
  .and_then(async (data) => ThirdUseCase.call(data));
```

### 5. **Handle diferentes tipos de erro**
```typescript
result
  .onSuccess((data) => handleSuccess(data))
  .onFailure((error) => handleValidation(error), 'VALIDATION_ERROR')
  .onFailure((error) => handleNotFound(error), 'NOT_FOUND')
  .onFailure((error) => handleGeneric(error)); // Catch-all
```

## 🚀 Features

- ✅ **Type Safety**: Suporte completo ao TypeScript com generics
- ✅ **Zero Dependencies**: Sem dependências externas
- ✅ **Fluent API**: Operações encadeáveis com `and_then`
- ✅ **Error Mapping**: Transforme qualquer erro em falhas tipadas
- ✅ **Context Tracking**: Preservação automática de contexto
- ✅ **Legacy Integration**: Envolva funções existentes com wrappers
- ✅ **Value Wrapping**: Transforme valores/erros em Results
- ✅ **Framework Agnostic**: Funciona com qualquer framework
- ✅ **NestJS Ready**: Integração perfeita com injeção de dependência

## 🔄 Migration Guide

### De Exception-based para Result-based

```typescript
// Antes
class OldService {
  async getUser(id: string): Promise<User> {
    const user = await this.db.findUser(id);
    if (!user) throw new Error('Not found');
    if (!user.active) throw new Error('Inactive');
    return user;
  }
}

// Depois  
class NewService extends UseCase<{id: string}, User> {
  async execute(input: {id: string}) {
    const user = await this.db.findUser(input.id);
    
    return ResultWrapValue(user, {
      nullAsFailure: true,
      customValidation: (u) => u.active ? true : 'Usuário inativo',
      defaultFailureType: 'USER_NOT_FOUND'
    });
  }
}
```

## 📄 License

MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines.

1. Fork o repositório
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Escreva testes para suas mudanças
4. Certifique-se que todos os testes passam (`npm test`)
5. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
6. Push para a branch (`git push origin feature/nova-funcionalidade`)
7. Abra um Pull Request

## 📊 Stats

- **97 testes** passando
- **93% coverage**
- **Zero dependências**
- **TypeScript first**
- **Production ready**

---

Desenvolvido com ❤️ para a comunidade TypeScript