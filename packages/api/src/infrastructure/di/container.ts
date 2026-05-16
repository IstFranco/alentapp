import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/index.js';
import { PrismaEquipmentLoanRepository } from '../repositories/PrismaEquipmentLoanRepository.js';
import { PostgresMemberRepository } from '../PostgresMemberRepository.js';
import { CreateEquipmentLoanUseCase } from '../../application/use-cases/CreateEquipmentLoanUseCase.js';
import { ReturnEquipmentLoanUseCase } from '../../application/use-cases/ReturnEquipmentLoanUseCase.js';
import { CancelEquipmentLoanUseCase } from '../../application/use-cases/CancelEquipmentLoanUseCase.js';
import { EquipmentLoanController } from '../../delivery/controllers/EquipmentLoanController.js';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private prisma: PrismaClient;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL enviroment variable is not set');
    }

    this.prisma = new PrismaClient({
      adapter: new PrismaPg(process.env.DATABASE_URL),
    })
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  getEquipmentLoanController(): EquipmentLoanController {
    const equipmentLoanRepository = new PrismaEquipmentLoanRepository(this.prisma);
    const memberRepository = new PostgresMemberRepository();
    
    const createEquipmentLoanUseCase = new CreateEquipmentLoanUseCase(
      equipmentLoanRepository,
      memberRepository
    );
    
    const returnEquipmentLoanUseCase = new ReturnEquipmentLoanUseCase(
      equipmentLoanRepository
    );

    const cancelEquipmentLoanUseCase = new CancelEquipmentLoanUseCase(
      equipmentLoanRepository
    );

    return new EquipmentLoanController(
      createEquipmentLoanUseCase,
      returnEquipmentLoanUseCase,
      cancelEquipmentLoanUseCase
    );
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
