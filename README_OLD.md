[![CI](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/brunosps/usecase_ts/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/usecase_ts.svg)](https://badge.fury.io/js/usecase_ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# usecase_ts

A robust implementation of the Result pattern for TypeScript, designed to manage error flows in an elegant and predictable way. Inspired by [u-case](https://github.com/serradura/u-case).

## 📦 Installation

```bash
npm install usecase_ts
```

## 🚀 Quick Start

```typescript
import { Result, Success, Failure, UseCase } from 'usecase_ts';

// Simple use case
class GetUserUseCase extends UseCase<{ id: string }, { name: string, email: string }> {
  async execute(input: { id: string }): Promise<Result<{ name: string, email: string }>> {
    if (!input.id) {
      return Failure(new Error('ID is required'), 'VALIDATION_ERROR');
    }
    
    return Success({ name: 'John Doe', email: 'john@example.com' });
  }
}

// Usage
const result = await GetUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('User:', user))
  .onFailure((error) => console.error('Error:', error.message));
```

## 🎯 Core Concepts

### Result Pattern

Every operation returns a `Result<T>` that can be either:
- `Success(data)` - Contains the successful result
- `Failure(error, type)` - Contains error information and type

### Use Cases

Encapsulate business logic in classes that extend `UseCase<Input, Output>`:

```typescript
class CalculateUseCase extends UseCase<{ a: number, b: number }, { result: number }> {
  async execute(input: { a: number, b: number }): Promise<Result<{ result: number }>> {
    if (typeof input.a !== 'number' || typeof input.b !== 'number') {
      return Failure(new Error('Invalid input'), 'VALIDATION_ERROR');
    }
    
    return Success({ result: input.a + input.b });
  }
}
```

## 🔧 Advanced Features

### 1. ResultWrapper - Transform Legacy Functions

Transform any function into a Result-returning function:

```typescript
import { ResultWrapper, ResultAsyncWrapper, ValidationError } from 'usecase_ts';

// Sync function without parameters
const getCurrentTime = () => new Date().toISOString();
const result = ResultWrapper(getCurrentTime);
// Result<string>

// Sync function with parameters
const addNumbers = (a: number, b: number) => {
  if (a < 0 || b < 0) throw new ValidationError('Numbers must be positive');
  return a + b;
};

const result = ResultWrapper(addNumbers, [5, 3], {
  errorMappings: [
    { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
  ]
});
// Result<number>

// Async function
const fetchUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
};

const result = await ResultAsyncWrapper(fetchUser, ['123'], {
  defaultFailureType: 'API_ERROR',
  context: { operation: 'fetch_user' }
});
// Promise<Result<User>>
```

### 2. Error Mapping

Map specific error types to custom failure types:

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

const validateUser = (email: string) => {
  if (!email) throw new ValidationError('Email is required');
  if (!email.includes('@')) throw new ValidationError('Invalid email format');
  return true;
};

const result = ResultWrapper(validateUser, ['invalid-email'], { errorMappings });

result
  .onSuccess((isValid) => console.log('Valid email'))
  .onFailure((error) => console.error('Validation failed:', error.message), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('Unexpected error:', error.message), 'FAILURE');
```

### 3. Chaining Operations

Chain multiple use cases together with automatic error propagation:

```typescript
class ValidateInputUseCase extends UseCase<{ email: string }, { email: string }> {
  async execute(input: { email: string }): Promise<Result<{ email: string }>> {
    if (!input.email.includes('@')) {
      return Failure(new Error('Invalid email'), 'VALIDATION_ERROR');
    }
    return Success({ email: input.email });
  }
}

class FindUserUseCase extends UseCase<{ email: string }, { id: string, name: string }> {
  async execute(input: { email: string }): Promise<Result<{ id: string, name: string }>> {
    // Simulate database lookup
    if (input.email === 'notfound@example.com') {
      return Failure(new Error('User not found'), 'NOT_FOUND');
    }
    return Success({ id: '123', name: 'John Doe' });
  }
}

class SendEmailUseCase extends UseCase<{ id: string, name: string }, { sent: boolean }> {
  async execute(input: { id: string, name: string }): Promise<Result<{ sent: boolean }>> {
    // Simulate email sending
    return Success({ sent: true });
  }
}

// Chain use cases
const result = await ValidateInputUseCase.call({ email: 'user@example.com' })
  .and_then(async (data) => FindUserUseCase.call({ email: data.email }))
  .and_then(async (user) => SendEmailUseCase.call({ id: user.id, name: user.name }));

result
  .onSuccess((data) => console.log('Email sent successfully'))
  .onFailure((error) => console.error('Validation failed:', error.message), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('User not found:', error.message), 'NOT_FOUND')
  .onFailure((error) => console.error('Process failed:', error.message));
```

### 4. Context Tracking

Track execution context across chained operations:

```typescript
const result = await FirstUseCase.call({ input: 'test' })
  .and_then(async (data) => SecondUseCase.call({ value: data.output }));

// Access context from any use case in the chain
console.log(result.context.FirstUseCase._inputParams);  // { input: 'test' }
console.log(result.context.FirstUseCase._outputParams); // { output: 'result' }
console.log(result.context.SecondUseCase._inputParams); // { value: 'result' }
```

## 🏗️ Real-World Examples

### API Service Integration

```typescript
class UserService {
  async fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (response.status === 404) throw new NotFoundError('User not found');
    if (response.status === 401) throw new AuthenticationError('Unauthorized');
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }

  validateUser(user: User): boolean {
    if (!user.email) throw new ValidationError('Email is required');
    if (!user.name) throw new ValidationError('Name is required');
    return true;
  }
}

class GetAndValidateUserUseCase extends UseCase<{ id: string }, User> {
  constructor(private userService: UserService) {
    super();
  }

  async execute(input: { id: string }): Promise<Result<User>> {
    const errorMappings = [
      { errorType: ValidationError, failureType: 'VALIDATION_ERROR' },
      { errorType: AuthenticationError, failureType: 'AUTH_ERROR' },
      { errorType: NotFoundError, failureType: 'NOT_FOUND' }
    ];

    // Fetch user using wrapper
    const fetchResult = await ResultAsyncWrapper(
      this.userService.fetchUser.bind(this.userService),
      [input.id],
      { errorMappings, context: { operation: 'fetch_user' } }
    );

    if (fetchResult.isFailure()) {
      return Failure(fetchResult.getError(), fetchResult.getType());
    }

    // Validate user using wrapper
    const validationResult = ResultWrapper(
      this.userService.validateUser.bind(this.userService),
      [fetchResult.getValue()],
      { errorMappings, context: { operation: 'validate_user' } }
    );

    if (validationResult.isFailure()) {
      return Failure(validationResult.getError(), validationResult.getType());
    }

    return Success(fetchResult.getValue());
  }
}

// Usage
const result = await GetAndValidateUserUseCase.call({ id: '123' });

result
  .onSuccess((user) => console.log('Valid user:', user))
  .onFailure((error) => console.error('Validation error:', error.message), 'VALIDATION_ERROR')
  .onFailure((error) => console.error('User not found:', error.message), 'NOT_FOUND')
  .onFailure((error) => console.error('Authentication error:', error.message), 'AUTH_ERROR')
  .onFailure((error) => console.error('Unexpected error:', error.message));
```

### NestJS Integration

```typescript
import { Injectable } from '@nestjs/common';
import { Result, Success, Failure, UseCase } from 'usecase_ts';

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

  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput>> {
    // Validate input
    const validationResult = ResultWrapper(this.validateInput.bind(this), [input], {
      errorMappings: [
        { errorType: ValidationError, failureType: 'VALIDATION_ERROR' }
      ]
    });

    if (validationResult.isFailure()) {
      return Failure(validationResult.getError(), validationResult.getType());
    }

    // Check if email exists
    const emailExistsResult = await ResultAsyncWrapper(
      this.userRepository.findByEmail.bind(this.userRepository),
      [input.email],
      { defaultFailureType: 'DATABASE_ERROR' }
    );

    if (emailExistsResult.isSuccess() && emailExistsResult.getValue()) {
      return Failure(new Error('Email already exists'), 'CONFLICT_ERROR');
    }

    // Hash password
    const hashResult = await ResultAsyncWrapper(
      this.passwordService.hash.bind(this.passwordService),
      [input.password],
      { defaultFailureType: 'HASH_ERROR' }
    );

    if (hashResult.isFailure()) {
      return Failure(hashResult.getError(), hashResult.getType());
    }

    // Create user
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

    // Send welcome email (non-blocking)
    ResultAsyncWrapper(
      this.emailService.sendWelcome.bind(this.emailService),
      [input.email, input.name],
      { defaultFailureType: 'EMAIL_ERROR' }
    ).then(emailResult => {
      if (emailResult.isFailure()) {
        console.warn('Failed to send welcome email:', emailResult.getError().message);
      }
    });

    return Success(createResult.getValue());
  }

  private validateInput(input: CreateUserInput): boolean {
    if (!input.name || input.name.length < 2) {
      throw new ValidationError('Name must have at least 2 characters');
    }
    if (!input.email || !input.email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }
    if (!input.password || input.password.length < 8) {
      throw new ValidationError('Password must have at least 8 characters');
    }
    return true;
  }
}

// Controller usage
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
        throw new InternalServerErrorException('Internal server error');
      });
  }
}
```

## 📚 API Reference

### Core Classes

#### `Result<T>`
- `getValue(): T` - Get the success value
- `getError(): Error` - Get the error object
- `getType(): string` - Get the result type ('SUCCESS', 'FAILURE', or custom)
- `isSuccess(): boolean` - Check if result is successful
- `isFailure(): boolean` - Check if result is a failure
- `and_then<U>(fn): Promise<Result<U>>` - Chain operations
- `onSuccess(fn): Result<T>` - Execute callback on success
- `onFailure(fn, type?): Result<T>` - Execute callback on failure

#### `UseCase<I, O>`
- `execute(input: I): Promise<Result<O>>` - Override this method
- `call(input: I): ResultPromise<O>` - Execute the use case
- `static call<I, O>(input: I): ResultPromise<O>` - Static execution

### Factory Functions

#### `Success<T>(value: T, context?, useCaseClass?): Result<T>`
Create a successful result.

#### `Failure<T>(error: Error, type?, context?, useCaseClass?): Result<T>`
Create a failed result.

#### `ResultWrapper<T>(fn, params?, options?): Result<T>`
Wrap synchronous functions to return Results.

#### `ResultAsyncWrapper<T>(fn, params?, options?): Promise<Result<T>>`
Wrap asynchronous functions to return Results.

### Error Classes

- `ValidationError` - For input validation errors
- `AuthenticationError` - For authentication failures
- `AuthorizationError` - For authorization failures
- `NotFoundError` - For missing resources
- `ConflictError` - For data conflicts

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
```

## 🎨 Best Practices

1. **Always return Results** - Never throw exceptions in use case execute methods
2. **Use specific error types** - Map different errors to meaningful failure types
3. **Chain operations** - Use `and_then` for sequential operations with automatic error handling
4. **Handle all error types** - Use multiple `onFailure` calls for different error scenarios
5. **Leverage context** - Include relevant context information for debugging and monitoring
6. **Wrap legacy code** - Use ResultWrapper to gradually adopt the Result pattern

## 🚀 Features

- ✅ **Type Safety** - Full TypeScript support with generic types
- ✅ **Zero Dependencies** - No external dependencies
- ✅ **Fluent API** - Chainable operations with `and_then`
- ✅ **Error Mapping** - Transform any error into typed failures
- ✅ **Context Tracking** - Automatic context preservation across chains
- ✅ **Legacy Integration** - Wrap existing functions with ResultWrapper
- ✅ **Framework Agnostic** - Works with any TypeScript/JavaScript framework
- ✅ **NestJS Ready** - Perfect integration with dependency injection

## 📄 License

MIT - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request