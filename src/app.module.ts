import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { TransactionsModule } from './transactions/transactions.module';
import { Transaction } from './transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'database',
      port: 5432,
      username: 'postgres',
      database: 'tpaga',
      password: 'postgres',
      entities: [Transaction],
      synchronize: false,
      retryDelay: 3000,
      retryAttempts: 10,
    }),
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
