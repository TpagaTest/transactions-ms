import { Test, TestingModule } from '@nestjs/testing';
import { Repository, ObjectLiteral } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TransactionsService } from './transactions.service';

const mockTransaction = {
  id: 1,
  amount: 100,
  userId: 1,
  description: 'Test Transaction',
  createdAt: new Date().toISOString(),
};

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: MockRepository;

  beforeEach(async () => {
    transactionRepo = {
      create: jest.fn().mockReturnValue(mockTransaction),
      save: jest.fn().mockResolvedValue(mockTransaction),
      findAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      merge: jest.fn().mockReturnValue(mockTransaction),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepo,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const dto: CreateTransactionDto = {
        amount: 100,
        userId: 1,
        description: 'Test Transaction',
        createdAt: new Date().toISOString(),
      };
      await expect(service.create(dto)).resolves.toEqual(mockTransaction);
      expect(transactionRepo.create).toHaveBeenCalledWith(dto);
      expect(transactionRepo.save).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      await expect(service.findAll(paginationDto)).resolves.toEqual({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(transactionRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      await expect(service.findOne(1)).resolves.toEqual(mockTransaction);
      expect(transactionRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const updateDto: { id: number; userId: number, body: any } = {
        id: 1,
        userId: 1,
        body: {
          amount: 200,
        },
      };
      await expect(service.update(updateDto.id, updateDto.body, updateDto.userId)).resolves.toEqual(mockTransaction);
      expect(transactionRepo.merge).toHaveBeenCalledWith(mockTransaction, updateDto.body);
      expect(transactionRepo.save).toHaveBeenCalledWith(mockTransaction);
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      jest.spyOn(transactionRepo, 'findOne').mockResolvedValue(null);
      await expect(service.update(99, {} as UpdateTransactionDto, 1))
        .rejects.toThrow(BadRequestException);
    });
  });
});
export { TransactionsService };

