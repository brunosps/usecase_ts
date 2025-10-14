# 📚 usecase_ts Examples

This folder contains complete and practical examples of all **usecase_ts** library functionalities.

## 🚀 Quick Start

Run the complete example that demonstrates all functionalities:

```bash
npx ts-node examples/complete-demo.ts
```

## 📁 Examples Structure

### 1. 📖 [01-basic-usage.ts](./01-basic-usage.ts)
**Library fundamental concepts**

- ✅ Result, Success, Failure
- ✅ Basic Use Cases
- ✅ Context tracking
- ✅ Error handling by type
- ✅ Static vs instance methods

```bash
npx ts-node examples/01-basic-usage.ts
```

### 2. 🔄 [02-wrapper-functions.ts](./02-wrapper-functions.ts)
**ResultWrapper and ResultAsyncWrapper**

- ✅ Wrapping synchronous functions
- ✅ Wrapping asynchronous functions
- ✅ Error type mapping
- ✅ External library integration
- ✅ Advanced patterns

```bash
npx ts-node examples/02-wrapper-functions.ts
```

### 3. 📦 [03-value-wrapping.ts](./03-value-wrapping.ts) 
**ResultWrapValue and ResultWrapValueAsync**

- ✅ Wrapping already executed values
- ✅ Wrapping Promises and async values
- ✅ Comprehensive custom validations
- ✅ Real-world practical scenarios
- ✅ Approach comparison

```bash
npx ts-node examples/03-value-wrapping.ts
```

### 4. 🔗 [04-chaining-operations.ts](./04-chaining-operations.ts)
**Operation chaining with and_then**

- ✅ Basic and complex chaining
- ✅ Error handling at different points
- ✅ Conditional operations
- ✅ Wrapper integration
- ✅ Context tracking in chains

```bash
npx ts-node examples/04-chaining-operations.ts
```

### 5. 🏗️ [05-framework-integration.ts](./05-framework-integration.ts)
**Framework and library integration**

- ✅ Complete NestJS integration
- ✅ Express.js integration
- ✅ Usage with ORMs and HTTP libraries
- ✅ Clean architecture patterns

```bash
npx ts-node examples/05-framework-integration.ts
```

### 6. 🎪 [complete-demo.ts](./complete-demo.ts)
**Complete practical demo**

- ✅ All functionalities in practical examples
- ✅ No type errors - clean code
- ✅ Real use cases
- ✅ Before/after comparison
- ✅ Library statistics

```bash
npx ts-node examples/complete-demo.ts
```

### 7. 🌟 [value-wrapping-examples.ts](./value-wrapping-examples.ts)
**Detailed examples of value wrapping**

- ✅ Complete value wrapping scenarios
- ✅ Data pipeline
- ✅ API response validation
- ✅ Advanced error handling

```bash
npx ts-node examples/value-wrapping-examples.ts
```

### 8. 📋 [index.ts](./index.ts)
**Main file with interactive menu**

- ✅ Index of all examples
- ✅ Library statistics
- ✅ Before/after comparison
- ✅ Quick interactive demo

```bash
npx ts-node examples/index.ts
```

## 🎯 Demonstrated Functionalities

### Core Features
- **Result Pattern**: Success/Failure for flow control
- **Use Cases**: Business logic encapsulation
- **Context Tracking**: Automatic context tracking
- **Fluent API**: Elegant chaining with `and_then`

### Wrapper Functions
- **ResultWrapper**: Transform synchronous functions into Result-returning
- **ResultAsyncWrapper**: Transform asynchronous functions into Result-returning
- **ResultWrapValue**: Transform values into Results with validations
- **ResultWrapValueAsync**: Transform Promises/async values into Results

### Error Handling
- **Error Mapping**: Map specific error types
- **Type Safety**: Typed handling of different errors
- **Failure Types**: Custom failure categorization

### Validation Features
- **Null Safety**: `nullAsFailure`, `undefinedAsFailure`
- **Empty Checks**: `emptyStringAsFailure`, `emptyArrayAsFailure`, `emptyObjectAsFailure`
- **Zero Validation**: `zeroAsFailure`
- **Custom Validation**: Custom validation functions

## 🚀 How to Use

### 1. Run Specific Example
```bash
# Basic example
npx ts-node examples/01-basic-usage.ts

# Complete demonstration (recommended)
npx ts-node examples/complete-demo.ts

# Value wrapping features
npx ts-node examples/value-wrapping-examples.ts
```

### 2. Run All Examples
```bash
npx ts-node examples/index.ts
```

### 3. Explore Individually
Each file can be run independently and contains detailed explanations.

## 💡 Practical Use Cases

### 🔄 **Legacy Code Integration**
```typescript
// Existing function that might fail
const oldFunction = (data) => {
  if (!data) throw new Error('Invalid data');
  return processData(data);
};

// Transform into Result-safe
const safeResult = ResultWrapper(oldFunction, [data], {
  errorMappings: [{ errorType: Error, failureType: 'PROCESSING_ERROR' }]
});
```

### 📦 **API Response Validation**
```typescript
// Already executed API response
const apiResponse = await fetch('/api/user').then(r => r.json());

// Validate and transform into Result
const validatedUser = ResultWrapValue(apiResponse, {
  nullAsFailure: true,
  customValidation: (user) => {
    if (!user.email?.includes('@')) return 'Invalid email';
    if (!user.active) return 'Inactive user';
    return true;
  }
});
```

### 🔗 **Pipeline Processing**
```typescript
const result = await ValidateInputUseCase.call(input)
  .and_then(async (data) => ProcessDataUseCase.call(data))
  .and_then(async (processed) => SaveDataUseCase.call(processed));

result
  .onSuccess((saved) => console.log('Pipeline complete!'))
  .onFailure((error) => console.log('Pipeline failed:', error.message));
```

## 📊 Statistics

- **97 tests** passing (100% success rate)
- **93% code coverage**
- **Zero external dependencies**  
- **TypeScript first** with complete typing
- **4 wrapper functions** available
- **5 error classes** pre-defined

## 🎨 Demonstrated Benefits

### ❌ Before (Problems)
- try/catch everywhere
- Untyped errors
- Flow interrupted by exceptions  
- Scattered validations
- Difficult integration with existing code

### ✅ After (With usecase_ts)
- Errors contained in Results
- Specific types for each error
- Always controlled flow
- Centralized and reusable validations
- Gradual and simple integration

## 🤝 Contributions

Want to add more examples? 

1. Create a new `.ts` file in the `examples/` folder
2. Follow the pattern of existing examples
3. Add clear documentation
4. Test with `npx ts-node examples/your-file.ts`
5. Open a Pull Request!

## 📖 Complete Documentation

- [Main README](../README.md)
- [API Documentation](../src/)
- [Tests](../src/*.test.ts)

---

**💡 Tip**: Start with `complete-demo.ts` to see all functionalities in action!

🎉 **Happy coding with usecase_ts!** 🎉