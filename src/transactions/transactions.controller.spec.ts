import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionService = {
    create: jest.fn(dto => ({ id: 1, ...dto })),
    findAll: jest.fn(() => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })),
    findOne: jest.fn(id => (id === 1 ? { id, amount: 100 } : null)),
    update: jest.fn((id, dto) => ({ id, ...dto })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{
        provide: TransactionsService,
        useValue: mockTransactionService,
      }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a transaction', async () => {
    const dto: CreateTransactionDto = {
      amount: 100,
      userId: 1,
      description: 'Test',
      createdAt: new Date().toISOString(),
    };
    expect(await controller.create(dto)).toEqual({ id: 1, ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all transactions', async () => {
    const paginationDto: PaginationDto = { page: 1, limit: 10 };
    expect(await controller.findAll(paginationDto))
    .toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    expect(service.findAll).toHaveBeenCalledWith(paginationDto);
  });

  it('should return a single transaction if found and authorized', async () => {
    const mockTransaction = { id: 1, amount: 100, userId: 1 };
    
    (service.findOne as jest.Mock).mockResolvedValue(mockTransaction);

    const result = await controller.findOne({ id: 1, userId: 1 });

    expect(result).toEqual(mockTransaction);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw an error if the transaction is not found', async () => {
    (service.findOne as jest.Mock).mockResolvedValue(null);
    await expect(controller.findOne({ id: 1, userId: 1 })).rejects.toThrow(RpcException);
  });

  it('should throw an error if the user is not authorized', async () => {
    const mockTransaction = { id: 1, amount: 100, userId: 2 };
    (service.findOne as jest.Mock).mockResolvedValue(mockTransaction);
    await expect(controller.findOne({ id: 1, userId: 1 })).rejects.toThrow(RpcException);
  });
  
  it('should update a transaction', async () => {
    const updateDto: UpdateTransactionDto = {
      amount: 200,
      id: 1,
    };
    const updatedTransaction = { id: 1, amount: 200, userId: 1 };
    (service.update as jest.Mock).mockResolvedValue(updatedTransaction);
    const result = await controller.update({ id: 1, body: updateDto, userId: 1 });
    expect(result).toEqual(updatedTransaction);
    expect(service.update).toHaveBeenCalledWith(1, updateDto, 1);
  });

  it('should throw an error if update fails', async () => {
    (service.update as jest.Mock).mockRejectedValue(new Error('Update failed'));
    await expect(controller.update({ id: 1, body: {
      amount: 200,
      id: 1
    }, userId: 1 })).rejects.toThrow(RpcException);
  });
});
