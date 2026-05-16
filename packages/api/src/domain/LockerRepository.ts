import { Locker } from './Locker';

export interface LockerRepository {
  save(locker: Omit<Locker, 'id'>): Promise<Locker>;
  findByNumber(number: number): Promise<Locker | null>;
}

