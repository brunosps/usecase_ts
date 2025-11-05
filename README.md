[![CI](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/usecase_ts.svg)](https://badge.fury.io/js/usecase_ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen.svg)](https://github.com/brunosps/usecase_ts)

# usecase_ts

A robust **Result Pattern** implementation for TypeScript, designed to manage error flows elegantly and predictably. Inspired by [u-case](https://github.com/serradura/u-case) and optimized for modern development.

## 🎯 Why use usecase_ts?

- ✅ **Zero Exceptions**: Eliminate unnecessary try/catch and unhandled errors
- ✅ **Type Safety**: Complete typing with TypeScript generics
- ✅ **Fluent API**: Elegant operation chaining with `and_then`
- ✅ **Legacy Integration**: Transform any function/value into Result
- ✅ **Framework Agnostic**: Works with any framework (NestJS, Express, etc.)
- ✅ **Rich Error Handling**: Custom error type mapping
- ✅ **Context Tracking**: Automatic context tracking

## 📦 Instalação

```bash
npm install usecase_ts
```

## 🎮 Exemplos Práticos

Execute exemplos completos para ver todas as funcionalidades:

```bash
# Demo completo com todas as funcionalidades
npm run demo

# Foco em value wrapping
npm run value-wrap

# Showcase completo
npm run showcase

# Menu interativo de exemplos
npm run examples
```

## 🚀 Quick Start

```typescript
import { UseCase, Success, Failure, ResultWrapValue } from 'usecase_ts';

// Simple Use Case
class GetUserUseCase extends UseCase<{ id: string }, { name: string, email: string }> {
  async execute(input: { id: string }) {
    if (!input.id) {
      return Failure(new Error('ID is required'), 'VALIDATION_ERROR');
    }
    
    return Success({ name: 'John Doe', email: 'john@example.com' });
  }
}

// Basic usage
const result = await GetUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('User:', user))
  .onFailure((error) => console.error('Error:', error.message));

// Transform existing values into Results
const existingValue = "Hello World";
const wrappedResult = ResultWrapValue(existingValue);
// → Success<string>

const errorValue = new Error("Something went wrong");
const wrappedError = ResultWrapValue(errorValue);
// → Failure<any>
```

## 🎨 Core Concepts

### 1. Result Pattern

Every operation returns a `Result<T>` that can be:

```typescript
// Success - contains data
Success(data)

// Failure - contains error and type
Failure(error, type)
```

### 2. Use Cases

Encapsulate business logic in classes that extend `UseCase<Input, Output>`:

```typescript
class CalculateUseCase extends UseCase<{ a: number, b: number }, { result: number }> {
  async execute(input: { a: number, b: number }) {
    if (typeof input.a !== 'number' || typeof input.b !== 'number') {
      return Failure(new Error('Invalid input'), 'VALIDATION_ERROR');
    }
    
    return Success({ result: input.a + input.b });
  }
}
```

### 3. Wrappers

#### 3.1 ResultWrapper - For Functions

Transform any function into one that returns Result:

```typescript
import { ResultWrapper, ValidationError } from 'usecase_ts';

// Existing function that might throw
const validateEmail = (email: string) => {
  if (!email.includes('@')) throw new ValidationError('Invalid email');
  return true;
};

// Wrapped - will never throw exceptions
const result = ResultWrapper(validateEmail, ['email@test.com'], {
  errorMappings: [
    { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
  ]
});

result
  .onSuccess(() => console.log('Valid email!'))
  .onFailure((error) => console.log('Invalid email:', error.message), 'VALIDATION_ERROR');
```

#### 3.2 ResultWrapValue - For Executed Values

Transform already executed values (including errors, null, undefined) into Results:

```typescript
import { ResultWrapValue } from 'usecase_ts';

// Scenario 1: Valid value
const data = { id: 1, name: 'John' };
const result1 = ResultWrapValue(data);
// → Success<{id: number, name: string}>

// Scenario 2: Caught error
let capturedError: Error | null = null;
try {
  JSON.parse('invalid json');
} catch (error) {
  capturedError = error as Error;
}
const result2 = ResultWrapValue(capturedError);
// → Failure<any>

// Scenario 3: Value that might be null/undefined
const user = findUserById('999'); // might return null
const result3 = ResultWrapValue(user, {
  nullAsFailure: true,
  defaultFailureType: 'USER_NOT_FOUND'
});
// → Failure if user is null

// Scenario 4: Custom validations
const result4 = ResultWrapValue(someValue, {
  customValidation: (value) => {
    if (value < 0) return 'Value must be positive';
    return true;
  }
});
```

## 🔧 Advanced Features

### 1. Error Mapping

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

// Use in any wrapper
const result = ResultWrapper(riskyFunction, [params], { errorMappings });
```

### 2. Operation Chaining

```typescript
const result = await ValidateInputUseCase.call({ email: 'user@test.com' })
  .and_then(async (data) => FindUserUseCase.call({ email: data.email }))
  .and_then(async (user) => SendEmailUseCase.call({ userId: user.id }))
  .and_then(async (emailResult) => LogActivityUseCase.call({ 
    action: 'email_sent', 
    success: emailResult.sent 
  }));

result
  .onSuccess((log) => console.log('Complete process:', log))
  .onFailure((error) => console.error('Validation failed'), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('User not found'), 'NOT_FOUND')
  .onFailure((error) => console.error('General failure'));
```

### 3. Advanced Validations with ResultWrapValue

```typescript
// Example: API response validation
const apiResponse = await fetch('/api/user/123').then(r => r.json());

const validatedResponse = ResultWrapValue(apiResponse, {
  // Basic validations
  nullAsFailure: true,
  undefinedAsFailure: true,
  emptyObjectAsFailure: true,
  
  // Custom validation
  customValidation: (user) => {
    if (!user.id) return 'ID is required';
    if (!user.email?.includes('@')) return 'Invalid email';
    if (!user.name || user.name.length < 2) return 'Name too short';
    return true;
  },
  
  // Context for debugging
  context: { source: 'api_user_fetch' },
  useCaseClass: 'UserValidation'
});

validatedResponse
  .onSuccess((user) => console.log('Valid user:', user))
  .onFailure((error) => console.error('Invalid user:', error.message));
```

### 4. Async/Await Integration

```typescript
import { ResultWrapValueAsync } from 'usecase_ts';

// For Promises or async values
const processUser = async (userId: string) => {
  const userPromise = fetch(`/api/users/${userId}`).then(r => r.json());
  
  const result = await ResultWrapValueAsync(userPromise, {
    customValidation: (user) => {
      if (!user || !user.active) return 'Inactive user';
      return true;
    },
    errorMappings: [
      { errorType: Error, failureType: 'API_ERROR' }
    ]
  });
  
  return result;
};
```

## 🏗️ Real-World Examples

### 1. Service Layer with Error Handling

```typescript
class UserService {
  async fetchUser(id: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (response.status === 404) return null;
      if (response.status === 401) throw new AuthenticationError('Token expired');
      if (!response.ok) throw new Error('API error');
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  validateUser(user: User): boolean {
    if (!user.email) throw new ValidationError('Email required');
    if (!user.name) throw new ValidationError('Name required');
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

    // 1. Fetch user (might return null)
    const user = await this.userService.fetchUser(input.id);
    
    // 2. Validate existence using ResultWrapValue
    const userExistsResult = ResultWrapValue(user, {
      nullAsFailure: true,
      defaultFailureType: 'NOT_FOUND'
    });
    
    if (userExistsResult.isFailure()) {
      return Failure(new Error('User not found'), 'NOT_FOUND');
    }

    // 3. Validate user data using ResultWrapper
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

// Usage
const result = await GetValidatedUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('Valid user:', user))
  .onFailure((error) => console.error('Validation failed'), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('User not found'), 'NOT_FOUND')
  .onFailure((error) => console.error('Invalid token'), 'AUTH_ERROR');
```

### 2. Complete NestJS Integration

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

    // 2. Check if email already exists
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

    // 4. Create user
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
// Data processing pipeline with robust error handling
class DataProcessingPipeline {
  async processCSVFile(file: File) {
    return ProcessFileUseCase.call({ file })
      .and_then(async (data) => {
        // Validar cada linha do CSV
        const validatedRows = data.rows.map(row => 
          ResultWrapValue(row, {
            customValidation: (row) => {
              if (!row.email?.includes('@')) return `Linha ${row.line}: Email inválido`;
              if (!row.name) return `Line ${row.line}: Name required`;
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

## 📊 Comparison: Before vs After

### ❌ Before (with traditional try/catch)

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
      // Error can be anything
      console.error(error);
      throw error; // Propagates error
    }
  }
}

// Usage - always need try/catch
try {
  const user = await userService.getUser('123');
  console.log(user);
} catch (error) {
  // Don't know what type of error it is
  console.error(error);
}
```

### ✅ After (with usecase_ts)

```typescript
class GetUserUseCase extends UseCase<{ id: string }, User> {
  async execute(input: { id: string }) {
    const user = await this.repository.findById(input.id);
    
    // Use ResultWrapValue to validate
    return ResultWrapValue(user, {
      nullAsFailure: true,
      customValidation: (u) => {
        if (!u.email?.includes('@')) return 'Invalid email';
        return true;
      },
      defaultFailureType: 'USER_NOT_FOUND'
    });
  }
}

// Usage - no try/catch, typed error handling
const result = await GetUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('User:', user))
  .onFailure((error) => console.error('User not found'), 'USER_NOT_FOUND')
  .onFailure((error) => console.error('Validation error'), 'VALIDATION_ERROR');
```

## 📚 Complete API Reference

### Core Classes

#### `Result<T>`
```typescript
interface Result<T> {
  getValue(): T;                          // Get success value
  getError(): Error;                      // Get error
  getType(): string;                      // Get type ('SUCCESS', 'FAILURE', custom)
  isSuccess(): boolean;                   // Check if success
  isFailure(): boolean;                   // Check if failure
  and_then<U>(fn): Promise<Result<U>>;    // Chain operations
  onSuccess(fn): Result<T>;               // Success callback
  onFailure(fn, type?): Result<T>;        // Failure callback
  context?: Record<string, any>;          // Optional context
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
Wrap synchronous functions to return Results.

```typescript
// Without parameters
const result1 = ResultWrapper(() => getCurrentTime());

// With parameters
const result2 = ResultWrapper(addNumbers, [5, 3]);

// With options
const result3 = ResultWrapper(validateEmail, ['test@example.com'], {
  errorMappings: [{ errorType: ValidationError, failureType: 'VALIDATION_ERROR' }]
});
```

#### `ResultAsyncWrapper<T>(fn, params?, options?): Promise<Result<T>>`
Wrap asynchronous functions to return Results.

#### `ResultWrapValue<T>(value, options?): Result<T>`
Wrap already executed values into Results.

```typescript
// Valor simples
const result1 = ResultWrapValue("hello");

// Com validações
const result2 = ResultWrapValue(user, {
  nullAsFailure: true,
  customValidation: (u) => u.email ? true : 'Email required'
});

// Erro capturado
const result3 = ResultWrapValue(caughtError);
```

#### `ResultWrapValueAsync<T>(value, options?): Promise<Result<T>>`
Wrap async values/Promises into Results.

```typescript
// Promise
const result1 = await ResultWrapValueAsync(fetchUser());

// Value with async validation
const result2 = await ResultWrapValueAsync(someValue, {
  customValidation: async (val) => await validateWithAPI(val)
});
```

### Error Classes Pré-definidas

```typescript
ValidationError     // For validation errors
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

## 🎯 Best Practices

### 1. **Always return Results** 
```typescript
// ❌ Don't do
async execute(input) {
  if (!input.valid) throw new Error('Invalid');
  return data;
}

// ✅ Do
async execute(input) {
  if (!input.valid) return Failure(new Error('Invalid'), 'VALIDATION_ERROR');
  return Success(data);
}
```

### 2. **Use wrappers for legacy code**
```typescript
// ❌ Don't change existing functions
const user = await legacyFetchUser(id); // might throw exception

// ✅ Wrapper for safety
const result = await ResultAsyncWrapper(legacyFetchUser, [id], {
  errorMappings: [{ errorType: NotFoundError, failureType: 'NOT_FOUND' }]
});
```

### 3. **Use ResultWrapValue for already processed values**
```typescript
// ❌ Manual checks
if (user === null) {
  throw new Error('User not found');
}
if (!user.email) {
  throw new Error('Email required');
}

// ✅ Validation with ResultWrapValue
const result = ResultWrapValue(user, {
  nullAsFailure: true,
  customValidation: (u) => u.email ? true : 'Email required',
  defaultFailureType: 'USER_INVALID'
});
```

### 4. **Chain operations**
```typescript
// ✅ Fluent chaining
const result = await FirstUseCase.call(input)
  .and_then(async (data) => SecondUseCase.call(data))
  .and_then(async (data) => ThirdUseCase.call(data));
```

### 5. **Handle different error types**
```typescript
result
  .onSuccess((data) => handleSuccess(data))
  .onFailure((error) => handleValidation(error), 'VALIDATION_ERROR')
  .onFailure((error) => handleNotFound(error), 'NOT_FOUND')
  .onFailure((error) => handleGeneric(error)); // Catch-all
```

## 🚀 Features

- ✅ **Type Safety**: Complete TypeScript support with generics
- ✅ **Zero Dependencies**: No external dependencies  
- ✅ **Fluent API**: Chainable operations with `and_then`
- ✅ **Error Mapping**: Transform any error into typed failures
- ✅ **Context Tracking**: Automatic context preservation
- ✅ **Legacy Integration**: Wrap existing functions with wrappers
- ✅ **Value Wrapping**: Transform values/errors into Results
- ✅ **Framework Agnostic**: Works with any framework
- ✅ **NestJS Ready**: Perfect integration with dependency injection
- ✅ **Rich Examples**: Complete examples in /examples folder
- ✅ **Interactive Demos**: Run `npm run demo` for hands-on experience

## 🔄 Migration Guide

### From Exception-based to Result-based

```typescript
// Before
class OldService {
  async getUser(id: string): Promise<User> {
    const user = await this.db.findUser(id);
    if (!user) throw new Error('Not found');
    if (!user.active) throw new Error('Inactive');
    return user;
  }
}

// After  
class NewService extends UseCase<{id: string}, User> {
  async execute(input: {id: string}) {
    const user = await this.db.findUser(input.id);
    
    return ResultWrapValue(user, {
      nullAsFailure: true,
      customValidation: (u) => u.active ? true : 'Inactive user',
      defaultFailureType: 'USER_NOT_FOUND'
    });
  }
}
```

## 📄 License

MIT - see the [LICENSE](LICENSE) file for details.

## 🐛 Debug & Development

usecase_ts includes comprehensive debug functionality to help during development and troubleshooting.

### Environment Variables

```bash
# Enable debug logging
USECASE_DEBUG=true
# or
USECASETS_DEBUG=true

# Set debug level (basic or verbose)
USECASE_DEBUG_LEVEL=verbose

# Auto-enable debug in development
NODE_ENV=development
```

### Debug Output

```typescript
// Set environment variable
process.env.USECASE_DEBUG = 'true';

class UserRegistrationUseCase extends BaseUseCase {
  async execute(input: { email: string }) {
    if (!input.email) {
      return Failure(new Error('Email required'), 'VALIDATION_ERROR');
    }
    return Success({ userId: '123', email: input.email });
  }
}

// Execution will show debug output:
await new UserRegistrationUseCase().call({ email: 'user@example.com' });
// ✅ [USECASE:SUCCESS] UserRegistrationUseCase (15ms)

await new UserRegistrationUseCase().call({});
// ❌ [USECASE:FAILURE] UserRegistrationUseCase (2ms) - VALIDATION_ERROR: Email required
```

### Verbose Mode

Set `USECASE_DEBUG_LEVEL=verbose` for detailed logging:

```bash
🚀 [USECASE:START] UserRegistrationUseCase {
  input: { email: 'user@example.com' },
  timestamp: '2023-11-05T12:00:00.000Z'
}

✅ [USECASE:SUCCESS] UserRegistrationUseCase {
  duration: '15ms',
  output: { userId: '123', email: 'user@example.com' },
  timestamp: '2023-11-05T12:00:00.015Z'
}
```

### Wrapper Functions Debug

Debug also works with wrapper functions:

```typescript
process.env.USECASE_DEBUG = 'true';

// Will log: ✅ [ResultWrapper:SUCCESS] myFunction (5ms)
const result = ResultWrapper(myFunction, [params]);

// Will log: ❌ [ResultWrapValue:FAILURE] validation - Value is null
const result2 = ResultWrapValue(null, { nullAsFailure: true });
```

### Sensitive Data

Debug automatically sanitizes sensitive data in verbose mode:
- `password`, `token`, `apiKey`, `authorization` fields are replaced with `[REDACTED]`

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Write tests for your changes
4. Make sure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add new feature'`)
6. Push to the branch (`git push origin feature/new-feature`)
7. Open a Pull Request

## 📊 Stats

- **110 tests** passing
- **94% coverage**
- **Zero dependencies**
- **TypeScript first**
- **Production ready**
- **Debug functionality** for development

---

Built with ❤️ for the TypeScript community