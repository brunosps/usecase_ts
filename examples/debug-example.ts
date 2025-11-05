// Complete debug example demonstrating all debug features
import { BaseUseCase, Success, Failure, ResultWrapper, ResultWrapValue } from '../src';

// Enable debug mode
process.env.USECASE_DEBUG = 'true';
process.env.USECASE_DEBUG_LEVEL = 'verbose';

// Example use cases
class UserValidationUseCase extends BaseUseCase<{ email: string, password: string }, { isValid: boolean }> {
  async execute(input: { email: string, password: string }) {
    if (!input.email) {
      return Failure(new Error('Email is required'), 'VALIDATION_ERROR');
    }
    
    if (!input.password || input.password.length < 6) {
      return Failure(new Error('Password must be at least 6 characters'), 'VALIDATION_ERROR');
    }
    
    // Simulate async validation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return Success({ isValid: true });
  }
}

class CreateUserUseCase extends BaseUseCase<{ email: string, password: string }, { id: string, email: string }> {
  async execute(input: { email: string, password: string }) {
    // Simulate user creation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Success({
      id: Math.random().toString(36).substr(2, 9),
      email: input.email
    });
  }
}

// External functions to wrap
function hashPassword(password: string): string {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  // Simulate password hashing
  return `hash_${password}`;
}

async function sendWelcomeEmail(email: string): Promise<boolean> {
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Simulate async email sending
  await new Promise(resolve => setTimeout(resolve, 30));
  return true;
}

async function debugExample() {
  console.log('=== usecase_ts Debug Example ===\n');
  
  console.log('1. Testing successful use case chain:');
  const registrationResult = await new UserValidationUseCase()
    .call({ email: 'user@example.com', password: 'secret123' })
    .and_then(async () => {
      return new CreateUserUseCase().call({ email: 'user@example.com', password: 'secret123' });
    });
  
  console.log('\n2. Testing validation failure:');
  await new UserValidationUseCase().call({ email: '', password: 'short' });
  
  console.log('\n3. Testing wrapper functions:');
  
  // Successful wrapper
  const hashResult = ResultWrapper(hashPassword, ['mypassword']);
  
  // Failed wrapper
  const failedHashResult = ResultWrapper(hashPassword, ['']);
  
  // Async wrapper success
  const emailResult = await ResultWrapper(sendWelcomeEmail, ['user@example.com']);
  
  // Async wrapper failure
  const failedEmailResult = await ResultWrapper(sendWelcomeEmail, ['invalid-email']);
  
  console.log('\n4. Testing value wrapping:');
  
  // Successful value wrap
  const validValue = ResultWrapValue('valid-data');
  
  // Failed value wrap
  const nullValue = ResultWrapValue(null, { nullAsFailure: true });
  
  // Async value wrap
  const promiseValue = await ResultWrapValue(Promise.resolve('async-data'));
  
  console.log('\n=== Debug Example Complete ===');
  console.log('\nNotice how debug output shows:');
  console.log('- ✅/❌ Success/failure indicators');
  console.log('- Execution times in milliseconds');
  console.log('- Error types and messages');
  console.log('- Function/use case names');
  console.log('- Input/output data in verbose mode');
}

// Run the debug example
debugExample().catch(console.error);