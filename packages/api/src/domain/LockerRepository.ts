import { Locker } from './Locker';

export interface LockerRepository {
  save(locker: Omit<Locker, 'id'>): Promise<Locker>;
  findByNumber(number: number): Promise<Locker | null>;
  findById(id: string): Promise<Locker | null>;
  deleteById(id: string): Promise<void>;
  update(id: string, data: Partial<Omit<Locker, 'id' | 'number'>>): Promise<Locker>;
}
