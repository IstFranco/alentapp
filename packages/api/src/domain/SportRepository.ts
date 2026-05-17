import { Sport } from './Sport.js';

export interface SportRepository {
    create(sport: Omit<Sport, 'id'>): Promise<Sport>;
    findByName(name: string): Promise<Sport | null>;
    findById(id: string): Promise<Sport | null>;
    findAll(name?: string): Promise<Sport[]>;
}
