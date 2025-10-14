# usecase_ts Copilot Instructions

This TypeScript library implements the Result pattern for elegant error handling and use case orchestration, inspired by Ruby's u-case gem.

## Core Architecture

### Result Pattern Implementation
- **Result<T>**: Central class wrapping success/failure states with typed data
- **Success(value)** and **Failure(error, type)**: Factory functions for result creation
- **ResultPromise<T>**: Promise wrapper enabling fluent chaining operations
- Three-state system: `SUCCESS`, custom failure types (e.g., `VALIDATION_ERROR`), and `UNEXPECTED_ERROR`

### Use Case Pattern
- **UseCase<I, O>**: Abstract base class for business logic encapsulation
- **BaseUseCase<I, O>**: Concrete implementation with error handling
- Both instance `.call(params)` and static `UseCase.call(params)` methods return `ResultPromise<O>`
- Automatic context tracking with input/output parameters via `Context<I, O>`

## Key Patterns & Conventions

### Chaining Operations
```typescript
// Primary chaining pattern using and_then
const result = await FirstUseCase.call(input)
  .and_then(async (data) => SecondUseCase.call({ param: data.id }))
  .and_then(async (data) => ThirdUseCase.call({ value: data.result }));
```

### Error Handling by Type
```typescript
result
  .onSuccess((data) => handleSuccess(data))
  .onFailure((error) => handleValidation(error), 'VALIDATION_ERROR')
  .onFailure((error) => handleAuth(error), 'AUTHENTICATION_ERROR')
  .onFailure((error) => handleGeneric(error)); // Default 'FAILURE'
```

### Use Case Implementation
- Always extend `UseCase<InputType, OutputType>`
- Implement `async execute(input?: InputType): Promise<Result<OutputType>>`
- Return `Success(data)` or `Failure(error, type)` - never throw exceptions
- Use `.call()` method for execution to get automatic error wrapping

### ResultWrapper for Legacy Integration
- **ResultWrapper**: Transforms non-Result functions into Result-returning functions
- **Simplified API**: Only 2 functions - `ResultWrapper()` (sync) and `ResultAsyncWrapper()` (async)
- **Auto-detection**: Automatically detects if parameters are provided
- Error mapping: Map specific error types to failure types via `errorMappings`
- Includes pre-built error classes: `ValidationError`, `AuthenticationError`, `NotFoundError`, etc.
- Usage: `ResultWrapper(fn, [params], { errorMappings, context })` or `ResultWrapper(fn, { options })`

## Development Workflow

### Testing
- **Test Command**: `npm test` (uses Jest with ts-jest preset)
- **Watch Mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
- Test files: `*.test.ts` in `src/` directory
- Mock use cases by extending base classes and overriding `execute()`

### Build & Quality
- **Build**: `npm run build` (TypeScript → `lib/` directory)
- **Lint**: `npm run lint` (ESLint + Prettier)
- **Auto-fix**: `npm run lint:fix`
- **Format**: `npm run format`

### Context Tracking
- Each use case execution automatically creates `Context<I, O>` with input/output
- Context merges across chained operations via `and_then()`
- Access via `result.context[UseCaseName]._inputParams` and `._outputParams`

## Project Structure
```
src/
├── index.ts              # Main exports
├── result.ts             # Result, Success, Failure, ResultPromise
├── use-case.ts           # UseCase abstract class and BaseUseCase
├── context.ts            # Context tracking implementation
├── result-wrapper.ts     # ResultWrapper for legacy function integration
└── *.test.ts             # Jest test files
```

## Integration Notes

### NestJS Pattern
- Use `@Injectable()` decorator on use case classes
- Inject dependencies in constructor, call `super()`
- Common pattern: service composition through constructor injection

### Error Type Conventions
- `SUCCESS`: Default success state
- `VALIDATION_ERROR`: Input validation failures
- `AUTHENTICATION_ERROR`: Auth-related failures  
- `UNEXPECTED_ERROR`: Uncaught exceptions (automatic)
- Custom types: Use descriptive UPPER_SNAKE_CASE strings

## Critical Details
- **Never throw in execute()**: Always return Result objects
- **Type safety**: Input/Output generics enforce compile-time checking
- **Promise handling**: Use `ResultPromise` for fluent async operations
- **Static vs Instance**: Both `UseCase.call()` and `instance.call()` supported
- **Context inheritance**: Previous use case contexts preserved in chains