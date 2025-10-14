/**
 * Exemplos de integração com frameworks populares
 * NestJS, Express, e outros casos de uso práticos
 */

import { NotFoundError, ValidationError } from '.';

import { 
  UseCase, 
  Success, 
  Failure, 
  Result,
  ResultWrapper,
  ResultAsyncWrapper,
  ResultWrapValue,
} from '../src';

// =============================================================================
// 1. INTEGRAÇÃO COM NESTJS
// =============================================================================

// Simula decorators do NestJS
const Injectable = () => (target: any) => target;
const Controller = (path: string) => (target: any) => target;
const Post = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {};
const Body = () => (target: any, propertyKey: string, parameterIndex: number) => {};

// Interfaces
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

// Simulação de serviços
class UserRepository {
  async findByEmail(email: string): Promise<any | null> {
    // Simula busca no banco
    if (email === 'exists@test.com') {
      return { id: '1', email };
    }
    return null;
  }

  async create(userData: any): Promise<any> {
    // Simula criação
    return {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date()
    };
  }
}

class PasswordService {
  async hash(password: string): Promise<string> {
    // Simula hash da senha
    return `hashed_${password}`;
  }
}

class EmailService {
  async sendWelcome(email: string, name: string): Promise<boolean> {
    // Simula envio de email
    if (email === 'fail@test.com') {
      throw new Error('Falha no envio');
    }
    return true;
  }
}

// Use Case principal
@Injectable()
class CreateUserUseCase extends UseCase<CreateUserInput, CreateUserOutput> {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService
  ) {
    super();
  }

  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput>> {
    console.log('🏗️ Executando CreateUserUseCase...');

    // 1. Validar input usando ResultWrapValue
    const inputValidation = ResultWrapValue(input, {
      customValidation: (data) => {
        const errors: string[] = [];
        if (!data.name || data.name.length < 2) errors.push('Nome deve ter pelo menos 2 caracteres');
        if (!data.email?.includes('@')) errors.push('Email inválido');
        if (!data.password || data.password.length < 8) errors.push('Senha deve ter pelo menos 8 caracteres');
        return errors.length > 0 ? errors.join(', ') : true;
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
        console.warn('⚠️ Falha ao enviar email de boas-vindas:', emailResult.getError().message);
      } else {
        console.log('✅ Email de boas-vindas enviado com sucesso');
      }
    });

    const user = createResult.getValue();
    return Success({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  }
}

// Controller
@Controller('users')
class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  @Post()
  async createUser(@Body() body: CreateUserInput) {
    const result = await this.createUserUseCase.call(body);
    
    return result
      .onSuccess((user) => {
        console.log('✅ Usuário criado com sucesso:', user.name);
        return { success: true, data: user };
      })
      .onFailure((error) => {
        console.log('❌ Erro de validação:', error.message);
        throw new Error(`BadRequest: ${error.message}`);
      }, 'VALIDATION_ERROR')
      .onFailure((error) => {
        console.log('❌ Email já existe:', error.message);
        throw new Error(`Conflict: ${error.message}`);
      }, 'CONFLICT_ERROR')
      .onFailure((error) => {
        console.log('❌ Erro interno:', error.message);
        throw new Error('InternalServerError');
      });
  }
}

async function nestjsExample() {
  console.log('🏠 === INTEGRAÇÃO COM NESTJS ===\n');

  // Simular injeção de dependências
  const userRepository = new UserRepository();
  const passwordService = new PasswordService();
  const emailService = new EmailService();
  
  const createUserUseCase = new CreateUserUseCase(userRepository, passwordService, emailService);
  const userController = new UserController(createUserUseCase);

  // Teste 1: Usuário válido
  console.log('📝 Criando usuário válido:');
  try {
    const result1 = await userController.createUser({
      name: 'João Silva',
      email: 'joao@test.com',
      password: 'senha123456'
    });
    console.log('   Resultado:', result1);
  } catch (error) {
    console.log('   Erro capturado:', (error as Error).message);
  }

  // Teste 2: Email já existe
  console.log('\n📝 Tentando criar usuário com email existente:');
  try {
    const result2 = await userController.createUser({
      name: 'Maria Silva',
      email: 'exists@test.com',
      password: 'senha123456'
    });
  } catch (error) {
    console.log('   Erro capturado:', (error as Error).message);
  }

  // Teste 3: Dados inválidos
  console.log('\n📝 Tentando criar usuário com dados inválidos:');
  try {
    const result3 = await userController.createUser({
      name: 'A',
      email: 'email-inválido',
      password: '123'
    });
  } catch (error) {
    console.log('   Erro capturado:', (error as Error).message);
  }
}

// =============================================================================
// 2. INTEGRAÇÃO COM EXPRESS
// =============================================================================

// Simula tipos do Express
interface Request {
  body: any;
  params: any;
  query: any;
}

interface Response {
  status: (code: number) => Response;
  json: (data: any) => Response;
}

// Service layer para Express
class UserService {
  private users: any[] = [
    { id: '1', name: 'João', email: 'joao@test.com', active: true },
    { id: '2', name: 'Maria', email: 'maria@test.com', active: false }
  ];

  async getUser(id: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    
    if (!user.active) {
      throw new Error('Usuário inativo');
    }
    
    return user;
  }

  validateUserData(data: any): boolean {
    if (!data.name || data.name.length < 2) {
      throw new ValidationError('Nome inválido');
    }
    if (!data.email?.includes('@')) {
      throw new ValidationError('Email inválido');
    }
    return true;
  }
}

// Controllers para Express
class ExpressUserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response) {
    console.log('🔍 Buscando usuário:', req.params.id);

    // Validar ID usando ResultWrapValue
    const idValidation = ResultWrapValue(req.params.id, {
      nullAsFailure: true,
      emptyStringAsFailure: true,
      customValidation: (id) => {
        if (typeof id !== 'string') return 'ID deve ser string';
        if (id.length < 1) return 'ID não pode estar vazio';
        return true;
      },
      defaultFailureType: 'INVALID_ID'
    });

    if (idValidation.isFailure()) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        message: idValidation.getError().message 
      });
    }

    // Buscar usuário usando ResultAsyncWrapper
    const userResult = await ResultAsyncWrapper(
      this.userService.getUser.bind(this.userService),
      [req.params.id],
      {
        errorMappings: [
          { errorType: NotFoundError, failureType: 'NOT_FOUND' }
        ],
        defaultFailureType: 'USER_ERROR'
      }
    );

    return userResult
      .onSuccess((user) => {
        console.log('   ✅ Usuário encontrado:', user.name);
        return res.status(200).json({ success: true, user });
      })
      .onFailure((error) => {
        console.log('   ❌ Usuário não encontrado');
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }, 'NOT_FOUND')
      .onFailure((error) => {
        console.log('   ❌ Erro interno:', error.message);
        return res.status(500).json({ error: 'Erro interno' });
      });
  }

  async createUser(req: Request, res: Response) {
    console.log('🆕 Criando usuário:', req.body);

    // Validar dados usando ResultWrapValue
    const dataValidation = ResultWrapValue(req.body, {
      nullAsFailure: true,
      emptyObjectAsFailure: true,
      customValidation: (data) => {
        if (!data.name || data.name.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (!data.email?.includes('@')) return 'Email inválido';
        return true;
      },
      defaultFailureType: 'VALIDATION_ERROR'
    });

    if (dataValidation.isFailure()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        message: dataValidation.getError().message 
      });
    }

    // Validar usando service
    const serviceValidation = ResultWrapper(
      this.userService.validateUserData.bind(this.userService),
      [req.body],
      {
        errorMappings: [
          { errorType: ValidationError, failureType: 'SERVICE_VALIDATION_ERROR' }
        ]
      }
    );

    return serviceValidation
      .onSuccess((isValid) => {
        console.log('   ✅ Usuário criado com sucesso');
        return res.status(201).json({ 
          success: true, 
          user: { id: Date.now().toString(), ...req.body } 
        });
      })
      .onFailure((error) => {
        console.log('   ❌ Erro de validação:', error.message);
        return res.status(400).json({ error: error.message });
      }, 'SERVICE_VALIDATION_ERROR')
      .onFailure((error) => {
        console.log('   ❌ Erro genérico:', error.message);
        return res.status(500).json({ error: 'Erro interno' });
      });
  }
}

async function expressExample() {
  console.log('\n\n🚀 === INTEGRAÇÃO COM EXPRESS ===\n');

  const userService = new UserService();
  const controller = new ExpressUserController(userService);

  // Mock objects para simular Express
  const createMockResponse = () => {
    const res: any = {
      status: function(code: number) { 
        this.statusCode = code; 
        return this; 
      },
      json: function(data: any) { 
        console.log(`   📤 Response ${this.statusCode}:`, data);
        return this; 
      }
    };
    return res;
  };

  // Teste 1: Buscar usuário existente
  console.log('📝 Buscando usuário existente:');
  await controller.getUser(
    { params: { id: '1' }, body: {}, query: {} },
    createMockResponse()
  );

  // Teste 2: Buscar usuário inexistente
  console.log('\n📝 Buscando usuário inexistente:');
  await controller.getUser(
    { params: { id: '999' }, body: {}, query: {} },
    createMockResponse()
  );

  // Teste 3: ID inválido
  console.log('\n📝 ID inválido:');
  await controller.getUser(
    { params: { id: '' }, body: {}, query: {} },
    createMockResponse()
  );

  // Teste 4: Criar usuário válido
  console.log('\n📝 Criando usuário válido:');
  await controller.createUser(
    { 
      params: {}, 
      body: { name: 'Pedro Santos', email: 'pedro@test.com' }, 
      query: {} 
    },
    createMockResponse()
  );

  // Teste 5: Criar usuário inválido
  console.log('\n📝 Criando usuário inválido:');
  await controller.createUser(
    { 
      params: {}, 
      body: { name: 'A', email: 'invalid' }, 
      query: {} 
    },
    createMockResponse()
  );
}

// =============================================================================
// 3. INTEGRAÇÃO COM BIBLIOTECAS EXTERNAS
// =============================================================================

async function libraryIntegrationExample() {
  console.log('\n\n📚 === INTEGRAÇÃO COM BIBLIOTECAS ===\n');

  // Exemplo 1: Axios-like HTTP client
  console.log('📝 Simulação de cliente HTTP:');
  
  const httpClient = {
    async get(url: string): Promise<any> {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (url.includes('404')) {
        throw new Error('Not Found');
      }
      if (url.includes('500')) {
        throw new Error('Internal Server Error');
      }
      
      return { 
        data: { id: 1, message: 'Success' },
        status: 200,
        headers: {}
      };
    }
  };

  const urls = [
    'https://api.example.com/users/1',
    'https://api.example.com/users/404',
    'https://api.example.com/users/500'
  ];

  for (const url of urls) {
    console.log(`\n   🌐 Fazendo request para: ${url}`);
    
    const result = await ResultAsyncWrapper(
      httpClient.get.bind(httpClient),
      [url],
      {
        defaultFailureType: 'HTTP_ERROR',
        context: { url, timestamp: new Date() }
      }
    );

    result
      .onSuccess((response) => {
        console.log('     ✅ Request bem-sucedido:', response.data);
      })
      .onFailure((error) => {
        console.log('     ❌ Request falhou:', error.message);
        console.log('     📊 Contexto:', result.context);
      });
  }

  // Exemplo 2: Database ORM
  console.log('\n📝 Simulação de ORM:');
  
  const orm = {
    users: {
      async findOne(criteria: any): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (criteria.id === 'not-found') return null;
        if (criteria.id === 'error') throw new Error('Database connection failed');
        
        return { id: criteria.id, name: 'User from DB' };
      },
      
      async create(data: any): Promise<any> {
        if (!data.name) throw new ValidationError('Name is required');
        return { id: Date.now(), ...data };
      }
    }
  };

  // Buscar usuário
  const searchResult = await ResultAsyncWrapper(
    orm.users.findOne.bind(orm.users),
    [{ id: 'user123' }],
    { defaultFailureType: 'DATABASE_ERROR' }
  );

  searchResult
    .onSuccess((user) => console.log('   ✅ Usuário encontrado no ORM:', user))
    .onFailure((error) => console.log('   ❌ Erro no ORM:', error.message));

  // Criar usuário com validação
  const createData = { name: 'Novo Usuário', email: 'novo@test.com' };
  const createResult = await ResultAsyncWrapper(
    orm.users.create.bind(orm.users),
    [createData],
    {
      errorMappings: [
        { errorType: ValidationError, failureType: 'ORM_VALIDATION_ERROR' }
      ]
    }
  );

  createResult
    .onSuccess((user) => console.log('   ✅ Usuário criado no ORM:', user))
    .onFailure((error) => console.log('   ❌ Erro de validação do ORM'), 'ORM_VALIDATION_ERROR');
}

// =============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// =============================================================================

async function runFrameworkIntegrationExamples() {
  console.log('🚀 Exemplos de Integração com Frameworks\n');
  
  await nestjsExample();
  await expressExample();
  await libraryIntegrationExample();
  
  console.log('\n✨ Exemplos de integração concluídos!\n');
}

// Executar se for chamado diretamente
if (require.main === module) {
  runFrameworkIntegrationExamples().catch(console.error);
}

export { runFrameworkIntegrationExamples };