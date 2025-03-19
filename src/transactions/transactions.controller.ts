import { Controller, UnauthorizedException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @MessagePattern('createTransaction')
  create(@Payload() createTransactionDto: CreateTransactionDto) {
    try {
      return this.transactionsService.create(createTransactionDto);
    } catch (error) {
      throw new RpcException(error.message || 'Find transactions failed');
    }
  }

  @MessagePattern('findAllTransactions')
  findAll(@Payload() paginationDto: PaginationDto) {
    try {
      return this.transactionsService.findAll(paginationDto);
    } catch (error) {
      throw new RpcException(error.message || 'Find transactions failed');
    }
  }

  @MessagePattern('findOneTransaction')
  async findOne(@Payload() payload: {id: number, userId: number}) {
    try {
      const {id, userId} = payload;
      const transaction = await this.transactionsService.findOne(id);
      if (!transaction) throw new RpcException(new UnauthorizedException('Transaction not found'));
      if (transaction.userId !== userId) {
        throw new RpcException(new UnauthorizedException('You do not have access to this transaction'));
      }
      return transaction;
    } catch (error) {
      throw new RpcException(error.message || 'Find transaction failed');
    }   
  }

  @MessagePattern('updateTransaction')
  async update(@Payload() payload: { id: number; body: UpdateTransactionDto, userId: number }) {
    try {
      const { id, body, userId } = payload;
      return await this.transactionsService.update(id, body, userId);
    } catch (error) {
      throw new RpcException(error.message || 'Update transaction failed');
    }
  }
}
