import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>
  ) {}

  create(createTransactionDto: CreateTransactionDto) {
    createTransactionDto.createdAt = new Date().toISOString();
    const newTransaction = this.transactionRepo.create(createTransactionDto);
    return this.transactionRepo.save(newTransaction);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, userId } = paginationDto;
  
    const [transactions, total] = await this.transactionRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: "DESC" },
    });
  
    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  
  findOne(id: number) {
    return  this.transactionRepo.findOne({where: {id}});
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto, userId) {
    const transaction = await this.transactionRepo.findOne({ where: { id } });
    if (!transaction) {
      throw new BadRequestException(`Transaction with ID ${id} not found`);
    }
    
    if (transaction?.userId !== userId) {
      throw new BadRequestException('You do not have access to this transaction');
    }
    
    this.transactionRepo.merge(transaction, updateTransactionDto);
    return this.transactionRepo.save(transaction);
  }

}
